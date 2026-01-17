# Sentiment Aggregator

Deterministic sentiment aggregation module for tag-based sentiment analysis.

## Overview

This module aggregates message-level sentiment records by tags (places, hotels, themes) using weighted scoring and threshold filtering.

## Features

- ✅ Tag-based aggregation (places, hotels, themes)
- ✅ Weighted scoring (positive=+1, neutral=0, negative=-1)
- ✅ Minimum threshold filtering (default: 10 messages)
- ✅ Automatic label assignment (Mostly Positive, Mostly Negative, Mixed)
- ✅ Deterministic and reusable
- ✅ No database dependencies
- ✅ No batch processing

## Installation

No installation required - pure Python with standard library only.

```bash
# Just ensure Python 3.6+ is available
python --version
```

## Usage

### Basic Usage

```python
from sentiment_aggregator import aggregate_sentiment_by_tags

# Input: List of message records with sentiment and tags
messages = [
    {
        'sentiment': 'positive',
        'tags': {
            'places': ['goa', 'mumbai'],
            'hotels': ['marriott'],
            'themes': ['beach', 'family']
        }
    },
    {
        'sentiment': 'negative',
        'tags': {
            'places': ['goa'],
            'hotels': [],
            'themes': ['crowded']
        }
    },
    # ... more messages
]

# Aggregate sentiment by tags
result = aggregate_sentiment_by_tags(messages)

# Access aggregated results
print(result['places'])  # List of place tag aggregations
print(result['hotels'])  # List of hotel tag aggregations
print(result['themes'])  # List of theme tag aggregations
```

### Example Output

```python
{
    'places': [
        {
            'entity_type': 'place',
            'entity_name': 'goa',
            'total_messages': 45,
            'sentiment_distribution': {
                'positive': 30,
                'neutral': 10,
                'negative': 5
            },
            'sentiment_score': 0.5556,  # (30 - 5) / 45
            'sentiment_label': 'Mostly Positive'
        }
    ],
    'hotels': [
        {
            'entity_type': 'hotel',
            'entity_name': 'marriott',
            'total_messages': 15,
            'sentiment_distribution': {
                'positive': 12,
                'neutral': 2,
                'negative': 1
            },
            'sentiment_score': 0.7333,  # (12 - 1) / 15
            'sentiment_label': 'Mostly Positive'
        }
    ],
    'themes': [
        {
            'entity_type': 'theme',
            'entity_name': 'beach',
            'total_messages': 20,
            'sentiment_distribution': {
                'positive': 5,
                'neutral': 5,
                'negative': 10
            },
            'sentiment_score': -0.25,  # (5 - 10) / 20
            'sentiment_label': 'Mixed'
        }
    ]
}
```

## Aggregation Logic

### Weighted Scoring

- **Positive sentiment**: +1 point
- **Neutral sentiment**: 0 points
- **Negative sentiment**: -1 point

**Score Formula:**
```
score = (positive_count - negative_count) / total_count
```

### Label Assignment

- **score > 0.3** → "Mostly Positive"
- **score < -0.3** → "Mostly Negative"
- **-0.3 ≤ score ≤ 0.3** → "Mixed"

### Threshold Filtering

Tags with fewer than 10 messages are excluded from aggregation results.

## API Reference

### `aggregate_sentiment_by_tags(messages)`

Aggregate sentiment by tags from message-level sentiment records.

**Parameters:**
- `messages` (List[Dict]): List of message records, each with:
  - `sentiment` (str): "positive", "neutral", or "negative"
  - `tags` (dict): Dictionary with keys "places", "hotels", "themes" (each a list of strings)

**Returns:**
- `Dict[str, List[Dict]]`: Dictionary with keys "places", "hotels", "themes", each containing a list of aggregated tag results

**Entity Result Structure:**
- `entity_type` (str): "place", "hotel", or "theme"
- `entity_name` (str): The entity/tag name
- `total_messages` (int): Total number of messages mentioning this entity
- `sentiment_distribution` (dict): {
    'positive': int,
    'neutral': int,
    'negative': int
  }
- `sentiment_score` (float): Weighted score: (positive - negative) / total
- `sentiment_label` (str): "Mostly Positive", "Mostly Negative", or "Mixed"

### `get_aggregation_summary(aggregated_results)`

Get summary statistics from aggregated results.

**Parameters:**
- `aggregated_results`: Output from `aggregate_sentiment_by_tags()`

**Returns:**
- Dictionary with summary counts and statistics

## Configuration

Edit `config.py` to customize:

- `MIN_MESSAGE_THRESHOLD`: Minimum messages required (default: 10)
- `POSITIVE_THRESHOLD`: Score threshold for "Mostly Positive" (default: 0.3)
- `NEGATIVE_THRESHOLD`: Score threshold for "Mostly Negative" (default: -0.3)
- `SENTIMENT_WEIGHTS`: Weight values for each sentiment type

## Examples

### Example 1: Single Entity Aggregation

```python
messages = [
    {'sentiment': 'positive', 'tags': {'places': ['goa'], 'hotels': [], 'themes': []}},
    {'sentiment': 'positive', 'tags': {'places': ['goa'], 'hotels': [], 'themes': []}},
    {'sentiment': 'negative', 'tags': {'places': ['goa'], 'hotels': [], 'themes': []}}
]

result = aggregate_sentiment_by_tags(messages)
# result['places'][0]['sentiment_score'] = (2 - 1) / 3 = 0.3333
# result['places'][0]['sentiment_label'] = "Mostly Positive"
```

### Example 2: Below Threshold

```python
messages = [
    {'sentiment': 'positive', 'tags': {'places': ['goa'], 'hotels': [], 'themes': []}},
    {'sentiment': 'negative', 'tags': {'places': ['goa'], 'hotels': [], 'themes': []}}
]

result = aggregate_sentiment_by_tags(messages)
# result['places'] = []  # Empty because only 2 messages (< 10 threshold)
```

### Example 3: Mixed Sentiment

```python
messages = [
    {'sentiment': 'positive', 'tags': {'themes': ['beach'], 'places': [], 'hotels': []}},
    {'sentiment': 'positive', 'tags': {'themes': ['beach'], 'places': [], 'hotels': []}},
    {'sentiment': 'negative', 'tags': {'themes': ['beach'], 'places': [], 'hotels': []}},
    {'sentiment': 'negative', 'tags': {'themes': ['beach'], 'places': [], 'hotels': []}},
    {'sentiment': 'neutral', 'tags': {'themes': ['beach'], 'places': [], 'hotels': []}}
]

result = aggregate_sentiment_by_tags(messages)
# result['themes'][0]['score'] = (2 - 2) / 5 = 0.0
# result['themes'][0]['label'] = "Mixed"
```

## Integration

This module is designed to work with message records that have already been processed through the sentiment pipeline:

1. Messages are processed through sentiment analysis and tagging
2. Message records contain `sentiment` and `tags` fields
3. Pass these records to `aggregate_sentiment_by_tags()`
4. Get aggregated results for dashboard/analytics

## Notes

- **Deterministic**: Same input always produces same output
- **No side effects**: Pure function, no database writes
- **Reusable**: Can be called multiple times with different message sets
- **Efficient**: O(n) complexity where n is number of messages
