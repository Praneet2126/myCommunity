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
    base_path = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(base_path, "hotels.db")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("DROP TABLE IF EXISTS hotels")
    cursor.execute("""
        CREATE TABLE hotels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            stars INTEGER,
            price INTEGER,
            description TEXT,
            external_link TEXT
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
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(base_dir)
    parent_dir = os.path.dirname(project_root)
    
    # Search for hotels folder in multiple locations
    possible_hotels_dirs = [
        os.path.join(base_dir, "hotels"),
        os.path.join(project_root, "hotels"),
        os.path.join(parent_dir, "hotels")
    ]
    
    hotels_dir = None
    for d in possible_hotels_dirs:
        if os.path.exists(d) and os.path.isdir(d):
            hotels_dir = d
            break
    
    if not hotels_dir:
        print(f"Error: 'hotels' folder not found. Checked: {possible_hotels_dirs}")
        return

    print(f"Using hotels directory: {hotels_dir}")
    hotel_folders = sorted([f for f in os.listdir(hotels_dir) if os.path.isdir(os.path.join(hotels_dir, f))])
    
    for folder in hotel_folders:
        folder_path = os.path.join(hotels_dir, folder)
        info_path = os.path.join(folder_path, "info.json")
        if not os.path.exists(info_path): continue
            
        try:
            with open(info_path, "r") as f:
                data = json.load(f)
            
            stars = data.get("stars")
            price = data.get("price")
            external_link = data.get("external_link", "")
            
            # Construct MakeMyTrip search link if no valid link exists
            if not external_link or "goibibo" in external_link.lower():
                import urllib.parse
                hotel_name = data.get('name', folder)
                search_query = hotel_name if "goa" in hotel_name.lower() else f"{hotel_name} Goa"
                encoded_name = urllib.parse.quote(search_query)
                external_link = f"https://www.makemytrip.com/hotels/hotel-listing/?searchText={encoded_name}"
            
            if not stars or stars == 0:
                stars = random.randint(3, 5)
                
            if not price or price == 0:
                price = random.randint(5000, 25000)
                
            amenities = data.get("amenities", [])
            description = data.get("description", "")
            
            # Create highly specific description based on actual amenities
            if "Detailed information for" in description or not description or "Verified property data" in description:
                features = []
                if any(a in str(amenities).lower() for a in ["pool", "swimming"]): features.append("a sparkling swimming pool")
                if any(a in str(amenities).lower() for a in ["spa", "massage"]): features.append("rejuvenating spa services")
                if any(a in str(amenities).lower() for a in ["gym", "fitness"]): features.append("a modern fitness center")
                if any(a in str(amenities).lower() for a in ["beach", "sea view"]): features.append("stunning coastal views")
                if any(a in str(amenities).lower() for a in ["restaurant", "dining"]): features.append("multi-cuisine dining options")
                
                if features:
                    desc_features = ", ".join(features[:-1]) + (f" and {features[-1]}" if len(features) > 1 else features[0])
                    description = f"Welcome to {data.get('name', folder)}. This {stars}-star property features {desc_features}, making it a top choice for travelers."
                else:
                    description = f"Experience world-class hospitality at {data.get('name', folder)}, featuring essential amenities and comfortable accommodations."

            cursor.execute("INSERT INTO hotels (name, stars, price, description, external_link) VALUES (?, ?, ?, ?, ?)",
                         (data.get("name", folder), stars, price, description, external_link))
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
        ai_feat_path = os.path.join(base_dir, "hotel_features_ai.npy")
        color_feat_path = os.path.join(base_dir, "hotel_features_color.npy")
        mapping_path = os.path.join(base_dir, "mapping.pkl")
        
        np.save(ai_feat_path, np.vstack(all_ai_features))
        np.save(color_feat_path, np.vstack(all_color_features))
        with open(mapping_path, "wb") as f:
            pickle.dump(mapping, f)
        print(f"Ingestion complete. Hybrid Index created at {base_dir}")

if __name__ == "__main__":
    main()
