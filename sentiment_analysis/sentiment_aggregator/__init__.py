"""Sentiment aggregation module for tag-based sentiment analysis.

Provides deterministic aggregation of message-level sentiment records by tags.
"""

from .aggregator import aggregate_sentiment_by_tags, get_aggregation_summary

__all__ = ['aggregate_sentiment_by_tags', 'get_aggregation_summary']
