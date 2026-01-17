"""
Hotel Recommendation Service
Integrates hotel recommendation AI from hotel_recommendations module
"""
import sys
import os
from pathlib import Path

# Add hotel_recommendations to path
hotel_rec_path = Path(__file__).parent.parent.parent / "hotel_recommendations"
if str(hotel_rec_path) not in sys.path:
    sys.path.insert(0, str(hotel_rec_path))

from typing import List, Dict, Any
import json

# Import from hotel_recommendations
try:
    from hotel_recommendations.models import ChatMessage, UserPreferences, DetailedRecommendation, Hotel
    from hotel_recommendations.services import HotelService, ChatAnalyzer, RecommendationService
except ImportError:
    # Fallback if relative imports don't work
    import importlib.util
    spec = importlib.util.spec_from_file_location("models", hotel_rec_path / "models.py")
    models_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(models_module)
    
    spec2 = importlib.util.spec_from_file_location("services", hotel_rec_path / "services.py")
    services_module = importlib.util.module_from_spec(spec2)
    spec2.loader.exec_module(services_module)
    
    ChatMessage = models_module.ChatMessage
    UserPreferences = models_module.UserPreferences
    DetailedRecommendation = models_module.DetailedRecommendation
    Hotel = models_module.Hotel
    HotelService = services_module.HotelService
    ChatAnalyzer = services_module.ChatAnalyzer
    RecommendationService = services_module.RecommendationService


class HotelRecommendationService:
    """Service for hotel recommendations based on chat analysis"""
    
    def __init__(self):
        # Initialize services with proper paths
        self.hotel_service = HotelService()
        self.chat_analyzer = ChatAnalyzer()
        self.recommendation_service = RecommendationService(self.hotel_service)
    
    def get_recommendations_from_chat(
        self, 
        messages: List[Dict[str, str]], 
        limit: int = 5
    ) -> Dict[str, Any]:
        """
        Get hotel recommendations from chat messages
        
        Args:
            messages: List of messages with 'user_id' and 'text' keys
            limit: Maximum number of recommendations to return
            
        Returns:
            Dictionary with recommendations and extracted preferences
        """
        try:
            # Convert messages to ChatMessage objects
            chat_messages = [
                ChatMessage(user_id=msg.get("user_id", "unknown"), text=msg.get("text", ""))
                for msg in messages
            ]
            
            # Extract preferences
            preferences = self.chat_analyzer.extract_preferences(chat_messages)
            
            # Get recommendations
            recommendations = self.recommendation_service.get_recommendations(preferences, limit=limit)
            
            # Check readiness
            is_ready, readiness_score = self.recommendation_service.check_readiness(preferences)
            
            # Convert to dict format
            return {
                "extracted_preferences": {
                    "area": preferences.area,
                    "max_price": preferences.max_price,
                    "min_price": preferences.min_price,
                    "amenities": preferences.amenities,
                    "room_types": preferences.room_types,
                    "visual_descriptors": preferences.visual_descriptors,
                    "other_requirements": preferences.other_requirements
                },
                "recommendations": [
                    {
                        "hotel": {
                            "name": rec.hotel.name,
                            "hotel_code": rec.hotel.hotel_code,
                            "amenities": rec.hotel.amenities,
                            "room_types": rec.hotel.room_types,
                            "description": rec.hotel.description
                        },
                        "explanation": rec.explanation,
                        "matched_preferences": rec.matched_preferences
                    }
                    for rec in recommendations
                ],
                "is_ready": is_ready,
                "readiness_score": readiness_score
            }
        except Exception as e:
            raise Exception(f"Error getting recommendations: {str(e)}")
