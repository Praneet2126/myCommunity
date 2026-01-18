"""Keyword-based tag extraction for chat messages.

Provides deterministic tagging using curated keyword lists.
Supports case-insensitive partial matching.
"""

from typing import List, Dict, Set
from .config import PLACE_KEYWORDS, HOTEL_KEYWORDS, THEME_KEYWORDS


def _normalize_text(text: str) -> str:
    """Normalize text for case-insensitive matching.
    
    Args:
        text: Input text string
        
    Returns:
        Lowercased text with extra whitespace normalized
    """
    return text.lower().strip()


def _find_partial_matches(text: str, keywords: Set[str]) -> List[str]:
    """Find keywords that match (partially or fully) in the text.
    
    Supports two types of matching:
    1. Full keyword appears in text (e.g., "baga beach" in "I love baga beach")
    2. Any word from keyword appears in text (e.g., "baga" from "baga beach" in "Baga is crowded")
    
    Args:
        text: Normalized text to search in
        keywords: Set of normalized keywords to match against
        
    Returns:
        List of matched keywords (in original case from config)
    """
    matches = []
    
    # Split text into words for word-based matching
    text_words = set(text.split())
    
    for keyword in keywords:
        # Check if full keyword appears in text
        if keyword in text:
            matches.append(keyword)
        else:
            # Check if any word from keyword appears in text
            keyword_words = keyword.split()
            for word in keyword_words:
                # Only match if word is significant (length > 2 to avoid matching "is", "at", etc.)
                if len(word) > 2 and word in text_words:
                    matches.append(keyword)
                    break  # Found a match, no need to check other words
    
    return matches


def extract_tags(text: str) -> Dict[str, List[str]]:
    """Extract tags from a message using keyword-based matching.
    
    Performs case-insensitive partial matching against curated keyword lists
    for Places, Hotels, and Themes.
    
    Args:
        text: The message text to analyze. Can be empty or None.
        
    Returns:
        Dictionary with keys:
            - 'places': List of matched place keywords
            - 'hotels': List of matched hotel keywords
            - 'themes': List of matched theme keywords
        
        If no tags are found, all lists will be empty.
        If text is empty/None, returns empty lists.
        
    Example:
        >>> result = extract_tags("Baga is crowded and great for families")
        >>> result['places']  # ['baga beach']
        >>> result['themes']   # ['crowded', 'family']
        
        >>> result = extract_tags("Stayed at Marriott")
        >>> result['hotels']   # ['marriott']
    """
    if not text or not isinstance(text, str):
        return {
            'places': [],
            'hotels': [],
            'themes': []
        }
    
    # Normalize input text
    normalized_text = _normalize_text(text)
    
    # Find matches for each category
    place_matches = _find_partial_matches(normalized_text, PLACE_KEYWORDS)
    hotel_matches = _find_partial_matches(normalized_text, HOTEL_KEYWORDS)
    theme_matches = _find_partial_matches(normalized_text, THEME_KEYWORDS)
    
    # Remove duplicates and sort for consistency
    return {
        'places': sorted(list(set(place_matches))),
        'hotels': sorted(list(set(hotel_matches))),
        'themes': sorted(list(set(theme_matches)))
    }


def get_all_tags(text: str) -> List[str]:
    """Get all tags (from all categories) as a flat list.
    
    Args:
        text: The message text to analyze
        
    Returns:
        Flat list of all matched tags across all categories
        
    Example:
        >>> tags = get_all_tags("Baga beach is great for families")
        >>> # ['baga beach', 'family']
    """
    result = extract_tags(text)
    return result['places'] + result['hotels'] + result['themes']


def explain_tags(text: str) -> Dict[str, any]:
    """Extract tags and provide explanation of matches.
    
    Useful for debugging and understanding why certain tags were matched.
    
    Args:
        text: The message text to analyze
        
    Returns:
        Dictionary with:
            - 'tags': Same as extract_tags() output
            - 'matched_text': The normalized text that was searched
            - 'total_matches': Total number of tags found
    """
    tags = extract_tags(text)
    normalized_text = _normalize_text(text) if text else ""
    
    total_matches = len(tags['places']) + len(tags['hotels']) + len(tags['themes'])
    
    return {
        'tags': tags,
        'matched_text': normalized_text,
        'total_matches': total_matches
    }
