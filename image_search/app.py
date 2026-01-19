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
    
    # Get the directory where app.py is located
    base_path = os.path.dirname(os.path.abspath(__file__))
    
    ai_feat_path = os.path.join(base_path, "hotel_features_ai.npy")
    color_feat_path = os.path.join(base_path, "hotel_features_color.npy")
    mapping_path = os.path.join(base_path, "mapping.pkl")

    ai_features = np.load(ai_feat_path) if os.path.exists(ai_feat_path) else None
    color_features = np.load(color_feat_path) if os.path.exists(color_feat_path) else None
    
    if not os.path.exists(mapping_path):
        st.error(f"Required file not found: {mapping_path}")
        st.stop()

    with open(mapping_path, "rb") as f:
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
    # Get the directory where app.py is located
    base_path = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(base_path, "hotels.db")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name, stars, price, description, external_link FROM hotels WHERE id = ?", (hotel_id,))
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
            
            # --- FEATURE DETECTION (New) ---
            visual_features = [
                "wooden flooring", "infinity pool", "modern decor", "traditional style", 
                "beach view", "lush garden", "glass facade", "cozy lighting",
                "spacious room", "balcony", "city skyline", "mountain view"
            ]
            
            detected_tags = []
            with torch.no_grad():
                text_tokens = clip.tokenize(visual_features).to("cpu")
                image_input = preprocess(enhanced_image).unsqueeze(0).to("cpu")
                logits_per_image, _ = model(image_input, text_tokens)
                probs = logits_per_image.softmax(dim=-1).cpu().numpy()[0]
                
                # Take features with > 15% probability confidence
                for i, prob in enumerate(probs):
                    if prob > 0.15:
                        detected_tags.append(visual_features[i].title())
            
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
            
            # --- PREPARE DATA FOR UI & FRONTEND ---
            final_output = []
            
            st.subheader("Top Matches (Ranked by Color, Shape & Semantic Similarity)")
            for hotel_id, res in sorted_hotels:
                details = get_hotel_details(hotel_id)
                if details:
                    name, stars, price, desc, link = details
                    score = res["score"]
                    ai_score = res["ai_score"]
                    color_score = res["color_score"]
                    match_path = res["image_path"]
                    
                    # Add to JSON output list
                    final_output.append({
                        "score": round(float(score), 2),
                        "name": name,
                        "description": desc,
                        "price": price,
                        "rating": stars,
                        "best_match_photo": match_path,
                        "detected_features": detected_tags + [f"{int(score*100)}% Match"],
                        "external_link": link
                    })
                    
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
                            
                            # Display Detected Feature Tags
                            if detected_tags:
                                tag_html = "".join([f'<span style="background-color: #f0f2f6; color: #31333f; padding: 4px 10px; border-radius: 15px; margin-right: 5px; font-size: 0.8rem; border: 1px solid #dfe2e6;">{tag}</span>' for tag in detected_tags])
                                st.markdown(tag_html, unsafe_allow_html=True)
                                st.write("") # Spacer
                                
                            st.write(desc)
                            if link:
                                st.markdown(f"[🔗 View on MakeMyTrip]({link})")
                        with c3:
                            # Robust path resolution for images
                            full_match_path = match_path
                            if not os.path.isabs(full_match_path):
                                # Potential base directories to check
                                app_dir = os.path.dirname(os.path.abspath(__file__))
                                project_root = os.path.dirname(app_dir)
                                parent_dir = os.path.dirname(project_root)
                                
                                possible_paths = [
                                    os.path.join(app_dir, match_path),
                                    os.path.join(project_root, match_path),
                                    os.path.join(parent_dir, match_path)
                                ]
                                
                                for p in possible_paths:
                                    if os.path.exists(p):
                                        full_match_path = p
                                        break
                            
                            if os.path.exists(full_match_path):
                                st.image(Image.open(full_match_path), caption="Exact Texture Match", use_container_width=True)
                            else:
                                st.warning(f"Image not found: {match_path}")
                        st.divider()
            
            # Show JSON for Developer
            with st.expander("🛠 Developer Tools: JSON Output for Frontend"):
                st.json(final_output)
                        
        except Exception as e:
            st.error(f"Error: {e}")

if __name__ == "__main__":
    main()
