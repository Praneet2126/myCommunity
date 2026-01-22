"""
Image Search Service
Integrates visual search AI from image_search module
"""
import sys
import os
from pathlib import Path
import numpy as np
import pickle
import torch
from PIL import Image, ImageOps, ImageFilter
import sqlite3
from typing import List, Dict, Any, Optional, Tuple

try:
    import clip
except ImportError:
    clip = None

# Add image_search to path
image_search_path = Path(__file__).parent.parent.parent / "image_search"
if str(image_search_path) not in sys.path:
    sys.path.insert(0, str(image_search_path))


class ImageSearchService:
    """Service for visual image search using CLIP and color/texture matching"""
    
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = None
        self.preprocess = None
        self.ai_features = None
        self.color_features = None
        self.mapping = None
        self._load_resources()
    
    def _load_resources(self):
        """Load CLIP model and feature vectors"""
        try:
            if clip is None:
                print("Warning: CLIP not available. Image search will use fallback.")
                return
            
            # Load CLIP model
            self.model, self.preprocess = clip.load("ViT-L/14@336px", device=self.device)
            
            # Load feature vectors and mapping
            image_search_path = Path(__file__).parent.parent.parent / "image_search"
            
            ai_features_path = image_search_path / "hotel_features_ai.npy"
            color_features_path = image_search_path / "hotel_features_color.npy"
            mapping_path = image_search_path / "mapping.pkl"
            
            if ai_features_path.exists():
                self.ai_features = np.load(str(ai_features_path))
            if color_features_path.exists():
                self.color_features = np.load(str(color_features_path))
            if mapping_path.exists():
                with open(mapping_path, "rb") as f:
                    self.mapping = pickle.load(f)
                    
            print(f"Image search service loaded: {len(self.mapping) if self.mapping else 0} images indexed")
        except Exception as e:
            print(f"Error loading image search resources: {e}")
    
    def extract_color_texture_signature(self, image: Image.Image) -> np.ndarray:
        """Extract color and texture signature from image"""
        img_small = image.resize((64, 64))
        img_arr = np.array(img_small)
        
        # Color histogram
        hist, _ = np.histogramdd(img_arr.reshape(-1, 3), bins=(4, 4, 4), range=((0,256), (0,256), (0,256)))
        hist = hist.flatten()
        hist /= (hist.sum() + 1e-7)
        
        # Texture signature
        img_gray = ImageOps.grayscale(img_small)
        img_gray_arr = np.array(img_gray).astype(float)
        dx = np.diff(img_gray_arr, axis=1)
        dy = np.diff(img_gray_arr, axis=0)
        texture_sig = np.array([np.mean(dx**2), np.std(dx**2), np.mean(dy**2), np.std(dy**2)])
        texture_sig /= (np.linalg.norm(texture_sig) + 1e-7)
        
        return np.concatenate([hist, texture_sig]).astype("float32")
    
    def get_hotel_details(self, hotel_id: int) -> Optional[Dict[str, Any]]:
        """Get hotel details from database"""
        try:
            image_search_path = Path(__file__).parent.parent.parent / "image_search"
            db_path = image_search_path / "hotels.db"
            
            if not db_path.exists():
                return None
                
            conn = sqlite3.connect(str(db_path))
            cursor = conn.cursor()
            cursor.execute("SELECT name, stars, price, description FROM hotels WHERE id = ?", (hotel_id,))
            row = cursor.fetchone()
            conn.close()
            
            if row:
                return {
                    "name": row[0],
                    "stars": row[1],
                    "price": row[2],
                    "description": row[3]
                }
            return None
        except Exception as e:
            print(f"Error getting hotel details: {e}")
            return None
    
    def _convert_path_to_api_url(self, file_path: str, hotel_name: str) -> str:
        """Convert file system path to API endpoint URL"""
        try:
            # Extract just the image filename from the full path
            from urllib.parse import quote
            image_filename = Path(file_path).name
            # Return API endpoint format
            return f"/api/hotels/{quote(hotel_name)}/image/{quote(image_filename)}"
        except Exception as e:
            print(f"Error converting path to URL: {e}")
            return file_path
    
    def search_similar_hotels(
        self, 
        image: Image.Image, 
        top_k: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Search for similar hotels based on image
        
        Args:
            image: PIL Image object
            top_k: Number of top matches to return
            
        Returns:
            List of hotel matches with scores and details
        """
        if self.model is None or self.ai_features is None or self.color_features is None:
            return []
        
        try:
            # Pre-process image
            enhanced_image = image.filter(ImageFilter.SHARPEN)
            enhanced_image = ImageOps.autocontrast(enhanced_image)
            
            # Multi-scale analysis
            w, h = enhanced_image.size
            crops = [
                enhanced_image,
                enhanced_image.crop((w*0.1, h*0.1, w*0.9, h*0.9)),
                enhanced_image.crop((w*0.2, h*0.2, w*0.8, h*0.8))
            ]
            
            # AI Semantic Score
            ai_scores_list = []
            with torch.no_grad():
                for crop in crops:
                    crop_input = self.preprocess(crop).unsqueeze(0).to(self.device)
                    feat = self.model.encode_image(crop_input)
                    feat /= feat.norm(dim=-1, keepdim=True)
                    ai_scores_list.append(np.dot(self.ai_features, feat.cpu().numpy().T).flatten())
            ai_scores = np.max(np.vstack(ai_scores_list), axis=0)
            
            # Color/Texture Score
            color_query = self.extract_color_texture_signature(enhanced_image)
            color_scores = np.dot(self.color_features, color_query.T).flatten()
            
            # Hybrid Fusion: 70% AI + 30% Color/Texture
            final_scores = (0.7 * ai_scores) + (0.3 * color_scores)
            
            # Group by hotel and track best match
            hotel_results = {}
            for i, score in enumerate(final_scores):
                if i in self.mapping:
                    h_info = self.mapping[i]
                    h_id = h_info["hotel_id"]
                    ai_score = ai_scores[i]
                    color_score = color_scores[i]
                    
                    if h_id not in hotel_results or score > hotel_results[h_id]["score"]:
                        hotel_results[h_id] = {
                            "score": float(score),
                            "ai_score": float(ai_score),
                            "color_score": float(color_score),
                            "image_path": h_info["image_path"],
                            "image_index": i
                        }
            
            # Sort and get top k
            sorted_hotels = sorted(hotel_results.items(), key=lambda x: x[1]["score"], reverse=True)[:top_k]
            
            # Format results
            results = []
            for hotel_id, res in sorted_hotels:
                hotel_details = self.get_hotel_details(hotel_id)
                if hotel_details:
                    # Convert file system path to API endpoint URL
                    image_path = res["image_path"]
                    best_match_url = self._convert_path_to_api_url(image_path, hotel_details["name"])
                    
                    result = {
                        "hotel_id": str(hotel_id),
                        "name": hotel_details["name"],
                        "stars": hotel_details["stars"],
                        "price": hotel_details["price"],
                        "description": hotel_details["description"],
                        "similarity_score": res["score"],
                        "score_breakdown": {
                            "ai_semantic_score": res["ai_score"],
                            "color_texture_score": res["color_score"]
                        },
                        "best_match_image_path": best_match_url,
                        "image_index": res["image_index"]
                    }
                    results.append(result)
            
            return results
            
        except Exception as e:
            print(f"Error in image search: {e}")
            return []
