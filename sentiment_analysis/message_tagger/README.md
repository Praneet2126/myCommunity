# Message Tagger

Keyword-based tagging module for chat messages. Extracts tags for Places, Hotels, and Themes using deterministic keyword matching.

## Overview

This module provides deterministic tag extraction from chat messages using curated keyword lists. It performs case-insensitive partial matching and returns tags in three categories: Places, Hotels, and Themes.

## Features

- ✅ Keyword-based (no NLP/LLM)
- ✅ Case-insensitive matching
- ✅ Partial matches supported
- ✅ Multiple tags per message
- ✅ Deterministic and explainable
- ✅ No external dependencies (pure Python)

## Installation

No installation required - pure Python with standard library only.

```bash
# Just ensure Python 3.6+ is available
python --version
```

## Usage

### Basic Usage

```python
from message_tagger import extract_tags

# Extract tags from a message
result = extract_tags("Baga is crowded and great for families")

print(result['places'])  # ['baga beach']
print(result['hotels'])  # []
print(result['themes'])   # ['crowded', 'family']
```

### Example Cases

```python
# Place tag
result = extract_tags("Baga is crowded")
# {'places': ['baga beach'], 'hotels': [], 'themes': ['crowded']}

# Hotel tag
result = extract_tags("Stayed at Marriott")
# {'places': [], 'hotels': ['marriott'], 'themes': []}

# Theme tag
result = extract_tags("Good for families")
# {'places': [], 'hotels': [], 'themes': ['family']}

# Multiple tags
result = extract_tags("Marriott in Goa is great for beach lovers")
# {'places': ['goa'], 'hotels': ['marriott'], 'themes': ['beach']}
```

### Get All Tags

```python
from message_tagger.tagger import get_all_tags

tags = get_all_tags("Baga beach is great for families")
# ['baga beach', 'family']
```

### Explain Tags (Debug)

```python
from message_tagger.tagger import explain_tags

result = explain_tags("Baga is crowded")
# {
#   'tags': {'places': ['baga beach'], 'hotels': [], 'themes': ['crowded']},
#   'matched_text': 'baga is crowded',
#   'total_matches': 2
# }
```

## API Reference

### `extract_tags(text)`

Extract tags from a message text.

**Parameters:**
- `text` (str): The message text to analyze. Can be empty or None.

**Returns:**
- `dict`: Dictionary with keys:
  - `places` (List[str]): Matched place keywords
  - `hotels` (List[str]): Matched hotel keywords
  - `themes` (List[str]): Matched theme keywords

**Example:**
```python
result = extract_tags("Baga is crowded")
# {'places': ['baga beach'], 'hotels': [], 'themes': ['crowded']}
```

### `get_all_tags(text)`

Get all tags as a flat list across all categories.

**Parameters:**
- `text` (str): The message text to analyze

**Returns:**
- `List[str]`: Flat list of all matched tags

### `explain_tags(text)`

Extract tags with additional debugging information.

**Parameters:**
- `text` (str): The message text to analyze

**Returns:**
- `dict`: Dictionary with tags, matched text, and total match count

## Tag Categories

### Places
- Beaches (Baga, Calangute, Anjuna, etc.)
- Cities (Mumbai, Delhi, Goa, etc.)
- Landmarks (Taj Mahal, Gateway of India, etc.)
- Tourist spots

### Hotels
- International chains (Marriott, Hilton, Hyatt, etc.)
- Luxury brands (Taj, Oberoi, ITC, etc.)
- Budget chains (OYO, Treebo, etc.)
- Common hotel terms

### Themes
- Activities (adventure, hiking, beach, nightlife, etc.)
- Interests (photography, food, culture, etc.)
- Demographics (family, couples, solo, etc.)
- Atmosphere (peaceful, vibrant, crowded, etc.)

## Matching Logic

1. **Case-insensitive**: All matching is done in lowercase
2. **Partial matching**: Keywords can appear anywhere in the text
3. **Multiple matches**: A message can have multiple tags from each category
4. **Deduplication**: Duplicate matches are automatically removed
5. **Sorted output**: Tags are returned in sorted order for consistency

## Examples

```python
# Example 1: Place + Theme
extract_tags("Baga is crowded")
# {'places': ['baga beach'], 'hotels': [], 'themes': ['crowded']}

# Example 2: Hotel
extract_tags("Stayed at Marriott")
# {'places': [], 'hotels': ['marriott'], 'themes': []}

# Example 3: Theme
extract_tags("Good for families")
# {'places': [], 'hotels': [], 'themes': ['family']}

# Example 4: Multiple categories
extract_tags("Marriott in Goa is great for beach lovers")
# {'places': ['goa'], 'hotels': ['marriott'], 'themes': ['beach']}

# Example 5: No matches
extract_tags("Hello world")
# {'places': [], 'hotels': [], 'themes': []}
```

## Customization

To add or modify keywords, edit `config.py`:

- `PLACE_KEYWORDS`: Set of place-related keywords
- `HOTEL_KEYWORDS`: Set of hotel-related keywords
- `THEME_KEYWORDS`: Set of theme-related keywords

All keywords should be in lowercase (matching is case-insensitive).

## Integration

This module is designed to be integrated into the backend message processing pipeline:

1. Message received
2. Moderation check passes
3. Call `extract_tags(message.content)`
4. Store tags in message document
5. Use tags for sentiment analysis and aggregation

## Notes

- **Deterministic**: Same input always produces same output
- **Explainable**: Can see exactly which keywords matched
- **Fast**: No external API calls or model inference
- **Maintainable**: Easy to add/modify keywords in config
