"""Chat summarizer module for summarizing unread community chat messages.

This module provides functionality to summarize unread chat messages using
the Hugging Face Inference API when certain thresholds are met.
"""

from .summarizer import summarize_unread_messages

__all__ = ['summarize_unread_messages']
