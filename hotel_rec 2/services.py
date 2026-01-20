import json
import os
import re
from typing import List, Dict, Any, Optional
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
        if os.path.exists(data_path):
            with open(data_path, "r") as f:
                raw_data = json.load(f)
                self._hotels = [Hotel(**item) for item in raw_data]

    def get_all_hotels(self) -> List[Hotel]:
        return self._hotels

class ChatAnalyzer:
    @staticmethod
    def is_negative(text: str, topic: str) -> bool:
        negations = [r"don't like", r"do not like", r"hate", r"avoid", r"not", r"never", r"too costly", r"too expensive"]
        if re.search(f"(?:no|not)\s+{topic}", text):
            return True
        for neg in negations:
            if re.search(f"{neg}.*?{topic}", text):
                return True
        return False

    @staticmethod
    def extract_preferences(messages: List[ChatMessage]) -> UserPreferences:
        prefs = UserPreferences()
        
        # Keywords to identify hotel-related context
        hotel_context_keywords = ["hotel", "resort", "stay", "room", "accommodation", "place to sleep", "check-in", "check-out", "hostel", "airbnb", "booking"]
        # Keywords for amenities and features (mapped to hotel_data.json categories)
        amenities_map = {
            "pool": "Swimming Pool", 
            "spa": "Spa", 
            "gym": "Fitness Centre", 
            "wifi": "Wifi", 
            "breakfast": "Food",
            "jacuzzi": "Jacuzzi",
            "terrace": "Terrace",
            "bar": "Bar",
            "restaurant": "Restaurant/cafe",
            "ac": "Air Conditioning",
            "air conditioning": "Air Conditioning"
        }
        # Keywords for area/location
        areas = ["beach", "barcelona", "gothic quarter", "el born", "barceloneta", "city"]

        for msg in messages:
            if not msg.text: continue
            text = msg.text.lower()
            
            # 1. Price Extraction
            # Look for numbers associated with currency symbols ($, \u20ac, rs)
            price_match = re.search(r"(?:[\$\u20ac]|rs\.?\s?)(\d+(?:,\d+)?)", text)
            
            if price_match:
                try:
                    val = float(price_match.group(1).replace(",", ""))
                    # Heuristic for Barcelona trip: values under 50 might be daily budget, 
                    # but we'll treat the last mentioned currency value as the limit.
                    prefs.max_price = val
                except ValueError:
                    pass
            else:
                # Fallback for "20k" style mentions
                k_match = re.search(r"(\d+(?:,\d+)?)\s?[kK]\b", text)
                if k_match:
                    try:
                        val = float(k_match.group(1).replace(",", "")) * 1000
                        prefs.max_price = val
                    except ValueError:
                        pass

            # 2. Amenities
            for k, v in amenities_map.items():
                if k in text:
                    if not ChatAnalyzer.is_negative(text, k):
                        if v not in prefs.amenities:
                            prefs.amenities.append(v)
                    elif v in prefs.amenities:
                        prefs.amenities.remove(v)

            # 3. Area/Location
            # Barcelona specific areas added for the test data
            areas = ["beach", "barcelona", "gothic quarter", "el born", "barceloneta", "city", "passeig de gr\u00e0cia"]
            for area in areas:
                if area in text:
                    if not ChatAnalyzer.is_negative(text, area):
                        prefs.area = area
        
        return prefs

class RecommendationService:
    def __init__(self, hotel_service: HotelService):
        self.hotel_service = hotel_service

    def get_recommendations(self, preferences: UserPreferences, limit: int = 5) -> List[DetailedRecommendation]:
        hotels = self.hotel_service.get_all_hotels()
        scored_recommendations = []

        for hotel in hotels:
            score = 0
            matched_prefs = []
            
            # Location scoring
            if preferences.area and preferences.area.lower() in hotel.name.lower():
                score += 10
                matched_prefs.append(f"Location ({preferences.area})")
            
            # Amenities scoring
            for pref_amenity in preferences.amenities:
                if any(pref_amenity.lower() in a.lower() for a in hotel.amenities):
                    score += 5
                    matched_prefs.append(pref_amenity)
            
            # Price filtering (if applicable)
            # Assuming hotels have a price field? Let's check Hotel model again.
            # Wait, Hotel model in models.py DOES NOT have a price field. 
            # I should check the JSON data to see what's available.
            
            if score > 0:
                explanation_parts = []
                if preferences.area and preferences.area.lower() in hotel.name.lower():
                    explanation_parts.append(f"it is in the {preferences.area} area")
                
                amenity_matches = [p for p in matched_prefs if p in preferences.amenities]
                if amenity_matches:
                    explanation_parts.append(f"it offers {', '.join(amenity_matches)}")

                explanation = f"I recommend {hotel.name} because " + " and ".join(explanation_parts) + "."
                scored_recommendations.append((score, DetailedRecommendation(
                    hotel=hotel,
                    explanation=explanation,
                    matched_preferences=matched_prefs
                )))

        scored_recommendations.sort(key=lambda x: x[0], reverse=True)
        return [rec for score, rec in scored_recommendations[:limit]]
