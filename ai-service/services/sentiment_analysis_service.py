"""
Sentiment Analysis Service
Integrates sentiment analysis and aggregation from sentiment_analysis module
"""
import sys
import os
from pathlib import Path
from typing import List, Dict, Any

# Add sentiment_analysis to path
sentiment_analysis_path = Path(__file__).parent.parent.parent / "sentiment_analysis"
if str(sentiment_analysis_path) not in sys.path:
    sys.path.insert(0, str(sentiment_analysis_path))

# Import from sentiment_analysis modules
try:
    from sentiment_analysis.sentiment_pipeline import process_message
    from sentiment_analysis.sentiment_aggregator import aggregate_sentiment_by_tags
except ImportError:
    # Fallback if relative imports don't work
    import importlib.util
    
    # Import pipeline
    pipeline_path = sentiment_analysis_path / "sentiment_pipeline" / "pipeline.py"
    spec = importlib.util.spec_from_file_location("pipeline", pipeline_path)
    pipeline_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(pipeline_module)
    process_message = pipeline_module.process_message
    
    # Import aggregator
    aggregator_path = sentiment_analysis_path / "sentiment_aggregator" / "aggregator.py"
    spec2 = importlib.util.spec_from_file_location("aggregator", aggregator_path)
    aggregator_module = importlib.util.module_from_spec(spec2)
    spec2.loader.exec_module(aggregator_module)
    aggregate_sentiment_by_tags = aggregator_module.aggregate_sentiment_by_tags


class SentimentAnalysisService:
    """Service for sentiment analysis and aggregation"""
    
    def __init__(self):
        """Initialize the sentiment analysis service"""
        pass
    
    def analyze_message(
        self,
        message_text: str
    ) -> Dict[str, Any]:
        """
        Analyze sentiment and extract tags from a single message
        
        Args:
            message_text: The message text to analyze
            
        Returns:
            Dictionary with:
                - message_sentiment: dict with sentiment, confidence, raw_scores
                - tags: dict with places, hotels, themes
                - tag_sentiments: list of tag-sentiment pairs
                - has_tags: bool indicating if tags were extracted
        """
        try:
            result = process_message(message_text)
            return result
        except Exception as e:
            raise Exception(f"Error analyzing message sentiment: {str(e)}")
    
    def analyze_messages_batch(
        self,
        messages: List[str]
    ) -> List[Dict[str, Any]]:
        """
        Analyze sentiment for multiple messages
        
        Args:
            messages: List of message texts
            
        Returns:
            List of analysis results, one per message
        """
        try:
            results = []
            for message in messages:
                result = self.analyze_message(message)
                results.append(result)
            return results
        except Exception as e:
            raise Exception(f"Error analyzing messages batch: {str(e)}")
    
    def aggregate_sentiment(
        self,
        messages: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Aggregate sentiment by tags from message records
        
        Args:
            messages: List of message records, each containing:
                - sentiment: "positive" | "neutral" | "negative"
                - tags: dict with "places", "hotels", "themes" keys
                
        Returns:
            Dictionary with aggregated sentiment by entity type:
                - places: List of aggregated place results
                - hotels: List of aggregated hotel results
                - themes: List of aggregated theme results
                
            Each entity result contains:
                - entity_type: str
                - entity_name: str
                - total_messages: int
                - sentiment_distribution: dict
                - sentiment_score: float
                - sentiment_label: str
        """
        try:
            # Convert pipeline results to aggregator format if needed
            formatted_messages = []
            for msg in messages:
                if isinstance(msg, dict):
                    # Check if it's already in the right format
                    if "sentiment" in msg and "tags" in msg:
                        formatted_messages.append({
                            "sentiment": msg["sentiment"],
                            "tags": msg["tags"]
                        })
                    # If it's a pipeline result, extract sentiment and tags
                    elif "message_sentiment" in msg:
                        formatted_messages.append({
                            "sentiment": msg["message_sentiment"]["sentiment"],
                            "tags": msg["tags"]
                        })
            
            result = aggregate_sentiment_by_tags(formatted_messages)
            return result
        except Exception as e:
            raise Exception(f"Error aggregating sentiment: {str(e)}")
