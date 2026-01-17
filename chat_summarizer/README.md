# Chat Summarizer Module

A Python module for summarizing unread community chat messages using the Hugging Face Inference API.

## Features

- Summarizes unread chat messages when thresholds are met
- Uses Hugging Face's `facebook/bart-large-cnn` model for summarization
- Returns concise bullet-point summaries (max 5 points)
- Handles errors gracefully with clear error messages

## Requirements

- Python 3.8+
- Hugging Face API key

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variable:
```bash
export HF_API_KEY="your_api_key_here"
```

Or create a `.env` file in the backend directory:
```
HF_API_KEY=your_api_key_here
```

## Usage

```python
from chat_summarizer import summarize_unread_messages

messages = [
    "Message 1 text here...",
    "Message 2 text here...",
    # ... more messages
]

result = summarize_unread_messages(messages)

if result['summarized']:
    print("Summary:")
    for bullet in result['summary']:
        print(f"  • {bullet}")
else:
    print(f"Not summarized: {result['reason']}")
    print(f"Stats: {result['stats']}")
```

## Thresholds

Summarization only occurs when **both** conditions are met:
- **Message count**: ≥ 15 messages
- **Word count**: ≥ 200 words

If either threshold is not met, the function returns `summarized=False` with a reason.

## Return Format

The function returns a dictionary with the following structure:

```python
{
    'summarized': bool,      # Whether summarization was performed
    'summary': list[str],    # List of bullet point strings (max 5)
    'reason': str,           # Reason if not summarized or error occurred
    'stats': {
        'message_count': int,  # Number of messages
        'word_count': int      # Total word count
    }
}
```

## Error Handling

- **Invalid input**: Raises `ValueError` for invalid message formats
- **Missing API key**: Raises `RuntimeError` if API key is not set
- **API errors**: Returns `summarized=False` with error reason in the `reason` field

## Module Structure

- `config.py`: Configuration and environment variable handling
- `validator.py`: Input validation and threshold checking
- `summarizer.py`: Message combination, API calls, and formatting
- `__init__.py`: Public API exports
