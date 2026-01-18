import json
import os
import re
import numpy as np
import pickle
import torch
try:
    import clip  # type: ignore
except ImportError:
    clip = None
from typing import List, Dict, Any, Optional, Tuple
from models import Hotel, UserPreferences, ChatMessage, DetailedRecommendation

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
    def extract_dynamic_descriptors(text: str) -> List[str]:
        """
        Extract dynamic textual descriptors from chat messages.
        Finds descriptive phrases like "green bed", "wooden flooring", "modern decor", etc.
        Uses pattern matching to identify adjective+noun combinations and descriptive phrases.
        """
        descriptors = []
        text_lower = text.lower()
        
        # Common adjectives for visual descriptions
        visual_adjectives = [
            "green", "blue", "red", "white", "black", "brown", "yellow", "pink", "purple", "orange",
            "wooden", "marble", "glass", "metal", "stone", "brick", "concrete",
            "modern", "traditional", "vintage", "contemporary", "classic", "luxury", "premium",
            "large", "small", "big", "tiny", "huge", "spacious", "compact",
            "bright", "dark", "light", "dim", "colorful", "vibrant",
            "soft", "hard", "smooth", "rough", "shiny", "matte", "glossy",
            "round", "square", "rectangular", "circular",
            "infinity", "private", "shared", "outdoor", "indoor"
        ]
        
        # Common nouns for hotel/room features
        visual_nouns = [
            "bed", "beds", "bedroom", "room", "rooms", "flooring", "floor", "walls", "wall",
            "decor", "decoration", "furniture", "furnishings", "design", "style", "theme",
            "pool", "pools", "spa", "bathroom", "bath", "shower", "bathtub", "bathtubs",
            "view", "views", "balcony", "terrace", "patio", "garden", "lawn",
            "facade", "exterior", "interior", "ceiling", "windows", "window",
            "curtains", "carpet", "rug", "tiles", "tile", "paint", "paintings",
            "lighting", "lights", "lamp", "lamps", "chandelier", "mirror", "mirrors",
            "sofa", "couch", "chair", "chairs", "table", "desk", "wardrobe", "closet"
        ]
        
        # Pattern 1: Adjective + Noun (e.g., "green bed", "wooden flooring")
        for adj in visual_adjectives:
            for noun in visual_nouns:
                pattern = rf"\b{adj}\s+{noun}\b"
                matches = re.findall(pattern, text_lower)
                for match in matches:
                    descriptor = match.strip()
                    if not ChatAnalyzer.is_negative(text_lower, descriptor):
                        if descriptor not in descriptors:
                            descriptors.append(descriptor)
        
        # Pattern 2: "with X" or "that has X" (e.g., "room with green bed", "hotel that has wooden flooring")
        with_patterns = [
            r"with\s+([a-z]+\s+[a-z]+)",  # "with green bed"
            r"that\s+has\s+([a-z]+\s+[a-z]+)",  # "that has wooden flooring"
            r"having\s+([a-z]+\s+[a-z]+)",  # "having modern decor"
            r"featuring\s+([a-z]+\s+[a-z]+)",  # "featuring infinity pool"
        ]
        
        for pattern in with_patterns:
            matches = re.findall(pattern, text_lower)
            for match in matches:
                descriptor = match.strip()
                # Check if it's a valid descriptor (contains adjective + noun)
                words = descriptor.split()
                if len(words) == 2:
                    adj, noun = words
                    if adj in visual_adjectives or noun in visual_nouns:
                        if not ChatAnalyzer.is_negative(text_lower, descriptor):
                            if descriptor not in descriptors:
                                descriptors.append(descriptor)
        
        # Pattern 3: "X Y" where X is adjective and Y is noun (more flexible)
        # This catches phrases like "modern room", "luxury hotel", "beach view"
        flexible_pattern = rf"\b({'|'.join(visual_adjectives)})\s+({'|'.join(visual_nouns)})\b"
        matches = re.findall(flexible_pattern, text_lower)
        for match in matches:
            if isinstance(match, tuple):
                descriptor = " ".join(match).strip()
            else:
                descriptor = match.strip()
            if not ChatAnalyzer.is_negative(text_lower, descriptor):
                if descriptor not in descriptors:
                    descriptors.append(descriptor)
        
        # Pattern 4: Extract noun phrases that might be visual descriptors
        # Look for patterns like "X view", "X style", "X design"
        noun_phrase_patterns = [
            r"([a-z]+\s+view)",  # "beach view", "mountain view"
            r"([a-z]+\s+style)",  # "modern style", "traditional style"
            r"([a-z]+\s+design)",  # "minimalist design", "luxury design"
            r"([a-z]+\s+decor)",  # "modern decor", "vintage decor"
            r"([a-z]+\s+flooring)",  # "wooden flooring", "marble flooring"
        ]
        
        for pattern in noun_phrase_patterns:
            matches = re.findall(pattern, text_lower)
            for match in matches:
                descriptor = match.strip()
                if not ChatAnalyzer.is_negative(text_lower, descriptor):
                    if descriptor not in descriptors:
                        descriptors.append(descriptor)
        
        return descriptors

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
        
        # 4. Visual Traits (Hardcoded keywords - kept for backward compatibility)
        visual_keywords = ["wooden flooring", "infinity pool", "glass facade", "modern decor", "traditional style", "bathtubs", "sea view", "beach view"]
        for vk in visual_keywords:
            if vk in combined_text and not ChatAnalyzer.is_negative(combined_text, vk):
                if vk not in prefs.visual_descriptors:
                    prefs.visual_descriptors.append(vk)
        
        # 5. Dynamic Textual Descriptors - Extract from all messages
        for msg in relevant_messages:
            if msg.text:
                dynamic_descriptors = ChatAnalyzer.extract_dynamic_descriptors(msg.text)
                for desc in dynamic_descriptors:
                    if desc not in prefs.visual_descriptors:
                        prefs.visual_descriptors.append(desc)
        
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

    def get_visual_scores(self, descriptors: List[str]) -> Dict[str, Any]:
        """
        Get visual similarity scores for hotels based on textual descriptors.
        Returns a dictionary with hotel_code as key and a dict containing:
        - score: best similarity score
        - matched_descriptors: list of descriptors that matched with their scores
        """
        if not descriptors or self._model is None or self._ai_features is None:
            # Fallback mock for demonstration if CLIP is not available
            return {"1000000073": {"score": 0.85, "matched_descriptors": []}, 
                    "1000000121": {"score": 0.92, "matched_descriptors": []}}
        
        hotel_scores = {}
        try:
            with torch.no_grad():
                text_tokens = clip.tokenize(descriptors).to(self.device)
                text_features = self._model.encode_text(text_tokens)
                text_features /= text_features.norm(dim=-1, keepdim=True)
                
                # Calculate similarities: shape (num_images, num_descriptors)
                similarities = np.dot(self._ai_features, text_features.cpu().numpy().T)
                
                # For each image, find which descriptors match best
                for i, image_similarities in enumerate(similarities):
                    if i in self._mapping:
                        hotel_code = str(self._mapping[i]["hotel_id"])
                        max_score = float(np.max(image_similarities))
                        
                        # Track which descriptors matched (score > threshold)
                        matched_descriptors = []
                        for desc_idx, desc_score in enumerate(image_similarities):
                            if desc_score > 0.25:  # CLIP threshold
                                matched_descriptors.append({
                                    "descriptor": descriptors[desc_idx],
                                    "score": float(desc_score)
                                })
                        
                        # Sort matched descriptors by score
                        matched_descriptors.sort(key=lambda x: x["score"], reverse=True)
                        
                        # Update hotel score if this is the best match
                        if hotel_code not in hotel_scores or max_score > hotel_scores[hotel_code]["score"]:
                            hotel_scores[hotel_code] = {
                                "score": max_score,
                                "matched_descriptors": matched_descriptors
                            }
        except Exception as e:
            print(f"Error in get_visual_scores: {e}")
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
            matched_descriptors = []
            
            # Price Filter
            if preferences.max_price and getattr(hotel, 'price', 0) > preferences.max_price: continue
            
            # Visual Match with dynamic descriptors
            v_data = v_scores.get(hotel.hotel_code, {})
            if isinstance(v_data, dict):
                v_val = v_data.get("score", 0)
                matched_descriptors = v_data.get("matched_descriptors", [])
            else:
                # Backward compatibility
                v_val = v_data if isinstance(v_data, (int, float)) else 0
                matched_descriptors = []
            
            if v_val > 0.25:  # CLIP Threshold
                score += (v_val * 15)
                # Add top matched descriptors to matched list
                if matched_descriptors:
                    top_descriptors = [d["descriptor"] for d in matched_descriptors[:3]]  # Top 3
                    matched.extend(top_descriptors)
                else:
                    matched.append("Visual Vibe Match")
            
            # Amenities
            for am in preferences.amenities:
                if any(am.lower() in hotel_am.lower() for hotel_am in hotel.amenities):
                    score += 2
                    matched.append(am)

            if score > 0:
                # Build explanation with specific matched descriptors
                if matched_descriptors:
                    desc_list = [d["descriptor"] for d in matched_descriptors[:3]]
                    explanation = f"I recommend {hotel.name} because its images match your preferences: {', '.join(desc_list)}."
                    # Add amenities if any matched
                    matched_amenities = [am for am in matched if am in preferences.amenities]
                    if matched_amenities:
                        explanation += f" It also has {', '.join(matched_amenities)}."
                else:
                    explanation = f"I recommend {hotel.name} because its images confirm your requested vibe and it has {', '.join(matched)}."
                
                scored_recs.append((score, DetailedRecommendation(hotel=hotel, explanation=explanation, matched_preferences=matched)))

        scored_recs.sort(key=lambda x: x[0], reverse=True)
        return [rec for _, rec in scored_recs[:limit]]
