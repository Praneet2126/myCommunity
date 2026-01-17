"""Sentiment analysis module for chat messages.

Provides local sentiment classification using Hugging Face Transformers.
"""

from .analyzer import analyze_sentiment, get_sentiment_analyzer

__all__ = ['analyze_sentiment', 'get_sentiment_analyzer']
