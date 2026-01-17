"""Keyword-based tagging module for chat messages.

Provides deterministic tag extraction for Places, Hotels, and Themes.
"""

from .tagger import extract_tags

__all__ = ['extract_tags']
