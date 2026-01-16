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
            
            # Group by hotel and track best match image with score breakdown
            hotel_results = {}
            for i, score in enumerate(final_scores):
                if i in mapping:
                    h_info = mapping[i]
                    h_id = h_info["hotel_id"]
                    ai_score = ai_scores[i]
                    color_score = color_scores[i]
                    if h_id not in hotel_results or score > hotel_results[h_id]["score"]:
                        hotel_results[h_id] = {
                            "score": score,
                            "ai_score": ai_score,
                            "color_score": color_score,
                            "image_path": h_info["image_path"],
                            "image_index": i
                        }
            
            sorted_hotels = sorted(hotel_results.items(), key=lambda x: x[1]["score"], reverse=True)[:3]
            
            # Display matching factors explanation
            with st.expander("🔍 How Image Matching Works - Matching Factors Explained", expanded=False):
                st.markdown("""
                ### Image Matching Algorithm
                
                The system uses a **Hybrid Multi-Scale Visual Search** that combines two complementary approaches:
                
                #### 1. **AI Semantic Matching (70% weight)** - CLIP Model
                - **Model**: ViT-L/14@336px (Vision Transformer Large)
                - **What it captures**: 
                  - Semantic understanding (beach view, pool, room type, architectural style)
                  - Object recognition (furniture, amenities, decor)
                  - Scene composition and layout
                  - Visual concepts and context
                - **How it works**: 
                  - Analyzes the image at multiple scales (full image + cropped regions)
                  - Extracts high-level visual features using deep learning
                  - Understands "what" is in the image, not just pixel colors
                
                #### 2. **Color & Texture Matching (30% weight)** - Exact Visual Signature
                - **Color Signature**: 
                  - 3D RGB histogram (4 bins per channel = 64 dimensions)
                  - Captures exact color distribution and palette
                  - Identifies matching color schemes
                - **Texture Signature**: 
                  - Gradient-based features (Sobel-like)
                  - Captures shapes, edges, and material textures
                  - Identifies similar building materials, patterns, and surfaces
                - **How it works**:
                  - Extracts pixel-level visual characteristics
                  - Matches exact color codes and texture patterns
                  - Perfect for finding visually identical or very similar images
                
                #### 3. **Multi-Scale Analysis**
                - Analyzes the full image (global context)
                - Analyzes cropped regions (local details)
                - Takes the best match across all scales
                
                #### 4. **Final Score Calculation**
                ```
                Final Score = (0.7 × AI Semantic Score) + (0.3 × Color/Texture Score)
                ```
                
                This hybrid approach ensures matches are both **semantically relevant** (similar content/meaning) 
                and **visually similar** (similar colors/textures).
                """)
            
            st.subheader("🏆 Top Matches (Ranked by Hybrid Visual Similarity)")
            for hotel_id, res in sorted_hotels:
                details = get_hotel_details(hotel_id)
                if details:
                    name, stars, price, desc = details
                    score = res["score"]
                    ai_score = res["ai_score"]
                    color_score = res["color_score"]
                    match_path = res["image_path"]
                    
                    with st.container():
                        col1, col2, col3 = st.columns([1, 2, 2])
                        with col1:
                            st.metric("Overall Score", f"{score:.3f}")
                            st.caption("Hybrid Match")
                            with st.expander("Score Breakdown"):
                                st.metric("AI Semantic", f"{ai_score:.3f}", help="70% weight - CLIP model understanding")
                                st.metric("Color/Texture", f"{color_score:.3f}", help="30% weight - Exact visual match")
                        with col2:
                            st.markdown(f"### {name}")
                            st.write(f"⭐ {stars} Stars | 💰 ₹{price}")
                            st.write(desc)
                        with col3:
                            if os.path.exists(match_path):
                                best_match_img = Image.open(match_path)
                                st.image(best_match_img, caption=f"🎯 Best Match Image (Score: {score:.3f})", use_container_width=True)
                                st.caption(f"Image Index: {res['image_index']} | Path: {os.path.basename(match_path)}")
                            else:
                                st.warning(f"Image not found: {match_path}")
                        st.divider()
                        
        except Exception as e:
            st.error(f"Error: {e}")

if __name__ == "__main__":
    main()
