from fastapi import FastAPI, Depends
from typing import List
from models import ChatAnalysisRequest, RecommendationResponse
from services import HotelService, ChatAnalyzer, RecommendationService

app = FastAPI(title="Hotel Recommendation AI")

@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Hotel Recommendation AI API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "recommend": "/recommend (POST)",
            "docs": "/docs",
            "redoc": "/redoc"
        },
        "description": "AI-powered hotel recommendation engine that extracts preferences from chat messages"
    }

# Singleton Instances
def get_hotel_service():
    return HotelService()

def get_recommendation_service(hotel_service: HotelService = Depends(get_hotel_service)):
    return RecommendationService(hotel_service)

@app.post("/recommend", response_model=RecommendationResponse)
async def recommend_hotels(
    request: ChatAnalysisRequest,
    rec_service: RecommendationService = Depends(get_recommendation_service)
):
    # 1. Identify preferences from chat context
    preferences = ChatAnalyzer.extract_preferences(request.messages)
    
    # 2. Get top 5 recommendations
    recommendations = rec_service.get_recommendations(preferences, limit=5)
    
    # 3. Check Readiness for Ping
    is_ready, r_score = rec_service.check_readiness(preferences)
    
    return RecommendationResponse(
        extracted_preferences=preferences,
        recommendations=recommendations,
        is_ready=is_ready,
        readiness_score=r_score
    )

@app.get("/health")
async def health_check():
    return {"status": "ok", "hotel_count": len(HotelService().get_all_hotels())}
