# Sentiment Analyzer

Local sentiment analysis module for chat messages using Hugging Face Transformers.

## Overview

This module provides sentiment classification for chat messages using the `cardiffnlp/twitter-roberta-base-sentiment` model. It runs entirely locally (CPU-friendly) and uses a singleton pattern to cache the model for efficient reuse.

## Features

- ✅ Local inference (no API calls)
- ✅ CPU-friendly execution
- ✅ Singleton model initialization (loaded once, reused)
- ✅ Returns sentiment label and confidence score
- ✅ Independent and reusable module

## Installation

```bash
cd sentiment_analyzer
pip install -r requirements.txt
```

**Note:** On first run, the model will be downloaded from Hugging Face (requires internet connection). Subsequent runs use the cached model.

## Usage

### Basic Usage

```python
from sentiment_analyzer import analyze_sentiment

# Analyze a message
result = analyze_sentiment("I love this place! It's amazing!")

print(result['sentiment'])    # "positive"
print(result['confidence'])   # 0.95
print(result['raw_scores'])   # {'negative': 0.02, 'neutral': 0.03, 'positive': 0.95}
```

### Programmatic Access

```python
from sentiment_analyzer import get_sentiment_analyzer

# Get the model and tokenizer (initializes on first call)
model, tokenizer = get_sentiment_analyzer()

# Use directly if needed
# ... custom inference code ...
```

## API Reference

### `analyze_sentiment(text)`

Analyzes the sentiment of a text message.

**Parameters:**
- `text` (str): The message text to analyze. Must be non-empty.

**Returns:**
- `dict`: Dictionary with keys:
  - `sentiment` (str): One of `"positive"`, `"neutral"`, `"negative"`
  - `confidence` (float): Confidence score between 0.0 and 1.0
  - `raw_scores` (dict): Raw probability scores for each sentiment class

**Raises:**
- `ValueError`: If text is empty or None
- `RuntimeError`: If model fails to load or inference fails

### `get_sentiment_analyzer()`

Returns the initialized model and tokenizer (singleton pattern).

**Returns:**
- `tuple`: `(model, tokenizer)` - The initialized model and tokenizer

## Model Details

- **Model:** `cardiffnlp/twitter-roberta-base-sentiment`
- **Task:** Sentiment classification
- **Labels:** negative (0), neutral (1), positive (2)
- **Device:** CPU (forced for local execution)
- **Max Length:** 512 tokens (truncated automatically)

## Performance

- **First call:** Model loading time (~2-5 seconds depending on hardware)
- **Subsequent calls:** Fast inference (~50-200ms per message on CPU)
- **Memory:** Model uses ~500MB RAM when loaded

## Error Handling

The module raises clear exceptions:
- `ValueError` for invalid input
- `RuntimeError` for model loading or inference failures

## Example Output

```python
result = analyze_sentiment("This hotel was terrible, I would never stay here again.")

# Output:
{
    'sentiment': 'negative',
    'confidence': 0.92,
    'raw_scores': {
        'negative': 0.92,
        'neutral': 0.05,
        'positive': 0.03
    }
}
```

## Integration

This module is designed to be integrated into the backend message processing pipeline:

1. Message received
2. Moderation check passes
3. Call `analyze_sentiment(message.content)`
4. Store results in message document

## Requirements

- Python 3.8+
- torch >= 2.0.0
- transformers >= 4.30.0
- numpy >= 1.24.0

## Notes

- Model is downloaded automatically on first use (requires internet)
- Model is cached in Hugging Face cache directory (`~/.cache/huggingface/`)
- CPU-only execution ensures compatibility without GPU requirements
