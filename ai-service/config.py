"""
Configuration settings for the AI microservice
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Application settings"""
    
    # Server Configuration
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8001"))
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    
    # AI Service Configuration
    AI_SERVICE_URL: str = os.getenv("AI_SERVICE_URL", "http://localhost:8000")
    AI_API_KEY: str = os.getenv("AI_API_KEY", "")
    
    # Backend Configuration
    BACKEND_URL: str = os.getenv("BACKEND_URL", "http://localhost:3000")
    BACKEND_API_KEY: str = os.getenv("BACKEND_API_KEY", "")
    
    # CORS Configuration
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    CORS_ORIGINS: list = os.getenv("CORS_ORIGINS", "*").split(",")
    
    # Request Timeouts
    AI_SERVICE_TIMEOUT: int = int(os.getenv("AI_SERVICE_TIMEOUT", "30"))
    
    # Content Moderation Settings
    MODERATION_THRESHOLD: float = float(os.getenv("MODERATION_THRESHOLD", "0.7"))
    
    # Similar Hotels Settings
    MAX_SIMILAR_HOTELS: int = int(os.getenv("MAX_SIMILAR_HOTELS", "10"))
    
    # Azure OpenAI Configuration
    AZURE_OPENAI_API_KEY: str = os.getenv("AZURE_OPENAI_API_KEY", "")
    AZURE_OPENAI_ENDPOINT: str = os.getenv("AZURE_OPENAI_ENDPOINT", "")
    AZURE_OPENAI_API_VERSION: str = os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-15-preview")
    AZURE_CHAT_DEPLOYMENT: str = os.getenv("AZURE_CHAT_DEPLOYMENT", "")


settings = Settings()
