"""Summarization module for chat messages.

Handles message combination, API calls, and summary formatting.
"""

from .config import get_api_key, MAX_BULLET_POINTS
from .validator import should_summarize

# Try to use huggingface_hub InferenceClient (recommended)
try:
    from huggingface_hub import InferenceClient
    USE_INFERENCE_CLIENT = True
except ImportError:
    # Fallback to requests if huggingface_hub is not available
    import requests
    USE_INFERENCE_CLIENT = False


def combine_messages(messages):
    """Combine list of messages into a single text string.
    
    Args:
        messages: List of message strings
        
    Returns:
        str: Combined text with messages separated by double newlines
    """
    # Strip each message and filter out empty ones
    cleaned_messages = [msg.strip() for msg in messages if msg.strip()]
    
    # Join with double newline separator
    return "\n\n".join(cleaned_messages)


def call_huggingface_api(text, api_key, model_name="facebook/bart-large-cnn"):
    """Call Hugging Face Inference API for text summarization.
    
    Uses huggingface_hub InferenceClient if available (recommended),
    otherwise falls back to direct HTTP requests.
    
    Args:
        text: The text to summarize
        api_key: Hugging Face API key
        model_name: The model name to use for summarization
        
    Returns:
        str: The raw summary text from the API
        
    Raises:
        RuntimeError: If API call fails, returns error status, or response
                      is malformed
    """
    if USE_INFERENCE_CLIENT:
        # Use modern InferenceClient (recommended)
        try:
            client = InferenceClient(token=api_key)
            result = client.summarization(text, model=model_name)
            
            # InferenceClient returns SummarizationOutput object
            if hasattr(result, 'summary_text'):
                summary_text = result.summary_text
            elif isinstance(result, str):
                summary_text = result
            elif isinstance(result, dict) and 'summary_text' in result:
                summary_text = result['summary_text']
            else:
                raise RuntimeError(f"Unexpected response format: {type(result)}")
            
            if not summary_text or not summary_text.strip():
                raise RuntimeError("API returned empty summary")
            
            return summary_text
            
        except Exception as e:
            # Wrap any exception in RuntimeError for consistency
            error_msg = str(e)
            if "401" in error_msg or "Unauthorized" in error_msg:
                raise RuntimeError("Authentication failed. Please check your API key.")
            elif "429" in error_msg or "rate limit" in error_msg.lower():
                raise RuntimeError("Rate limit exceeded. Please try again later.")
            elif "503" in error_msg or "unavailable" in error_msg.lower():
                raise RuntimeError("Service unavailable. The model may be loading. Please try again later.")
            else:
                raise RuntimeError(f"API request failed: {error_msg}")
    
    else:
        # Fallback to direct HTTP requests (legacy)
        import requests
        from .config import get_api_url
        
        api_url = get_api_url()
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {"inputs": text}
        
        try:
            response = requests.post(
                api_url,
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                try:
                    result = response.json()
                    if isinstance(result, list) and len(result) > 0:
                        summary_text = result[0].get("summary_text", "")
                        if not summary_text:
                            raise RuntimeError("API returned empty summary")
                        return summary_text
                    elif isinstance(result, dict) and "summary_text" in result:
                        return result["summary_text"]
                    else:
                        raise RuntimeError(f"Unexpected API response format: {result}")
                except (KeyError, IndexError, ValueError) as e:
                    raise RuntimeError(
                        f"Failed to parse API response: {e}. "
                        f"Response: {response.text[:200]}"
                    )
            elif response.status_code == 401:
                raise RuntimeError("Authentication failed. Please check your API key.")
            elif response.status_code == 403:
                raise RuntimeError("Access forbidden. Please check your API key permissions.")
            elif response.status_code == 429:
                raise RuntimeError("Rate limit exceeded. Please try again later.")
            elif response.status_code == 503:
                raise RuntimeError("Service unavailable. The model may be loading. Please try again later.")
            else:
                raise RuntimeError(
                    f"API request failed with status {response.status_code}: "
                    f"{response.text[:200]}"
                )
        except requests.Timeout:
            raise RuntimeError("API request timed out after 30 seconds")
        except requests.ConnectionError as e:
            raise RuntimeError(f"Connection error: {e}")
        except requests.RequestException as e:
            raise RuntimeError(f"API request failed: {e}")


def format_summary(raw_summary, max_bullets=MAX_BULLET_POINTS):
    """Format raw summary text into bullet points.
    
    Args:
        raw_summary: The raw summary text from the API
        max_bullets: Maximum number of bullet points (default: 5)
        
    Returns:
        list[str]: List of bullet point strings
    """
    if not raw_summary or not raw_summary.strip():
        return []
    
    # Split by periods followed by space (sentence boundaries)
    sentences = [
        s.strip() 
        for s in raw_summary.split(". ") 
        if s.strip()
    ]
    
    # If period-based splitting didn't work well, try newlines
    if len(sentences) < 2:
        sentences = [
            s.strip() 
            for s in raw_summary.split("\n") 
            if s.strip()
        ]
    
    # If still not enough, try semicolons
    if len(sentences) < 2:
        sentences = [
            s.strip() 
            for s in raw_summary.split(";") 
            if s.strip()
        ]
    
    # Limit to max_bullets
    sentences = sentences[:max_bullets]
    
    # Format as bullet points
    bullets = []
    for sentence in sentences:
        # Remove trailing period if present
        sentence = sentence.rstrip(".")
        # Ensure it starts with capital letter
        if sentence and not sentence[0].isupper():
            sentence = sentence[0].upper() + sentence[1:] if len(sentence) > 1 else sentence.upper()
        # Only add non-empty sentences
        if sentence:
            bullets.append(sentence)
    
    return bullets


def summarize_unread_messages(messages):
    """Summarize unread chat messages if thresholds are met.
    
    Args:
        messages: List of unread chat message strings (plain text)
        
    Returns:
        dict with keys:
            - 'summarized': bool - Whether summarization was performed
            - 'summary': list[str] - List of bullet point strings (max 5)
            - 'reason': str - Reason if not summarized or if error occurred
            - 'stats': dict - Contains 'message_count' and 'word_count'
            
    Raises:
        ValueError: If messages is invalid (empty, None, wrong type)
    """
    # Step 1: Check thresholds
    should_sum, threshold_info = should_summarize(messages)
    
    stats = {
        'message_count': threshold_info['message_count'],
        'word_count': threshold_info['word_count']
    }
    
    if not should_sum:
        return {
            'summarized': False,
            'summary': [],
            'reason': threshold_info['reason'],
            'stats': stats
        }
    
    # Step 2: Combine messages
    combined_text = combine_messages(messages)
    
    # Step 3: Call API
    try:
        api_key = get_api_key()
        from .config import MODEL_NAME
        raw_summary = call_huggingface_api(combined_text, api_key, MODEL_NAME)
    except RuntimeError as e:
        return {
            'summarized': False,
            'summary': [],
            'reason': f"API error: {str(e)}",
            'stats': stats
        }
    
    # Step 4: Format summary
    formatted_bullets = format_summary(raw_summary, MAX_BULLET_POINTS)
    
    # Step 5: Return result
    return {
        'summarized': True,
        'summary': formatted_bullets,
        'reason': 'Thresholds met',
        'stats': stats
    }
