"""Validation module for chat summarizer.

Handles input validation, word counting, and threshold evaluation.
"""

from .config import MIN_MESSAGE_COUNT, MIN_WORD_COUNT


def validate_messages(messages):
    """Validate that messages input is a non-empty list of non-empty strings.
    
    Args:
        messages: The messages to validate
        
    Raises:
        ValueError: If messages is None, not a list, empty, or contains
                    non-string or empty items
    """
    if messages is None:
        raise ValueError("Messages cannot be None")
    
    if not isinstance(messages, list):
        raise ValueError(f"Messages must be a list, got {type(messages).__name__}")
    
    if len(messages) == 0:
        raise ValueError("Messages list cannot be empty")
    
    for i, message in enumerate(messages):
        if not isinstance(message, str):
            raise ValueError(
                f"All messages must be strings. "
                f"Item at index {i} is {type(message).__name__}"
            )
        
        if not message.strip():
            raise ValueError(
                f"All messages must be non-empty. "
                f"Item at index {i} is empty or whitespace only"
            )


def count_words(messages):
    """Count total words across all messages.
    
    Args:
        messages: List of message strings
        
    Returns:
        int: Total word count across all messages
    """
    total_words = 0
    
    for message in messages:
        # Strip whitespace and split by whitespace
        words = message.strip().split()
        # Filter out empty strings and count
        total_words += len([word for word in words if word])
    
    return total_words


def should_summarize(messages):
    """Determine if messages meet the thresholds for summarization.
    
    Args:
        messages: List of message strings
        
    Returns:
        tuple: (bool, dict) where:
            - bool: True if thresholds are met, False otherwise
            - dict: Contains 'message_count', 'word_count', and 'reason'
            
    Raises:
        ValueError: If messages are invalid (from validate_messages)
    """
    # Validate input first
    validate_messages(messages)
    
    message_count = len(messages)
    word_count = count_words(messages)
    
    # Check both thresholds (AND condition)
    message_threshold_met = message_count >= MIN_MESSAGE_COUNT
    word_threshold_met = word_count >= MIN_WORD_COUNT
    
    stats = {
        'message_count': message_count,
        'word_count': word_count
    }
    
    if message_threshold_met and word_threshold_met:
        return True, {**stats, 'reason': 'Thresholds met'}
    
    # Determine reason for not summarizing
    reasons = []
    if not message_threshold_met:
        reasons.append(
            f"Message count ({message_count}) below threshold ({MIN_MESSAGE_COUNT})"
        )
    if not word_threshold_met:
        reasons.append(
            f"Word count ({word_count}) below threshold ({MIN_WORD_COUNT})"
        )
    
    reason = "; ".join(reasons)
    
    return False, {**stats, 'reason': reason}
