import os
import json
import sqlite3
import pickle
import numpy as np
import sys
import torch
import clip
import torchvision.transforms as T
from PIL import Image, ImageOps, ImageFilter
from glob import glob
import random

def setup_database():
    conn = sqlite3.connect("hotels.db")
    cursor = conn.cursor()
    cursor.execute("DROP TABLE IF EXISTS hotels")
    cursor.execute("""
        CREATE TABLE hotels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            stars INTEGER,
            price INTEGER,
            description TEXT
        )
    """)
    conn.commit()
    return conn

def extract_color_texture_signature(image):
    # Resize to small for color consistency
    img_small = image.resize((64, 64))
    img_arr = np.array(img_small)
    
    # 1. Color Signature: 3D Histogram (4 bins per channel = 64 dims)
    # This captures the "Exact Color Codes" identity
    hist, _ = np.histogramdd(img_arr.reshape(-1, 3), bins=(4, 4, 4), range=((0,256), (0,256), (0,256)))
    hist = hist.flatten()
    hist /= (hist.sum() + 1e-7)
    
    # 2. Texture Signature: Sobel-like Gradients
    # Captures the "Shapes and Textures" of building materials
    img_gray = ImageOps.grayscale(img_small)
    img_gray_arr = np.array(img_gray).astype(float)
    dx = np.diff(img_gray_arr, axis=1)
    dy = np.diff(img_gray_arr, axis=0)
    texture_sig = np.array([np.mean(dx**2), np.std(dx**2), np.mean(dy**2), np.std(dy**2)])
    texture_sig /= (np.linalg.norm(texture_sig) + 1e-7)
    
    return np.concatenate([hist, texture_sig]).astype("float32")

def main():
    device = "cpu"
    print("Loading High-Definition CLIP 'ViT-L/14@336px'...")
    try:
        model, preprocess = clip.load("ViT-L/14@336px", device=device)
        print("Model loaded successfully.")
    except Exception as e:
        print(f"Failed to load CLIP model: {e}")
        return
    
    conn = setup_database()
    cursor = conn.cursor()
    
    all_ai_features = []
    all_color_features = []
    mapping = {}
    faiss_id = 0
    
    if not os.path.exists("hotels"):
        print("Error: 'hotels' folder not found.")
        return

    hotel_folders = sorted([f for f in os.listdir("hotels") if os.path.isdir(os.path.join("hotels", f))])
    
    for folder in hotel_folders:
        folder_path = os.path.join("hotels", folder)
        info_path = os.path.join(folder_path, "info.json")
        if not os.path.exists(info_path): continue
            
        try:
            with open(info_path, "r") as f:
                data = json.load(f)
            
            cursor.execute("INSERT INTO hotels (name, stars, price, description) VALUES (?, ?, ?, ?)",
                         (data.get("name", folder), data.get("stars", 0), random.randint(5000, 25000), data.get("description", "")))
            hotel_id = cursor.lastrowid
            
            image_paths = []
            for ext in ("*.jpg", "*.jpeg", "*.png", "*.webp"):
                image_paths.extend(glob(os.path.join(folder_path, ext)))
                image_paths.extend(glob(os.path.join(folder_path, ext.upper())))
            
            image_paths = sorted(list(set(image_paths)))
            print(f"Indexing {data.get('name', folder)}...")
            
            for img_path in image_paths:
                try:
                    image = Image.open(img_path).convert("RGB")
                    
                    # AI Processing
                    image_input = preprocess(image).unsqueeze(0).to(device)
                    with torch.no_grad():
                        ai_feat = model.encode_image(image_input)
                        ai_feat /= ai_feat.norm(dim=-1, keepdim=True)
                    
                    # Exact Color/Texture Processing
                    color_feat = extract_color_texture_signature(image)
                    
                    all_ai_features.append(ai_feat.numpy().astype("float32"))
                    all_color_features.append(color_feat)
                    
                    mapping[faiss_id] = {"hotel_id": hotel_id, "image_path": img_path}
                    faiss_id += 1
                except Exception as e:
                    print(f"Skip {img_path}: {e}")
        except Exception as e:
            print(f"Error {folder}: {e}")
            
    conn.commit()
    conn.close()
    
    if all_ai_features:
        np.save("hotel_features_ai.npy", np.vstack(all_ai_features))
        np.save("hotel_features_color.npy", np.vstack(all_color_features))
        with open("mapping.pkl", "wb") as f:
            pickle.dump(mapping, f)
        print("Ingestion complete. Hybrid Index created.")

if __name__ == "__main__":
    main()
