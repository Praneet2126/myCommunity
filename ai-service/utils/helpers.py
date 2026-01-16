"""
Helper utility functions
"""
from typing import Optional
import base64
from PIL import Image
import io


def validate_image(image_data: bytes) -> bool:
    """Validate that the uploaded file is a valid image"""
    try:
        Image.open(io.BytesIO(image_data))
        return True
    except Exception:
        return False


def process_image_base64(base64_string: str) -> Optional[bytes]:
    """Convert base64 string to image bytes"""
    try:
        # Remove data URL prefix if present
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        image_bytes = base64.b64decode(base64_string)
        return image_bytes
    except Exception:
        return None


def format_similarity_score(score: float) -> float:
    """Format similarity score to 2 decimal places"""
    return round(score, 2)
