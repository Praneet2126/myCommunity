# Dynamic Textual Descriptor Extraction

## Overview

The hotel recommendation system now extracts **dynamic textual descriptors** from chat messages without hardcoding keywords. These descriptors (like "green bed", "wooden flooring", "modern decor") are automatically extracted and matched against hotel images using CLIP embeddings.

## How It Works

### 1. Dynamic Descriptor Extraction

The `ChatAnalyzer.extract_dynamic_descriptors()` method uses pattern matching to identify descriptive phrases:

#### Pattern 1: Adjective + Noun Combinations
- Extracts phrases like "green bed", "wooden flooring", "modern decor"
- Uses a predefined list of visual adjectives and nouns
- Examples: "blue pool", "marble floor", "luxury room"

#### Pattern 2: "with X" / "that has X" Patterns
- Extracts from phrases like:
  - "room with green bed"
  - "hotel that has wooden flooring"
  - "place having modern decor"
  - "property featuring infinity pool"

#### Pattern 3: Flexible Adjective-Noun Matching
- Catches any combination of visual adjectives and nouns
- Examples: "modern room", "luxury hotel", "beach view"

#### Pattern 4: Noun Phrase Patterns
- Extracts phrases ending with:
  - "X view" (beach view, mountain view)
  - "X style" (modern style, traditional style)
  - "X design" (minimalist design, luxury design)
  - "X decor" (modern decor, vintage decor)
  - "X flooring" (wooden flooring, marble flooring)

### 2. CLIP-Based Image Matching

Once descriptors are extracted, they are:
1. **Encoded using CLIP**: Each descriptor is converted to a text embedding
2. **Matched against hotel images**: Compared with pre-computed image embeddings
3. **Scored**: Similarity scores indicate how well each descriptor matches each hotel's images
4. **Ranked**: Hotels are ranked based on the best matching descriptors

### 3. Enhanced Recommendations

The recommendation system now:
- Tracks which specific descriptors matched for each hotel
- Provides explanations mentioning the matched descriptors
- Uses CLIP similarity scores to rank hotels

## Example Usage

### Input Chat Messages:
```json
{
  "messages": [
    {"user_id": "u1", "text": "I want a hotel with a green bed and wooden flooring."},
    {"user_id": "u2", "text": "Looking for modern decor and a blue pool."},
    {"user_id": "u3", "text": "Budget should be around 20k."}
  ]
}
```

### Extracted Descriptors:
- "green bed"
- "wooden flooring"
- "modern decor"
- "blue pool"

### Matching Process:
1. Each descriptor is encoded with CLIP
2. Compared against all hotel image embeddings
3. Hotels with images matching "green bed", "wooden flooring", etc. get higher scores
4. Top matches are returned with explanations

### Output Explanation:
```
"I recommend Hotel XYZ because its images match your preferences: green bed, wooden flooring, modern decor."
```

## Key Features

✅ **No Hardcoding**: Descriptors are extracted dynamically from chat  
✅ **CLIP Matching**: Uses state-of-the-art vision-language model for accurate matching  
✅ **Specific Explanations**: Shows exactly which descriptors matched  
✅ **Flexible Patterns**: Handles various ways users describe visual preferences  

## Supported Descriptor Types

### Colors:
- green, blue, red, white, black, brown, yellow, pink, purple, orange

### Materials:
- wooden, marble, glass, metal, stone, brick, concrete

### Styles:
- modern, traditional, vintage, contemporary, classic, luxury, premium

### Sizes:
- large, small, big, tiny, huge, spacious, compact

### Lighting:
- bright, dark, light, dim, colorful, vibrant

### Textures:
- soft, hard, smooth, rough, shiny, matte, glossy

### Shapes:
- round, square, rectangular, circular

### Features:
- infinity, private, shared, outdoor, indoor

### Room Features:
- bed, bedroom, room, flooring, floor, walls, decor, furniture, pool, spa, bathroom, view, balcony, etc.

## Technical Details

### CLIP Model
- Model: ViT-L/14@336px (Vision Transformer Large)
- Encodes both text descriptors and hotel images into the same embedding space
- Enables semantic matching between text and images

### Similarity Threshold
- Minimum CLIP similarity score: 0.25
- Only descriptors with scores above threshold are considered matches
- Higher scores indicate better matches

### Scoring
- Visual match score: `similarity_score * 15`
- Top 3 matched descriptors are included in explanations
- Hotels ranked by combined score (visual + amenities + price match)

## Benefits

1. **User-Friendly**: Users can describe preferences naturally without knowing specific keywords
2. **Accurate Matching**: CLIP understands semantic meaning, not just exact matches
3. **Extensible**: Easy to add new adjectives/nouns to the vocabulary
4. **Transparent**: Users see exactly which features matched

## Future Enhancements

- Use NLP libraries (spaCy) for more sophisticated phrase extraction
- Learn descriptor patterns from user feedback
- Support multi-word descriptors (e.g., "dark wooden flooring")
- Context-aware extraction (understanding user intent better)
