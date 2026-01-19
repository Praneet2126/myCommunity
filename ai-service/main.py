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

def get_chat_summarizer_service():
    """Lazy import for chat summarizer service"""
    from services.chat_summarizer_service import ChatSummarizerService
    return ChatSummarizerService()

def get_moderation_service():
    """Lazy import for moderation service"""
    from services.moderation_service import ModerationService
    return ModerationService()

def get_sentiment_analysis_service():
    """Lazy import for sentiment analysis service"""
    from services.sentiment_analysis_service import SentimentAnalysisService
    return SentimentAnalysisService()

# Initialize services
hotel_recommendation_service = None
image_search_service = None
chat_summarizer_service = None
moderation_service = None
sentiment_analysis_service = None

def init_services():
    """Initialize services on first use"""
    global hotel_recommendation_service, image_search_service
    global chat_summarizer_service, moderation_service, sentiment_analysis_service
    if hotel_recommendation_service is None:
        hotel_recommendation_service = get_hotel_recommendation_service()
    if image_search_service is None:
        image_search_service = get_image_search_service()
    if chat_summarizer_service is None:
        chat_summarizer_service = get_chat_summarizer_service()
    if moderation_service is None:
        moderation_service = get_moderation_service()
    if sentiment_analysis_service is None:
        sentiment_analysis_service = get_sentiment_analysis_service()

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


class SentimentAnalysisRequest(BaseModel):
    message_text: str


class SentimentAnalysisResponse(BaseModel):
    message_sentiment: dict
    tags: dict
    tag_sentiments: List[dict]
    has_tags: bool


class SentimentBatchRequest(BaseModel):
    messages: List[str]


class SentimentAggregationRequest(BaseModel):
    messages: List[dict]  # List of {"sentiment": str, "tags": dict}


class SentimentAggregationResponse(BaseModel):
    places: List[dict]
    hotels: List[dict]
    themes: List[dict]


class ChatSummarizationMessagesRequest(BaseModel):
    messages: List[str]  # List of message strings to summarize


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
        init_services()
        
        if image is None:
            raise HTTPException(status_code=400, detail="Image file is required")
        
        # Read image
        image_data = await image.read()
        pil_image = Image.open(io.BytesIO(image_data)).convert("RGB")
        
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
        init_services()
        
        result = hotel_recommendation_service.get_recommendations_from_chat(
            messages=request.messages,
            limit=request.limit or 5
        )
        
        return HotelRecommendationResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting recommendations: {str(e)}")


# 3. Chat Summarization
@app.post("/api/v1/chat/summarize", response_model=ChatSummarizationResponse)
async def summarize_chat(request: ChatSummarizationRequest):
    """
    Summarize chat messages for a given chat.
    Can summarize all messages or specific message IDs.
    
    Note: This endpoint expects messages to be fetched from the backend.
    For direct message summarization, use /api/v1/chat/summarize-messages
    """
    try:
        # This endpoint is kept for backward compatibility
        # In a real implementation, you would fetch messages from the backend
        # For now, return an error suggesting to use the messages endpoint
        raise HTTPException(
            status_code=400,
            detail="Please use /api/v1/chat/summarize-messages endpoint with message texts"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error summarizing chat: {str(e)}")


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
    
    Returns a summary with key points if thresholds are met (≥15 messages, ≥200 words).
    """
    try:
        init_services()
        
        if not request.messages or len(request.messages) == 0:
            raise HTTPException(status_code=400, detail="Messages list cannot be empty")
        
        result = chat_summarizer_service.summarize_messages(request.messages)
        
        return ChatSummarizationResponse(
            summary=result.get("summary", ""),
            key_points=result.get("key_points", []),
            message_count=result.get("message_count", 0),
            date_range=result.get("date_range")
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error summarizing messages: {str(e)}")


# 4. Content Moderation
@app.post("/api/v1/moderation/check", response_model=ContentModerationResponse)
async def moderate_content(request: ContentModerationRequest):
    """
    Check if content is safe, spam, or contains abusive language.
    Uses rule-based checks and AI-based toxicity detection.
    
    Request body:
    {
        "content": "Message text to moderate",
        "user_id": "optional_user_id",
        "message_id": "optional_message_id"
    }
    """
    try:
        init_services()
        
        if not request.content or not request.content.strip():
            raise HTTPException(status_code=400, detail="Content cannot be empty")
        
        result = moderation_service.moderate_content(
            content=request.content,
            user_id=request.user_id,
            message_id=request.message_id
        )
        
        return ContentModerationResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error moderating content: {str(e)}")


# Batch content moderation endpoint
@app.post("/api/v1/moderation/batch", response_model=List[ContentModerationResponse])
async def moderate_content_batch(requests: List[ContentModerationRequest]):
    """
    Check multiple content items in batch.
    
    Request body: Array of ContentModerationRequest objects
    """
    try:
        init_services()
        
        results = []
        for request in requests:
            if not request.content or not request.content.strip():
                results.append(ContentModerationResponse(
                    is_safe=False,
                    is_spam=False,
                    is_abusive=False,
                    confidence_score=0.0,
                    flagged_categories=["invalid_content"],
                    suggested_action="block",
                    reason="Empty content"
                ))
                continue
            
            result = moderation_service.moderate_content(
                content=request.content,
                user_id=request.user_id,
                message_id=request.message_id
            )
            results.append(ContentModerationResponse(**result))
        
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in batch moderation: {str(e)}")


# 5. Sentiment Analysis
@app.post("/api/v1/sentiment/analyze", response_model=SentimentAnalysisResponse)
async def analyze_sentiment(request: SentimentAnalysisRequest):
    """
    Analyze sentiment and extract tags from a single message.
    
    Request body:
    {
        "message_text": "Message text to analyze"
    }
    
    Returns sentiment analysis with tags and tag-sentiment pairs.
    """
    try:
        init_services()
        
        if not request.message_text or not request.message_text.strip():
            raise HTTPException(status_code=400, detail="Message text cannot be empty")
        
        result = sentiment_analysis_service.analyze_message(request.message_text)
        
        return SentimentAnalysisResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing sentiment: {str(e)}")


@app.post("/api/v1/sentiment/analyze-batch", response_model=List[SentimentAnalysisResponse])
async def analyze_sentiment_batch(request: SentimentBatchRequest):
    """
    Analyze sentiment for multiple messages in batch.
    
    Request body:
    {
        "messages": ["Message 1", "Message 2", ...]
    }
    """
    try:
        init_services()
        
        if not request.messages or len(request.messages) == 0:
            raise HTTPException(status_code=400, detail="Messages list cannot be empty")
        
        results = sentiment_analysis_service.analyze_messages_batch(request.messages)
        
        return [SentimentAnalysisResponse(**result) for result in results]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing sentiment batch: {str(e)}")


@app.post("/api/v1/sentiment/aggregate", response_model=SentimentAggregationResponse)
async def aggregate_sentiment(request: SentimentAggregationRequest):
    """
    Aggregate sentiment by tags from message records.
    
    Request body:
    {
        "messages": [
            {
                "sentiment": "positive",
                "tags": {
                    "places": ["goa"],
                    "hotels": [],
                    "themes": ["beach"]
                }
            },
            ...
        ]
    }
    
    Returns aggregated sentiment by places, hotels, and themes.
    """
    try:
        init_services()
        
        if not request.messages or len(request.messages) == 0:
            raise HTTPException(status_code=400, detail="Messages list cannot be empty")
        
        result = sentiment_analysis_service.aggregate_sentiment(request.messages)
        
        return SentimentAggregationResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error aggregating sentiment: {str(e)}")


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
