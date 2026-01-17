"""Unified sentiment analysis and tagging pipeline.

Processes moderated chat messages through sentiment analysis and tag extraction,
applying message-level sentiment to all extracted tags.
"""

from typing import Dict
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sentiment_analysis.sentiment_analyzer import analyze_sentiment
from sentiment_analysis.message_tagger import extract_tags


def process_message(message_text: str) -> Dict:
    """Process a moderated chat message through sentiment analysis and tagging.
    
    Pipeline:
    1. Run sentiment analysis once per message
    2. Extract tags (place, hotel, theme)
    3. Apply the same sentiment result to all extracted tags
    4. Return structured result
    
    Rules:
    - Sentiment is computed once per message (message-level)
    - If no tags are extracted, sentiment is not stored for aggregation
    - Deterministic and simple logic
    
    Args:
        message_text: The moderated message text to process. Must be non-empty.
        
    Returns:
        Dictionary with keys:
            - 'message_sentiment': dict with 'sentiment', 'confidence', 'raw_scores'
            - 'tags': dict with 'places', 'hotels', 'themes' (lists of tag strings)
            - 'tag_sentiments': list of dicts, each with 'tag', 'tag_type', 'sentiment', 'confidence'
            - 'has_tags': bool indicating if any tags were extracted
            
        If no tags are extracted:
            - 'message_sentiment' is still populated
            - 'tag_sentiments' is an empty list
            - 'has_tags' is False
            
    Raises:
        ValueError: If message_text is empty or None
        RuntimeError: If sentiment analysis fails
        
    Example:
        >>> result = process_message("Baga is crowded but great for families")
        >>> result['message_sentiment']['sentiment']  # "positive" or "neutral" or "negative"
        >>> result['tags']['places']  # ['baga beach']
        >>> result['tags']['themes']  # ['crowded', 'family']
        >>> result['tag_sentiments']  # [{'tag': 'baga beach', 'tag_type': 'place', ...}, ...]
        >>> result['has_tags']  # True
    """
    if not message_text or not isinstance(message_text, str) or not message_text.strip():
        raise ValueError("Message text must be a non-empty string")
    
    # Step 1: Run sentiment analysis once per message
    sentiment_result = analyze_sentiment(message_text)
    
    # Step 2: Extract tags
    tags_result = extract_tags(message_text)
    
    # Collect all tags with their types
    tag_types = [('places', 'place'), ('hotels', 'hotel'), ('themes', 'theme')]
    all_tags = [
        {'tag': tag, 'tag_type': tag_type}
        for key, tag_type in tag_types
        for tag in tags_result[key]
    ]
    
    # Step 3: Apply the same sentiment to all extracted tags
    tag_sentiments = []
    if all_tags:
        # Only create tag-sentiment pairs if tags were found
        for tag_info in all_tags:
            tag_sentiments.append({
                'tag': tag_info['tag'],
                'tag_type': tag_info['tag_type'],
                'sentiment': sentiment_result['sentiment'],
                'confidence': sentiment_result['confidence']
            })
    
    # Step 4: Return structured result
    return {
        'message_sentiment': {
            'sentiment': sentiment_result['sentiment'],
            'confidence': sentiment_result['confidence'],
            'raw_scores': sentiment_result['raw_scores']
        },
        'tags': {
            'places': tags_result['places'],
            'hotels': tags_result['hotels'],
            'themes': tags_result['themes']
        },
        'tag_sentiments': tag_sentiments,
        'has_tags': bool(all_tags)
    }


def process_message_simple(message_text: str) -> Dict:
    """Simplified version that returns only essential fields.
    
    Args:
        message_text: The moderated message text to process
        
    Returns:
        Dictionary with keys:
            - 'sentiment': "positive" | "neutral" | "negative"
            - 'confidence': float
            - 'tags': list of all tag strings
            - 'tag_sentiments': list of tag-sentiment pairs (only if tags exist)
    """
    result = process_message(message_text)
    
    # Flatten tags into a single list
    all_tags = result['tags']['places'] + result['tags']['hotels'] + result['tags']['themes']
    
    return {
        'sentiment': result['message_sentiment']['sentiment'],
        'confidence': result['message_sentiment']['confidence'],
        'tags': all_tags,
        'tag_sentiments': result['tag_sentiments']
    }
