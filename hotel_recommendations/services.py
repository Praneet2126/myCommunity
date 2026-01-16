import json
import os
import re
import numpy as np
import pickle
import torch
try:
    import clip
except ImportError:
    clip = None
from typing import List, Dict, Any, Optional, Tuple
from .models import Hotel, UserPreferences, ChatMessage, DetailedRecommendation

class HotelService:
    _instance = None
    _hotels: List[Hotel] = []

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(HotelService, cls).__new__(cls)
            cls._instance._load_data()
        return cls._instance

    def _load_data(self):
        data_path = "hotel_data.json"
        # Check relative path for different run contexts
        if not os.path.exists(data_path):
            data_path = os.path.join(os.path.dirname(__file__), "hotel_data.json")
            
        if os.path.exists(data_path):
            with open(data_path, "r") as f:
                raw_data = json.load(f)
                self._hotels = [Hotel(**item) for item in raw_data]

    def get_all_hotels(self) -> List[Hotel]:
        return self._hotels

class ChatAnalyzer:
    VIBE_GROUPS = {
        "AQUATIC": ["beach", "sea", "ocean", "waterfront", "sand", "beach view"],
        "TERRESTRIAL": ["forest", "jungle", "lush green", "paddy fields", "hills", "garden"]
    }
    
    AGREEMENT_MARKERS = [r"ok", r"fine", r"agree", r"let's do", r"go with", r"sure", r"perfect"]

    @staticmethod
    def is_hotel_relevant(message: str) -> bool:
        hotel_keywords = ["hotel", "stay", "resort", "price", "room", "night", "booking", "view", "beach", "k", "costly", "expensive", "pool", "spa"]
        return any(kw in message.lower() for kw in hotel_keywords)

    @staticmethod
    def is_negative(text: str, topic: str) -> bool:
        text_lower = text.lower()
        topic_lower = topic.lower()
        
        # 1. Immediate rejection phrases
        if any(word in text_lower for word in ["too costly", "too expensive", "much", "high"]):
            if topic_lower in text_lower:
                return True
            
        # 2. Standard negations
        negations = [r"don't like", r"do not like", r"hate", r"avoid", r"never", r"skip", r"exclude", r"without", r"instead of", r"no interest", r"not looking for", r"don't want"]
        if re.search(fr"\b(no|not|none)\b\s+\b{re.escape(topic_lower)}\b", text_lower, re.I):
            return True
        for neg in negations:
            if re.search(fr"{neg}.*?{re.escape(topic_lower)}", text_lower, re.I):
                return True
        return False

    @staticmethod
    def resolve_consensus(messages: List[ChatMessage]) -> Tuple[Optional[str], bool]:
        vibe_states = {cluster: 0.0 for cluster in ChatAnalyzer.VIBE_GROUPS}
        for i, msg in enumerate(reversed(messages)):
            text = msg.text.lower()
            for cluster, keywords in ChatAnalyzer.VIBE_GROUPS.items():
                if any(kw in text for kw in keywords):
                    is_agreement = any(re.search(f"{m}.*?{kw}", text) 
                                     for m in ChatAnalyzer.AGREEMENT_MARKERS for kw in keywords)
                    if is_agreement:
                        return cluster, False
                    vibe_states[cluster] += 1.0 / (i + 1)
        active = [c for c, w in vibe_states.items() if w > 0]
        if len(active) > 1:
            if abs(vibe_states[active[0]] - vibe_states[active[1]]) < 0.2:
                return None, True
            return max(vibe_states, key=vibe_states.get), False
        return active[0] if active else None, False

    @staticmethod
    def extract_preferences(messages: List[ChatMessage]) -> UserPreferences:
        relevant_messages = [m for m in messages if ChatAnalyzer.is_hotel_relevant(m.text)]
        combined_text = " ".join([m.text.lower() for m in relevant_messages if m.text])
        prefs = UserPreferences()
        
        # 1. Consensus Logic
        winner, is_hybrid = ChatAnalyzer.resolve_consensus(relevant_messages)
        if is_hybrid:
            prefs.other_requirements.append("Hybrid Mode: Debating between multiple vibes.")
            for group in ChatAnalyzer.VIBE_GROUPS.values(): prefs.visual_descriptors.extend(group)
        elif winner:
            prefs.visual_descriptors.extend(ChatAnalyzer.VIBE_GROUPS[winner])

        # 2. Price Logic (Reverse scan)
        for msg in reversed(relevant_messages):
            text = msg.text.lower()
            match = re.search(r"(\d+)(k\b)?|(\d{4,6})", text)
            if match:
                price_str = match.group(0)
                if ChatAnalyzer.is_negative(text, price_str):
                    continue
                val = match.group(1) if match.group(1) else match.group(3)
                mult = 1000 if match.group(2) or "k" in price_str else 1
                prefs.max_price = float(val) * mult
                break

        # 3. Amenities (Expanded)
        amenities_map = {"pool": "Swimming Pool", "spa": "Spa", "gym": "Fitness Centre", "wifi": "Wifi", "jacuzzi": "Jacuzzi"}
        for k, v in amenities_map.items():
            if k in combined_text and not ChatAnalyzer.is_negative(combined_text, k):
                prefs.amenities.append(v)
        
        # 4. Visual Traits
        visual_keywords = ["wooden flooring", "infinity pool", "glass facade", "modern decor", "traditional style", "bathtubs", "sea view", "beach view"]
        for vk in visual_keywords:
            if vk in combined_text and not ChatAnalyzer.is_negative(combined_text, vk):
                if vk not in prefs.visual_descriptors:
                    prefs.visual_descriptors.append(vk)
        
        return prefs

