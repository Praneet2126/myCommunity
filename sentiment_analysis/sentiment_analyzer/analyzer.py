"""Sentiment analysis module using Hugging Face Transformers.

Provides local sentiment classification for chat messages.
Uses singleton pattern to cache model initialization.
"""

import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from .config import MODEL_NAME, SENTIMENT_LABELS, USE_CPU

# Global model instance (singleton)
_model = None
_tokenizer = None


def _get_device():
    """Get the device for model inference (CPU for local execution).
    
    Returns:
        torch.device: The device to use for inference
    """
    if USE_CPU:
        return torch.device("cpu")
    # Only use CUDA if explicitly available and not forcing CPU
    return torch.device("cuda" if torch.cuda.is_available() else "cpu")


def _initialize_model():
    """Initialize the sentiment analysis model and tokenizer.
    
    Uses singleton pattern to ensure model is only loaded once.
    This function is called automatically on first use.
    
    Returns:
        tuple: (model, tokenizer) - The initialized model and tokenizer
    """
    global _model, _tokenizer
    
    if _model is not None and _tokenizer is not None:
        return _model, _tokenizer
    
    device = _get_device()
    
    print(f"Loading sentiment model: {MODEL_NAME} on {device}")
    
    try:
        # Load tokenizer
        _tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        
        # Load model
        _model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)
        _model.to(device)
        _model.eval()  # Set to evaluation mode
        
        print(f"Model loaded successfully on {device}")
        
    except Exception as e:
        raise RuntimeError(
            f"Failed to load sentiment model {MODEL_NAME}: {str(e)}. "
            "Make sure transformers and torch are installed, and you have internet "
            "access for the first-time model download."
        ) from e
    
    return _model, _tokenizer


def get_sentiment_analyzer():
    """Get the initialized sentiment analyzer model and tokenizer.
    
    Returns:
        tuple: (model, tokenizer) - The initialized model and tokenizer
        
    Example:
        >>> model, tokenizer = get_sentiment_analyzer()
    """
    return _initialize_model()


def analyze_sentiment(text):
    """Analyze sentiment of a text message.
    
    Args:
        text (str): The message text to analyze. Must be non-empty.
        
    Returns:
        dict: Dictionary with keys:
            - 'sentiment' (str): One of "positive", "neutral", "negative"
            - 'confidence' (float): Confidence score between 0.0 and 1.0
            - 'raw_scores' (dict): Raw logit scores for each sentiment class
            
    Raises:
        ValueError: If text is empty or None
        RuntimeError: If model fails to load or inference fails
        
    Example:
        >>> result = analyze_sentiment("I love this place!")
        >>> print(result['sentiment'])  # "positive"
        >>> print(result['confidence'])  # 0.95
    """
    if not text or not isinstance(text, str) or not text.strip():
        raise ValueError("Text must be a non-empty string")
    
    # Initialize model if not already done
    model, tokenizer = _initialize_model()
    device = _get_device()
    
    try:
        # Tokenize input
        inputs = tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            max_length=512,
            padding=True
        )
        inputs = {k: v.to(device) for k, v in inputs.items()}
        
        # Run inference (no gradient computation for efficiency)
        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits[0]
            
        # Apply softmax to get probabilities
        probabilities = torch.nn.functional.softmax(logits, dim=-1)
        
        # Get predicted class (highest probability)
        predicted_class = torch.argmax(probabilities).item()
        confidence = probabilities[predicted_class].item()
        
        # Map to sentiment label
        sentiment = SENTIMENT_LABELS.get(predicted_class, "neutral")
        
        # Get raw scores for all classes
        raw_scores = {
            SENTIMENT_LABELS[i]: probabilities[i].item()
            for i in range(len(SENTIMENT_LABELS))
        }
        
        return {
            'sentiment': sentiment,
            'confidence': confidence,
            'raw_scores': raw_scores
        }
        
    except Exception as e:
        raise RuntimeError(
            f"Sentiment analysis failed: {str(e)}"
        ) from e
