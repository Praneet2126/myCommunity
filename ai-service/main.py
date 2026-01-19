from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import sys
import os
from pathlib import Path
from PIL import Image
import io

# Ensure we can import from services
current_dir = Path(__file__).parent.absolute()
if str(current_dir) not in sys.path:
    sys.path.insert(0, str(current_dir))

from config import settings

# Lazy import services to avoid issues with uvicorn reload
def get_hotel_recommendation_service():
    """Lazy import for hotel recommendation service"""
    from services.hotel_recommendation_service import HotelRecommendationService
    return HotelRecommendationService()

def get_image_search_service():
    """Lazy import for image search service"""
    from services.image_search_service import ImageSearchService
    return ImageSearchService()

def get_moderation_service():
    """Lazy import for moderation service"""
    from services.moderation_service import ModerationService
    return ModerationService()

def get_activity_recommendation_service():
    """Lazy import for activity recommendation service"""
    from services.activity_recommendation_service import ActivityRecommendationService
    return ActivityRecommendationService()

# Initialize services
hotel_recommendation_service = None
image_search_service = None
moderation_service = None
activity_recommendation_service = None

def init_services():
    """Initialize all services (legacy helper)."""
    init_hotel_recommendation_service()
    init_image_search_service()
    init_moderation_service()
    init_activity_recommendation_service()

def init_hotel_recommendation_service():
    """Initialize hotel recommendation service on first use."""
    global hotel_recommendation_service
    if hotel_recommendation_service is None:
        hotel_recommendation_service = get_hotel_recommendation_service()

def init_image_search_service():
    """Initialize image search service on first use."""
    global image_search_service
    if image_search_service is None:
        image_search_service = get_image_search_service()

def init_moderation_service():
    """Initialize moderation service on first use."""
    global moderation_service
    if moderation_service is None:
        moderation_service = get_moderation_service()

def init_activity_recommendation_service():
    """Initialize activity recommendation service on first use."""
    global activity_recommendation_service
    if activity_recommendation_service is None:
        activity_recommendation_service = get_activity_recommendation_service()

app = FastAPI(
    title="AI Microservice",
    description="AI-powered features for hotel search, chat summarization, and content moderation",
    version="1.0.0"
)

# CORS middleware - configure with your frontend URL
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Services will be initialized on first request

# Request/Response Models
class SimilarHotelsRequest(BaseModel):
    image_url: Optional[str] = None
    image_base64: Optional[str] = None


class HotelResult(BaseModel):
    hotel_id: str
    name: str
    similarity_score: float
    stars: Optional[int] = None
    price: Optional[int] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    best_match_image_path: Optional[str] = None
    score_breakdown: Optional[dict] = None


class SimilarHotelsResponse(BaseModel):
    similar_hotels: List[HotelResult]
    total_results: int


class HotelRecommendationRequest(BaseModel):
    messages: List[dict]  # List of {"user_id": str, "text": str}
    limit: Optional[int] = 5


class HotelRecommendationResponse(BaseModel):
    extracted_preferences: dict
    recommendations: List[dict]
    is_ready: bool
    readiness_score: float


class ChatSummarizationRequest(BaseModel):
    chat_id: str
    chat_type: str  # 'city' or 'private'
    message_ids: Optional[List[str]] = None  # If None, summarize all messages


class ChatSummarizationMessagesRequest(BaseModel):
    messages: List[str]  # List of message strings to summarize


class ChatSummarizationResponse(BaseModel):
    summary: str
    key_points: List[str]
    message_count: int
    date_range: Optional[str] = None


class ContentModerationRequest(BaseModel):
    content: str
    message_id: Optional[str] = None
    user_id: Optional[str] = None


class ContentModerationResponse(BaseModel):
    is_safe: bool
    is_spam: bool
    is_abusive: bool
    confidence_score: float
    flagged_categories: List[str]
    suggested_action: Optional[str] = None
    reason: Optional[str] = None


