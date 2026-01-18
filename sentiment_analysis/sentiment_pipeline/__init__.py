"""Sentiment analysis and tagging pipeline for chat messages.

Provides unified processing that combines sentiment analysis and tag extraction.
"""

from .pipeline import process_message, process_message_simple

__all__ = ['process_message', 'process_message_simple']
