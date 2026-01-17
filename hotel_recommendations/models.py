from pydantic import BaseModel
from typing import List, Optional

class Hotel(BaseModel):
    name: str
    hotel_code: str
    amenities: List[str]
    room_types: List[str]
    description: str

class UserPreferences(BaseModel):
    area: Optional[str] = None
    max_price: Optional[float] = None
    min_price: Optional[float] = None
    amenities: List[str] = []
    room_types: List[str] = []
    visual_descriptors: List[str] = []
    other_requirements: List[str] = []

class ChatMessage(BaseModel):
    user_id: str
    text: str

class ChatAnalysisRequest(BaseModel):
    messages: List[ChatMessage]

class DetailedRecommendation(BaseModel):
    hotel: Hotel
    explanation: str
    matched_preferences: List[str]

class RecommendationResponse(BaseModel):
    extracted_preferences: UserPreferences
    recommendations: List[DetailedRecommendation]
    is_ready: bool
    readiness_score: float
