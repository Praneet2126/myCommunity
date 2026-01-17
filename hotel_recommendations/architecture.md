# Hotel Recommendation Architecture

## Overview
An AI-powered recommendation engine that extracts user intent, price negotiations, and visual preferences from community chat history. It provides personalized hotel suggestions with natural language reasoning.

## Components
1. **Chat Analyzer**: An NLP module that handles:
   - **Preference Extraction**: Identifies areas, amenities, and room types.
   - **Price Refinement**: Scans chat in reverse to find the latest budget consensus (e.g., "40k is too much, 20k instead").
   - **Negation Detection**: Filters out disliked features.
2. **Visual Intelligence**: Uses CLIP embeddings to match chat keywords like "wooden flooring" or "beach view" against hotel images.
3. **Recommendation Service**: A scoring engine that ranks hotels based on metadata match and visual similarity.
4. **API Layer**: FastAPI providing high-performance REST endpoints.

## Tech Stack
- **FastAPI**
- **CLIP (OpenAI)**
- **Pydantic** (Data validation)
- **Singleton Pattern** (for memory-efficient data loading)

## For Backend Developers
### Input
- **Endpoint**: `POST /recommend`
- **Payload**:
```json
{
  "messages": [
    {"user_id": "u1", "text": "I want a hotel with a beach view and wooden flooring."},
    {"user_id": "u2", "text": "20k should be the limit."}
  ]
}
```

### Output
- **Format**: JSON with extracted preferences and ranked recommendations.
- **Fields**:
  - `extracted_preferences`: Summary of what the AI found in the chat.
  - `recommendations`: List of objects containing `hotel` data, `explanation` (AI Reasoning), and `matched_preferences`.

## For Frontend Developers
- **Display**: Use the `explanation` field to show the user "Why" the hotel is being recommended. It provides human-readable context like *"I would recommend X because it is located in Y and its images confirm wooden flooring."*

## Files
- `main.py`: FastAPI entry point.
- `services.py`: Core logic for chat analysis and CLIP matching.
- `models.py`: Pydantic data models.
- `hotel_data.json`: Consolidated hotel metadata.