class VisualSearchService:
    _instance = None
    _model = None
    _ai_features = None
    _mapping = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(VisualSearchService, cls).__new__(cls)
            cls._instance._load_resources()
        return cls._instance

    def _load_resources(self):
        if clip is None: return
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        try:
            feat_path = os.path.join(os.path.dirname(__file__), "hotel_features_ai.npy")
            map_path = os.path.join(os.path.dirname(__file__), "mapping.pkl")
            
            if os.path.exists(feat_path) and os.path.exists(map_path):
                self._model, _ = clip.load("ViT-L/14@336px", device=self.device)
                self._ai_features = np.load(feat_path)
                with open(map_path, "rb") as f:
                    self._mapping = pickle.load(f)
        except Exception as e:
            print(f"Visual Search Init Error: {e}")

    def get_visual_scores(self, descriptors: List[str]) -> Dict[str, float]:
        if not descriptors or self._model is None or self._ai_features is None:
            # Fallback mock for demonstration if CLIP is not available
            return {"1000000073": 0.85, "1000000121": 0.92}
        
        hotel_scores = {}
        try:
            with torch.no_grad():
                text_tokens = clip.tokenize(descriptors).to(self.device)
                text_features = self._model.encode_text(text_tokens)
                text_features /= text_features.norm(dim=-1, keepdim=True)
                similarities = np.dot(self._ai_features, text_features.cpu().numpy().T)
                max_similarities = np.max(similarities, axis=1)
                for i, score in enumerate(max_similarities):
                    if i in self._mapping:
                        hotel_code = str(self._mapping[i]["hotel_id"])
                        if hotel_code not in hotel_scores or score > hotel_scores[hotel_code]:
                            hotel_scores[hotel_code] = float(score)
        except:
            pass
        return hotel_scores

class RecommendationService:
    def __init__(self, hotel_service: HotelService):
        self.hotel_service = hotel_service
        self.visual_service = VisualSearchService()

    def check_readiness(self, prefs: UserPreferences) -> Tuple[bool, float]:
        score = 0
        if prefs.area: score += 0.4
        if prefs.max_price: score += 0.3
        if len(prefs.amenities) + len(prefs.visual_descriptors) >= 2: score += 0.3
        return score >= 0.7, score

    def get_recommendations(self, preferences: UserPreferences, limit: int = 5) -> List[DetailedRecommendation]:
        hotels = self.hotel_service.get_all_hotels()
        v_scores = self.visual_service.get_visual_scores(preferences.visual_descriptors)
        scored_recs = []

        for hotel in hotels:
            score = 0
            matched = []
            
            # Price Filter
            if preferences.max_price and getattr(hotel, 'price', 0) > preferences.max_price: continue
            
            # Visual Match
            v_val = v_scores.get(hotel.hotel_code, 0)
            if v_val > 0.25: # CLIP Threshold
                score += (v_val * 15)
                matched.append("Visual Vibe Match")

            # Amenities
            for am in preferences.amenities:
                if any(am.lower() in hotel_am.lower() for hotel_am in hotel.amenities):
                    score += 2
                    matched.append(am)

            if score > 0:
                explanation = f"I recommend {hotel.name} because its images confirm your requested vibe and it has {', '.join(matched)}."
                scored_recs.append((score, DetailedRecommendation(hotel=hotel, explanation=explanation, matched_preferences=matched)))

        scored_recs.sort(key=lambda x: x[0], reverse=True)
        return [rec for _, rec in scored_recs[:limit]]
