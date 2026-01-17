"""Sentiment aggregation logic for tag-based sentiment analysis.

Aggregates message-level sentiment records by tags with weighted scoring.
"""

from typing import List, Dict, Any
from collections import defaultdict, Counter
from .config import (
    MIN_MESSAGE_THRESHOLD,
    POSITIVE_THRESHOLD,
    NEGATIVE_THRESHOLD,
    SENTIMENT_WEIGHTS
)

# Entity type mapping (constant, defined once)
ENTITY_TYPE_MAP = {
    'places': 'place',
    'hotels': 'hotel',
    'themes': 'theme'
}

# Valid sentiment values
VALID_SENTIMENTS = {'positive', 'neutral', 'negative'}


def aggregate_sentiment_by_tags(messages: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
    """Aggregate sentiment by tags from message-level sentiment records.
    
    Processes a list of messages with sentiment and tags, aggregates sentiment
    for each unique tag independently, applies weighted scoring, and assigns
    final labels based on score thresholds.
    
    Args:
        messages: List of message records, each containing:
            - sentiment: "positive" | "neutral" | "negative"
            - tags: dict with keys "places", "hotels", "themes" (each a list of strings)
            
    Returns:
        Dictionary with keys:
            - 'places': List of aggregated entity results
            - 'hotels': List of aggregated entity results
            - 'themes': List of aggregated entity results
            
        Each entity result contains:
            - entity_type: str - "place", "hotel", or "theme"
            - entity_name: str - The entity/tag name
            - total_messages: int - Total number of messages mentioning this entity
            - sentiment_distribution: dict - {
                'positive': int,
                'neutral': int,
                'negative': int
              }
            - sentiment_score: float - Weighted score: (positive - negative) / total
            - sentiment_label: str - "Mostly Positive", "Mostly Negative", or "Mixed"
            
    Example:
        >>> messages = [
        ...     {
        ...         'sentiment': 'positive',
        ...         'tags': {'places': ['goa'], 'hotels': [], 'themes': ['beach']}
        ...     },
        ...     {
        ...         'sentiment': 'negative',
        ...         'tags': {'places': ['goa'], 'hotels': [], 'themes': []}
        ...     }
        ... ]
        >>> result = aggregate_sentiment_by_tags(messages)
        >>> # result['places'] will contain aggregation for 'goa'
    """
    if not messages:
        return {
            'places': [],
            'hotels': [],
            'themes': []
        }
    
    # Step 1: Collect tag-sentiment pairs
    # Structure: { tag_type: { tag_name: [sentiment1, sentiment2, ...] } }
    tag_sentiments = {
        'places': defaultdict(list),
        'hotels': defaultdict(list),
        'themes': defaultdict(list)
    }
    
    # Extract all tag-sentiment pairs from messages
    for message in messages:
        sentiment = message.get('sentiment')
        tags = message.get('tags', {})
        
        # Skip messages without sentiment or tags
        if not sentiment or not tags:
            continue
        
        # Validate sentiment value
        if sentiment not in VALID_SENTIMENTS:
            continue  # Skip messages with invalid sentiment
        
        # Process each tag type
        for tag_type in ['places', 'hotels', 'themes']:
            tag_list = tags.get(tag_type, [])
            for tag in tag_list:
                if tag:  # Ensure tag is not empty
                    tag_sentiments[tag_type][tag].append(sentiment)
    
    # Step 2: Aggregate statistics for each tag
    aggregated_results = {
        'places': [],
        'hotels': [],
        'themes': []
    }
    
    for tag_type, tag_data in tag_sentiments.items():
        for tag_name, sentiments in tag_data.items():
            # Count sentiments efficiently using Counter
            total = len(sentiments)
            sentiment_counts = Counter(sentiments)
            positive_count = sentiment_counts.get('positive', 0)
            neutral_count = sentiment_counts.get('neutral', 0)
            negative_count = sentiment_counts.get('negative', 0)
            
            # Apply minimum threshold
            if total < MIN_MESSAGE_THRESHOLD:
                continue  # Skip tags below threshold
            
            # Calculate weighted score
            # score = (positive - negative) / total
            # Using weights: positive = +1, neutral = 0, negative = -1
            weighted_sum = (
                positive_count * SENTIMENT_WEIGHTS['positive'] +
                neutral_count * SENTIMENT_WEIGHTS['neutral'] +
                negative_count * SENTIMENT_WEIGHTS['negative']
            )
            score = weighted_sum / total if total > 0 else 0.0
            
            # Assign final label
            # Handle pure neutral case (all messages are neutral)
            if positive_count == 0 and negative_count == 0 and neutral_count > 0:
                label = "Neutral"
            elif score > POSITIVE_THRESHOLD:
                label = "Mostly Positive"
            elif score < NEGATIVE_THRESHOLD:
                label = "Mostly Negative"
            else:
                label = "Mixed"
            
            # Map tag_type to entity_type
            entity_type = ENTITY_TYPE_MAP[tag_type]
            
            # Create aggregated result with clean structure
            result = {
                'entity_type': entity_type,
                'entity_name': tag_name,
                'total_messages': total,
                'sentiment_distribution': {
                    'positive': positive_count,
                    'neutral': neutral_count,
                    'negative': negative_count
                },
                'sentiment_score': round(score, 4),  # Round to 4 decimal places
                'sentiment_label': label
            }
            
            aggregated_results[tag_type].append(result)
    
    # Step 3: Sort results by total_messages (descending) for consistency
    for tag_type in aggregated_results:
        aggregated_results[tag_type].sort(key=lambda x: x['total_messages'], reverse=True)
    
    return aggregated_results


def get_aggregation_summary(aggregated_results: Dict[str, List[Dict[str, Any]]]) -> Dict[str, Any]:
    """Get summary statistics from aggregated results.
    
    Args:
        aggregated_results: Output from aggregate_sentiment_by_tags()
        
    Returns:
        Dictionary with summary statistics:
            - total_tags: Total number of tags across all categories
            - places_count: Number of place tags
            - hotels_count: Number of hotel tags
            - themes_count: Number of theme tags
            - mostly_positive: Count of tags labeled "Mostly Positive"
            - mostly_negative: Count of tags labeled "Mostly Negative"
            - mixed: Count of tags labeled "Mixed"
    """
    total_tags = 0
    label_counts = {
        'Mostly Positive': 0,
        'Mostly Negative': 0,
        'Mixed': 0,
        'Neutral': 0
    }
    
    for tag_type, tags in aggregated_results.items():
        total_tags += len(tags)
        for tag in tags:
            label = tag.get('sentiment_label', 'Mixed')
            label_counts[label] = label_counts.get(label, 0) + 1
    
    return {
        'total_tags': total_tags,
        'places_count': len(aggregated_results['places']),
        'hotels_count': len(aggregated_results['hotels']),
        'themes_count': len(aggregated_results['themes']),
        'mostly_positive': label_counts['Mostly Positive'],
        'mostly_negative': label_counts['Mostly Negative'],
        'mixed': label_counts['Mixed'],
        'neutral': label_counts['Neutral']
    }
