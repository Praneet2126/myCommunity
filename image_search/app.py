import streamlit as st
import torch
import clip
import torchvision.transforms as T
from PIL import Image, ImageOps, ImageFilter
import sqlite3
import pickle
import numpy as np
import os
import io

@st.cache_resource
def load_resources():
    device = "cpu"
    model, preprocess = clip.load("ViT-L/14@336px", device=device)
    
    ai_features = np.load("hotel_features_ai.npy") if os.path.exists("hotel_features_ai.npy") else None
    color_features = np.load("hotel_features_color.npy") if os.path.exists("hotel_features_color.npy") else None
    
    with open("mapping.pkl", "rb") as f:
        mapping = pickle.load(f)
    return model, preprocess, ai_features, color_features, mapping

def extract_color_texture_signature(image):
    img_small = image.resize((64, 64))
    img_arr = np.array(img_small)
    hist, _ = np.histogramdd(img_arr.reshape(-1, 3), bins=(4, 4, 4), range=((0,256), (0,256), (0,256)))
    hist = hist.flatten()
    hist /= (hist.sum() + 1e-7)
    img_gray = ImageOps.grayscale(img_small)
    img_gray_arr = np.array(img_gray).astype(float)
    dx = np.diff(img_gray_arr, axis=1)
    dy = np.diff(img_gray_arr, axis=0)
    texture_sig = np.array([np.mean(dx**2), np.std(dx**2), np.mean(dy**2), np.std(dy**2)])
    texture_sig /= (np.linalg.norm(texture_sig) + 1e-7)
    return np.concatenate([hist, texture_sig]).astype("float32")

def get_hotel_details(hotel_id):
    conn = sqlite3.connect("hotels.db")
    cursor = conn.cursor()
    cursor.execute("SELECT name, stars, price, description FROM hotels WHERE id = ?", (hotel_id,))
    row = cursor.fetchone()
    conn.close()
    return row

def main():
    st.set_page_config(layout="wide")
    st.title("MakeMyTrip: High-Fidelity Hybrid Visual Search")
    
    model, preprocess, ai_features, color_features, mapping = load_resources()
    
    uploaded_file = st.file_uploader("Upload an image (even blurry ones)", type=['png', 'jpg', 'jpeg', 'webp'])
    
    if uploaded_file is not None:
        try:
            image = Image.open(uploaded_file).convert("RGB")
            
            # --- ADVANCED PRE-PROCESSING (De-blurring) ---
            # 1. Sharpening filter to fix "blurry" input
            enhanced_image = image.filter(ImageFilter.SHARPEN)
            enhanced_image = ImageOps.autocontrast(enhanced_image)
            
            st.image(enhanced_image, caption="AI-Enhanced Input (Denoised)", use_container_width=False, width=400)
            
            # --- MULTI-SCALE HYBRID SEARCH ---
            w, h = enhanced_image.size
            # Analyze global and local regions
            crops = [
                enhanced_image,
                enhanced_image.crop((w*0.1, h*0.1, w*0.9, h*0.9)),
                enhanced_image.crop((w*0.2, w*0.2, w*0.8, h*0.8))
            ]
            
            st.info("Computing Global/Local dependencies & Color signatures...")
            
            # 1. AI Score (Semantic)
            ai_scores_list = []
            with torch.no_grad():
                for crop in crops:
                    crop_input = preprocess(crop).unsqueeze(0)
                    feat = model.encode_image(crop_input)
                    feat /= feat.norm(dim=-1, keepdim=True)
                    ai_scores_list.append(np.dot(ai_features, feat.numpy().T).flatten())
            ai_scores = np.max(np.vstack(ai_scores_list), axis=0)
            
            # 2. Color/Texture Score (Exact pixels/shapes)
            color_query = extract_color_texture_signature(enhanced_image)
            color_scores = np.dot(color_features, color_query.T).flatten()
            
            # 3. Hybrid Fusion: 70% Intelligence + 30% Exact Color/Texture
            final_scores = (0.7 * ai_scores) + (0.3 * color_scores)
            
            # Group by hotel
            hotel_results = {}
            for i, score in enumerate(final_scores):
                if i in mapping:
                    h_info = mapping[i]
                    h_id = h_info["hotel_id"]
                    if h_id not in hotel_results or score > hotel_results[h_id]["score"]:
                        hotel_results[h_id] = {"score": score, "image_path": h_info["image_path"]}
            
            sorted_hotels = sorted(hotel_results.items(), key=lambda x: x[1]["score"], reverse=True)[:3]
            
            st.subheader("Top Matches (Ranked by Color, Shape & Semantic Similarity)")
            for hotel_id, res in sorted_hotels:
                details = get_hotel_details(hotel_id)
                if details:
                    name, stars, price, desc = details
                    score = res["score"]
                    match_path = res["image_path"]
                    
                    with st.container():
                        c1, c2, c3 = st.columns([1, 2, 2])
                        with c1:
                            st.metric("Fidelity Score", f"{score:.2f}")
                        with c2:
                            st.markdown(f"### {name}")
                            st.write(f"⭐ {stars} Stars | 💰 ₹{price}")
                            st.write(desc)
                        with c3:
                            if os.path.exists(match_path):
                                st.image(Image.open(match_path), caption="Exact Texture Match", use_container_width=True)
                        st.divider()
                        
        except Exception as e:
            st.error(f"Error: {e}")

if __name__ == "__main__":
    main()
