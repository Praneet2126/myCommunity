# Sentiment Pipeline

Unified pipeline for sentiment analysis and tagging of chat messages.

## Overview

This module combines sentiment analysis and tag extraction into a single processing pipeline. It processes moderated chat messages by:

1. Running sentiment analysis once per message
2. Extracting tags (places, hotels, themes)
3. Applying the same sentiment result to all extracted tags
4. Returning a structured result

## Features

- ✅ Message-level sentiment (computed once per message)
- ✅ Keyword-based tagging (places, hotels, themes)
- ✅ Sentiment applied to all extracted tags
- ✅ Deterministic and simple logic
- ✅ No sentence splitting or aspect-based sentiment

## Installation

```bash
cd sentiment_pipeline
pip install -r requirements.txt
```

**Note:** This module depends on `sentiment_analyzer` and `message_tagger` modules in the parent directory.

## Usage

### Basic Usage

```python
from sentiment_pipeline import process_message

# Process a moderated message
result = process_message("Baga is crowded but great for families")

print(result['message_sentiment']['sentiment'])  # "positive" or "neutral" or "negative"
print(result['message_sentiment']['confidence'])  # 0.85
print(result['tags']['places'])  # ['baga beach']
print(result['tags']['themes'])  # ['crowded', 'family']
print(result['has_tags'])  # True

# Tag-sentiment pairs
for tag_sent in result['tag_sentiments']:
    print(f"{tag_sent['tag']} ({tag_sent['tag_type']}): {tag_sent['sentiment']}")
```

### Example Output

```python
result = process_message("Stayed at Marriott in Goa, great for families")

# Output structure:
{
    'message_sentiment': {
        'sentiment': 'positive',
        'confidence': 0.92,
        'raw_scores': {
            'negative': 0.03,
            'neutral': 0.05,
            'positive': 0.92
        }
    },
    'tags': {
        'places': ['goa'],
        'hotels': ['marriott'],
        'themes': ['family']
    },
    'tag_sentiments': [
        {
            'tag': 'goa',
            'tag_type': 'place',
            'sentiment': 'positive',
            'confidence': 0.92
        },
        {
            'tag': 'marriott',
            'tag_type': 'hotel',
            'sentiment': 'positive',
            'confidence': 0.92
        },
        {
            'tag': 'family',
            'tag_type': 'theme',
            'sentiment': 'positive',
            'confidence': 0.92
        }
    ],
    'has_tags': True
}
```

### No Tags Case

```python
result = process_message("Hello world")

# Output:
{
    'message_sentiment': {
        'sentiment': 'neutral',
        'confidence': 0.65,
        'raw_scores': {...}
    },
    'tags': {
        'places': [],
        'hotels': [],
        'themes': []
    },
    'tag_sentiments': [],  # Empty - sentiment not stored for aggregation
    'has_tags': False
}
```

## API Reference

### `process_message(message_text)`

Process a moderated chat message through the complete pipeline.

**Parameters:**
- `message_text` (str): The moderated message text. Must be non-empty.

**Returns:**
- `dict`: Structured result with:
  - `message_sentiment`: dict with sentiment, confidence, raw_scores
  - `tags`: dict with places, hotels, themes lists
  - `tag_sentiments`: list of tag-sentiment pairs (empty if no tags)
  - `has_tags`: bool indicating if tags were found

**Raises:**
- `ValueError`: If message_text is empty or None
- `RuntimeError`: If sentiment analysis fails

### `process_message_simple(message_text)`

Simplified version returning only essential fields.

**Returns:**
- `dict`: With sentiment, confidence, tags (flat list), tag_sentiments

## Pipeline Rules

1. **Message-level sentiment**: Sentiment is computed once per entire message
2. **No sentence splitting**: Message is processed as a whole
3. **No aspect-based sentiment**: Single sentiment applies to entire message
4. **Tag-sentiment association**: Same sentiment applied to all extracted tags
5. **No tags = no aggregation**: If no tags found, tag_sentiments is empty
6. **Deterministic**: Same input always produces same output

## Integration

This pipeline is designed to be integrated into the backend message processing flow:

```python
# In your message processing code:
from sentiment_pipeline import process_message

# After moderation passes:
result = process_message(moderated_message.content)

# Store in message document:
message.sentiment = result['message_sentiment']
message.tags = result['tags']
message.tag_sentiments = result['tag_sentiments']  # Only if has_tags is True
```

## Notes

- **Moderation first**: This pipeline expects already-moderated messages
- **Tag filtering**: Only messages with tags will have tag_sentiments populated
- **Performance**: Sentiment analysis runs once, tags are extracted separately
- **Deterministic**: No randomness, same input = same output
