# Sentiment Analysis Feature

Complete sentiment analysis and aggregation system for chat messages.

## Overview

This folder contains all modules for the sentiment analysis feature:
- **Sentiment Analysis**: Local ML model for sentiment classification
- **Message Tagging**: Keyword-based tag extraction (places, hotels, themes)
- **Sentiment Pipeline**: Unified processing combining sentiment + tagging
- **Sentiment Aggregation**: Tag-based sentiment aggregation with scoring

## Structure

```
sentiment_analysis/
├── sentiment_analyzer/      # Sentiment classification using Hugging Face
├── message_tagger/           # Keyword-based tag extraction
├── sentiment_pipeline/       # Unified sentiment + tagging pipeline
└── sentiment_aggregator/     # Tag-based sentiment aggregation
```

## Quick Start

### Installation

```bash
# Install dependencies for sentiment analyzer (requires torch, transformers)
cd sentiment_analyzer
pip install -r requirements.txt

# Other modules require no additional dependencies
```

### Usage

#### 1. Process a message (sentiment + tagging)

```python
from sentiment_analysis.sentiment_pipeline import process_message

result = process_message("Baga is crowded but great for families")
# Returns: sentiment, tags, tag_sentiments
```

#### 2. Aggregate sentiment by tags

```python
from sentiment_analysis.sentiment_aggregator import aggregate_sentiment_by_tags

messages = [
    {'sentiment': 'positive', 'tags': {'places': ['goa'], 'hotels': [], 'themes': []}},
    # ... more messages
]

result = aggregate_sentiment_by_tags(messages)
# Returns: aggregated sentiment by places, hotels, themes
```

## Module Details

### sentiment_analyzer
- **Purpose**: Sentiment classification using local ML model
- **Model**: `cardiffnlp/twitter-roberta-base-sentiment`
- **Output**: sentiment label, confidence score, raw scores
- **Dependencies**: torch, transformers

### message_tagger
- **Purpose**: Keyword-based tag extraction
- **Tag Types**: places, hotels, themes
- **Output**: Extracted tags per category
- **Dependencies**: None (pure Python)

### sentiment_pipeline
- **Purpose**: Unified processing (sentiment + tagging)
- **Input**: Message text
- **Output**: Sentiment + tags + tag-sentiment pairs
- **Dependencies**: sentiment_analyzer, message_tagger

### sentiment_aggregator
- **Purpose**: Aggregate sentiment by tags
- **Input**: List of message records with sentiment and tags
- **Output**: Aggregated sentiment per entity
- **Dependencies**: None (pure Python)

## Testing

Each module has its own test script:

```bash
# Test sentiment analyzer
python3 sentiment_analysis/sentiment_analyzer/test_sentiment.py

# Test message tagger
python3 sentiment_analysis/message_tagger/test_tagger.py

# Test sentiment pipeline
python3 sentiment_analysis/sentiment_pipeline/test_pipeline.py

# Test aggregator (basic)
python3 sentiment_analysis/sentiment_aggregator/test_aggregator.py

# Test aggregator (comprehensive)
python3 sentiment_analysis/sentiment_aggregator/test_comprehensive.py
```

## Integration

### Backend Integration

When integrating with Node.js backend:

1. **Message Processing**: Call `sentiment_pipeline.process_message()` when saving messages
2. **Aggregation**: Call `sentiment_aggregator.aggregate_sentiment_by_tags()` in API endpoints
3. **Data Format**: Messages should have `sentiment` and `tags` fields

### Import Paths

All modules are under `sentiment_analysis`:

```python
from sentiment_analysis.sentiment_analyzer import analyze_sentiment
from sentiment_analysis.message_tagger import extract_tags
from sentiment_analysis.sentiment_pipeline import process_message
from sentiment_analysis.sentiment_aggregator import aggregate_sentiment_by_tags
```

## Architecture

### Data Flow

```
Message Text
    ↓
Sentiment Pipeline
    ├──→ Sentiment Analyzer (ML model)
    └──→ Message Tagger (keywords)
    ↓
Message Record (with sentiment + tags)
    ↓
Sentiment Aggregator (on-read)
    ↓
Aggregated Results (for charts/dashboard)
```

### Key Principles

- **Message-level sentiment**: Computed once per message
- **Tag-based aggregation**: Sentiment applied to all extracted tags
- **On-read aggregation**: No batch jobs, computed when requested
- **Deterministic**: Same input always produces same output
- **Local processing**: No external API calls

## Requirements

- Python 3.8+
- torch >= 2.0.0 (for sentiment_analyzer)
- transformers >= 4.30.0 (for sentiment_analyzer)
- numpy >= 1.24.0 (for sentiment_analyzer)

## Notes

- Model downloads automatically on first use (requires internet)
- Model cached locally after first download
- All modules are independent and can be used separately
- Test files can be removed after integration if desired