# Health check endpoint
@app.get("/")
async def root():
    return {
        "service": "AI Microservice",
        "status": "running",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# 1. AI-based Similar Hotels Search (Image Search)
@app.post("/api/v1/hotels/similar", response_model=SimilarHotelsResponse)
async def find_similar_hotels(
    image: Optional[UploadFile] = File(None),
    request: Optional[SimilarHotelsRequest] = None
):
    """
    Find similar hotels based on an uploaded image.
    Accepts image file upload.
    
    Example:
    - Upload an image file via multipart/form-data
    - Returns top 3 similar hotels with similarity scores
    """
    try:
        init_image_search_service()
        
        if image is None:
            raise HTTPException(status_code=400, detail="Image file is required")
        
        # Read image
        image_data = await image.read()
        try:
            pil_image = Image.open(io.BytesIO(image_data)).convert("RGB")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")
        
        # Search for similar hotels
        results = image_search_service.search_similar_hotels(pil_image, top_k=3)
        
        # Format response
        hotel_results = [
            HotelResult(
                hotel_id=result["hotel_id"],
                name=result["name"],
                similarity_score=result["similarity_score"],
                stars=result.get("stars"),
                price=result.get("price"),
                description=result.get("description"),
                best_match_image_path=result.get("best_match_image_path"),
                score_breakdown=result.get("score_breakdown")
            )
            for result in results
        ]
        
        return SimilarHotelsResponse(
            similar_hotels=hotel_results,
            total_results=len(hotel_results)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")


# 2. Hotel Recommendations from Chat (Hotel Recommendation Service)
@app.post("/api/v1/hotels/recommend", response_model=HotelRecommendationResponse)
async def recommend_hotels_from_chat(request: HotelRecommendationRequest):
    """
    Get hotel recommendations based on chat messages.
    Extracts preferences from chat and returns personalized hotel recommendations.
    
    Request body:
    {
        "messages": [
            {"user_id": "u1", "text": "I want wooden flooring and a beach view."},
            {"user_id": "u2", "text": "I saw one for 40k but that is too costly."},
            {"user_id": "u3", "text": "Yeah, 20k should be the limit."}
        ],
        "limit": 5
    }
    """
    try:
        init_hotel_recommendation_service()
        
        result = hotel_recommendation_service.get_recommendations_from_chat(
            messages=request.messages,
            limit=request.limit or 5
        )
        
        return HotelRecommendationResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting recommendations: {str(e)}")


# 2. Chat Summarization
@app.post("/api/v1/chat/summarize", response_model=ChatSummarizationResponse)
async def summarize_chat(request: ChatSummarizationRequest):
    """
    Summarize chat messages for a given chat.
    Can summarize all messages or specific message IDs.
    """
    try:
        # TODO: Implement AI service integration for chat summarization
        # This will call your AI service to summarize the chat
        
        # Placeholder response
        return ChatSummarizationResponse(
            summary="This is a placeholder summary of the chat conversation about hotel planning in Barcelona.",
            key_points=[
                "Group planning summer trip to Barcelona",
                "Discussing hotel options and budgets",
                "Comparing different hotel features and locations"
            ],
            message_count=300,
            date_range="2024-01-15 to 2024-01-19"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error summarizing chat: {str(e)}")


# 2b. Chat Summarization from Messages List
@app.post("/api/v1/chat/summarize-messages", response_model=ChatSummarizationResponse)
async def summarize_chat_messages(request: ChatSummarizationMessagesRequest):
    """
    Summarize a list of chat messages directly.
    
    Request body:
    {
        "messages": [
            "Message 1 text",
            "Message 2 text",
            ...
        ]
    }
    """
    try:
        from services.chat_summarizer_service import ChatSummarizerService
        
        if not request.messages or len(request.messages) == 0:
            raise HTTPException(status_code=400, detail="Messages list cannot be empty")
        
        # Initialize chat summarizer service
        summarizer = ChatSummarizerService()
        result = summarizer.summarize_messages(request.messages)
        
        return ChatSummarizationResponse(
            summary=result.get("summary", ""),
            key_points=result.get("key_points", []),
            message_count=result.get("message_count", len(request.messages)),
            date_range=result.get("date_range")
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error summarizing messages: {str(e)}")


# 3. Content Moderation
@app.post("/api/v1/moderation/check", response_model=ContentModerationResponse)
async def moderate_content(request: ContentModerationRequest):
    """
    Check if content is safe, spam, or contains abusive language.
    """
    try:
        # Initialize moderation service if needed
        init_moderation_service()
        
        # Call the actual moderation service
        result = moderation_service.moderate_content(
            content=request.content,
            user_id=request.user_id,
            message_id=request.message_id,
            chat_type="city"  # Default to city chat, can be made configurable
        )
        
        return ContentModerationResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error moderating content: {str(e)}")


# Batch content moderation endpoint
@app.post("/api/v1/moderation/batch", response_model=List[ContentModerationResponse])
async def moderate_content_batch(requests: List[ContentModerationRequest]):
    """
    Check multiple content items in batch.
    """
    try:
        # Initialize moderation service if needed
        init_moderation_service()
        
        results = []
        for request in requests:
            result = moderation_service.moderate_content(
                content=request.content,
                user_id=request.user_id,
                message_id=request.message_id,
                chat_type="city"
            )
            results.append(ContentModerationResponse(**result))
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in batch moderation: {str(e)}")


# ============= Activity Recommendations Endpoints =============

class ActivityPlace(BaseModel):
    name: str
    duration: str
    score: float = 0.0
    category: str = "General"
    region: str = "Unknown"
    lat: Optional[float] = None
    lon: Optional[float] = None
    best_time: str = "Flexible"


class ProcessMessageRequest(BaseModel):
    chat_id: str
    user: str
    message: str


class ProcessMessageResponse(BaseModel):
    message_count: int
    recommendations: List[ActivityPlace]
    trigger_rec: bool


class AddToCartRequest(BaseModel):
    chat_id: str
    user: str
    place_name: str


class CartItem(BaseModel):
    place_name: str
    added_by: str
    count: int = 1


class Cart(BaseModel):
    items: List[CartItem] = []
    num_days: int = 3
    num_people: int = 2


class UpdateCartSettingsRequest(BaseModel):
    chat_id: str
    num_days: int
    num_people: int


class ActivityInItinerary(ActivityPlace):
    start_time: str
    end_time: str
    travel_time_from_prev: str = "0 mins"


class ItineraryDay(BaseModel):
    day: int
    activities: List[ActivityInItinerary]
    total_duration_mins: int


class Itinerary(BaseModel):
    chat_id: str
    days: List[ItineraryDay]
    num_people: int


@app.post("/api/v1/activities/message", response_model=ProcessMessageResponse)
async def process_activity_message(request: ProcessMessageRequest):
    """
    Process a chat message and return activity recommendations when threshold is reached.
    
    This endpoint analyzes chat messages and provides activity recommendations based on 
    semantic search. Recommendations are triggered every 7 messages.
    
    Request body:
    {
        "chat_id": "city_goa_123",
        "user": "john_doe",
        "message": "I want to visit beaches and try water sports"
    }
    """
    try:
        init_activity_recommendation_service()
        
        result = activity_recommendation_service.process_message(
            chat_id=request.chat_id,
            user=request.user,
            message=request.message
        )
        
        return ProcessMessageResponse(
            message_count=result["message_count"],
            recommendations=[ActivityPlace(**rec) for rec in result["recommendations"]],
            trigger_rec=result["trigger_rec"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing message: {str(e)}")


@app.post("/api/v1/activities/cart/add")
async def add_activity_to_cart(request: AddToCartRequest):
    """
    Add an activity to the cart for a specific chat.
    
    Request body:
    {
        "chat_id": "city_goa_123",
        "user": "john_doe",
        "place_name": "Baga Beach"
    }
    """
    try:
        init_activity_recommendation_service()
        
        result = activity_recommendation_service.add_to_cart(
            chat_id=request.chat_id,
            user=request.user,
            place_name=request.place_name
        )
        
        if result.get("status") == "error":
            raise HTTPException(status_code=400, detail=result.get("error", "Failed to add to cart"))
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding to cart: {str(e)}")


@app.get("/api/v1/activities/cart/{chat_id}", response_model=Cart)
async def get_activity_cart(chat_id: str):
    """
    Get the current activity cart for a chat.
    
    Returns the list of activities added to the cart along with settings (num_days, num_people).
    """
    try:
        init_activity_recommendation_service()
        
        cart_data = activity_recommendation_service.get_cart(chat_id)
        return Cart(**cart_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting cart: {str(e)}")


@app.post("/api/v1/activities/cart/update")
async def update_activity_cart_settings(request: UpdateCartSettingsRequest):
    """
    Update cart settings (number of days and people).
    
    Request body:
    {
        "chat_id": "city_goa_123",
        "num_days": 3,
        "num_people": 4
    }
    """
    try:
        init_activity_recommendation_service()
        
        result = activity_recommendation_service.update_cart_settings(
            chat_id=request.chat_id,
            num_days=request.num_days,
            num_people=request.num_people
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating cart settings: {str(e)}")


@app.post("/api/v1/activities/itinerary/generate", response_model=Itinerary)
async def generate_activity_itinerary(chat_id: str):
    """
    Generate an itinerary from cart activities using AI or deterministic scheduling.
    
    This endpoint takes all activities in the cart and generates a day-by-day itinerary
    with time slots, considering travel time, best time to visit, and regional clustering.
    
    Query parameters:
    - chat_id: The chat ID for which to generate the itinerary
    """
    try:
        init_activity_recommendation_service()
        
        result = activity_recommendation_service.generate_itinerary(chat_id)
        
        if result.get("status") == "error":
            raise HTTPException(status_code=400, detail=result.get("error", "Failed to generate itinerary"))
        
        return Itinerary(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating itinerary: {str(e)}")


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
