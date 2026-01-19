"""Configuration module for chat summarizer.

Handles environment variables and configuration constants.
"""

import os
import pathlib

# Try to load .env file if python-dotenv is available
# Note: CLI may have already loaded it, but we try here as a fallback
try:
    from dotenv import load_dotenv
    # Load .env file from parent directory (backend/)
    env_path = pathlib.Path(__file__).parent.parent / '.env'
    
    # Only load if API key is not already set (CLI may have loaded it)
    if not os.getenv("HF_API_KEY") and not os.getenv("HUGGINGFACE_API_KEY"):
        if env_path.exists():
            load_dotenv(env_path)
except ImportError:
    # python-dotenv not installed - that's okay if CLI already loaded it
    # or if the environment variable is set another way
    pass
except Exception:
    # Error loading .env - continue anyway
    pass

# Threshold constants
MIN_MESSAGE_COUNT = 5
MIN_WORD_COUNT = 15
MAX_BULLET_POINTS = 5

# Hugging Face API configuration
MODEL_NAME = "facebook/bart-large-cnn"
# Using the new router endpoint (as of 2024, old endpoint is deprecated)
HF_API_URL_TEMPLATE = "https://router.huggingface.co/v1/models/{model_name}"


def get_api_key():
    """Get Hugging Face API key from environment variables.
    
    Checks HF_API_KEY first, then falls back to HUGGINGFACE_API_KEY.
    
    Returns:
        str: The API key
        
    Raises:
        RuntimeError: If neither environment variable is set
    """
    api_key = os.getenv("HF_API_KEY") or os.getenv("HUGGINGFACE_API_KEY")
    
    if not api_key:
        raise RuntimeError(
            "Hugging Face API key not found. "
            "Please set HF_API_KEY or HUGGINGFACE_API_KEY environment variable."
        )
    
    return api_key


def get_api_url():
    """Get the complete Hugging Face API URL for the summarization model.
    
    Returns:
        str: The complete API endpoint URL
    """
    return HF_API_URL_TEMPLATE.format(model_name=MODEL_NAME)
