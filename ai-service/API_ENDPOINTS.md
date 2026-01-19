# AI Service API Endpoints

This document describes the available endpoints for testing via Postman or any HTTP client.

## Base URL
```
http://localhost:8001
```

## Endpoints

### 1. Health Check
**GET** `/health`

Check if the service is running.

**Response:**
```json
{
  "status": "healthy"
}
```

---

### 2. Image Search - Find Similar Hotels
**POST** `/api/v1/hotels/similar`

Find similar hotels based on an uploaded image using visual search (CLIP + color/texture matching).

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: Form data with key `image` and value as file upload

**Postman Setup:**
1. Select POST method
2. Go to Body tab
3. Select `form-data`
4. Add key `image` with type `File`
5. Select an image file to upload

**Response:**
```json
{
  "similar_hotels": [
    {
      "hotel_id": "1",
      "name": "Hotel Name",
      "similarity_score": 0.8924,
      "stars": 4,
      "price": 15000,
      "description": "Hotel description",
      "best_match_image_path": "/path/to/matching/image.jpg",
      "score_breakdown": {
        "ai_semantic_score": 0.85,
        "color_texture_score": 0.92
      }
    }
  ],
  "total_results": 3
}
```

**Example cURL:**
```bash
curl -X POST "http://localhost:8001/api/v1/hotels/similar" \
  -F "image=@/path/to/your/image.jpg"
```

---

### 3. Hotel Recommendations from Chat
**POST** `/api/v1/hotels/recommend`

Get hotel recommendations based on chat messages. Extracts preferences (budget, amenities, visual descriptors) from chat and returns personalized recommendations.

**Request:**
- Method: `POST`
- Content-Type: `application/json`
- Body:

```json
{
  "messages": [
    {
      "user_id": "u1",
      "text": "I want wooden flooring and a beach view."
    },
    {
      "user_id": "u2",
      "text": "I saw one for 40k but that is too costly."
    },
    {
      "user_id": "u3",
      "text": "Yeah, 20k should be the limit."
    }
  ],
  "limit": 5
}
```

**Postman Setup:**
1. Select POST method
2. Go to Body tab
3. Select `raw` and choose `JSON`
4. Paste the JSON request body above

**Response:**
```json
{
  "extracted_preferences": {
    "area": null,
    "max_price": 20000.0,
    "min_price": null,
    "amenities": [],
    "room_types": [],
    "visual_descriptors": ["beach", "sea", "ocean", "waterfront", "sand", "beach view", "wooden flooring"],
    "other_requirements": []
  },
  "recommendations": [
    {
      "hotel": {
        "name": "Hotel Name",
        "hotel_code": "1000000073",
        "amenities": ["Swimming Pool", "Spa"],
        "room_types": ["Deluxe Room"],
        "description": "Hotel description"
      },
      "explanation": "I recommend Hotel Name because its images confirm your requested vibe and it has Visual Vibe Match, Swimming Pool.",
      "matched_preferences": ["Visual Vibe Match", "Swimming Pool"]
    }
  ],
  "is_ready": true,
  "readiness_score": 0.7
}
```

**Example cURL:**
```bash
curl -X POST "http://localhost:8001/api/v1/hotels/recommend" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"user_id": "u1", "text": "I want wooden flooring and a beach view."},
      {"user_id": "u2", "text": "I saw one for 40k but that is too costly."},
      {"user_id": "u3", "text": "Yeah, 20k should be the limit."}
    ],
    "limit": 5
  }'
```

---

### 4. Chat Summarization
**POST** `/api/v1/chat/summarize-messages`

Summarize a list of chat messages. Requires at least 15 messages and 200 words to generate a summary.

**Request:**
- Method: `POST`
- Content-Type: `application/json`
- Body:

```json
{
  "messages": [
    "Message 1 text",
    "Message 2 text",
    "Message 3 text",
    ...
  ]
}
```

**Response:**
```json
{
  "summary": "Combined summary text...",
  "key_points": [
    "Key point 1",
    "Key point 2",
    "Key point 3"
  ],
  "message_count": 25,
  "date_range": null
}
```

**Example cURL:**
```bash
curl -X POST "http://localhost:8001/api/v1/chat/summarize-messages" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      "User1: Planning a trip to Barcelona",
      "User2: Looking for hotels near the beach",
      "User3: Budget is around 20k per night",
      ...
    ]
  }'
```

**Note:** The service requires:
- Minimum 15 messages
- Minimum 200 words total
If thresholds are not met, returns a message indicating insufficient content.

---

### 5. Content Moderation
**POST** `/api/v1/moderation/check`

Check if content is safe, spam, or contains abusive language. Uses rule-based checks and AI-based toxicity detection.

**Request:**
- Method: `POST`
- Content-Type: `application/json`
- Body:

```json
{
  "content": "Message text to moderate",
  "user_id": "optional_user_id",
  "message_id": "optional_message_id"
}
```

**Response:**
```json
{
  "is_safe": true,
  "is_spam": false,
  "is_abusive": false,
  "confidence_score": 0.95,
  "flagged_categories": [],
  "suggested_action": null,
  "reason": null
}
```

**Example cURL:**
```bash
curl -X POST "http://localhost:8001/api/v1/moderation/check" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "This is a test message",
    "user_id": "user123"
  }'
```

---

### 6. Batch Content Moderation
**POST** `/api/v1/moderation/batch`

Check multiple content items in batch.

**Request:**
- Method: `POST`
- Content-Type: `application/json`
- Body: Array of moderation requests

```json
[
  {
    "content": "Message 1",
    "user_id": "user1"
  },
  {
    "content": "Message 2",
    "user_id": "user2"
  }
]
```

**Response:** Array of `ContentModerationResponse` objects

---

### 7. Sentiment Analysis (Single Message)
**POST** `/api/v1/sentiment/analyze`

Analyze sentiment and extract tags from a single message.

**Request:**
- Method: `POST`
- Content-Type: `application/json`
- Body:

```json
{
  "message_text": "Baga is crowded but great for families"
}
```

**Response:**
```json
{
  "message_sentiment": {
    "sentiment": "positive",
    "confidence": 0.85,
    "raw_scores": {
      "positive": 0.85,
      "neutral": 0.10,
      "negative": 0.05
    }
  },
  "tags": {
    "places": ["baga beach"],
    "hotels": [],
    "themes": ["crowded", "family"]
  },
  "tag_sentiments": [
    {
      "tag": "baga beach",
      "tag_type": "place",
      "sentiment": "positive",
      "confidence": 0.85
    },
    {
      "tag": "crowded",
      "tag_type": "theme",
      "sentiment": "positive",
      "confidence": 0.85
    }
  ],
  "has_tags": true
}
```

**Example cURL:**
```bash
curl -X POST "http://localhost:8001/api/v1/sentiment/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "message_text": "Baga is crowded but great for families"
  }'
```

---

### 8. Sentiment Analysis (Batch)
**POST** `/api/v1/sentiment/analyze-batch`

Analyze sentiment for multiple messages in batch.

**Request:**
- Method: `POST`
- Content-Type: `application/json`
- Body:

```json
{
  "messages": [
    "Message 1 text",
    "Message 2 text",
    "Message 3 text"
  ]
}
```

**Response:** Array of `SentimentAnalysisResponse` objects

---

### 9. Sentiment Aggregation
**POST** `/api/v1/sentiment/aggregate`

Aggregate sentiment by tags from message records. Useful for generating sentiment statistics by places, hotels, or themes.

**Request:**
- Method: `POST`
- Content-Type: `application/json`
- Body:

```json
{
  "messages": [
    {
      "sentiment": "positive",
      "tags": {
        "places": ["goa"],
        "hotels": [],
        "themes": ["beach"]
      }
    },
    {
      "sentiment": "negative",
      "tags": {
        "places": ["goa"],
        "hotels": [],
        "themes": []
      }
    }
  ]
}
```

**Response:**
```json
{
  "places": [
    {
      "entity_type": "place",
      "entity_name": "goa",
      "total_messages": 2,
      "sentiment_distribution": {
        "positive": 1,
        "neutral": 0,
        "negative": 1
      },
      "sentiment_score": 0.0,
      "sentiment_label": "Mixed"
    }
  ],
  "hotels": [],
  "themes": [
    {
      "entity_type": "theme",
      "entity_name": "beach",
      "total_messages": 1,
      "sentiment_distribution": {
        "positive": 1,
        "neutral": 0,
        "negative": 0
      },
      "sentiment_score": 1.0,
      "sentiment_label": "Mostly Positive"
    }
  ]
}
```

**Example cURL:**
```bash
curl -X POST "http://localhost:8001/api/v1/sentiment/aggregate" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "sentiment": "positive",
        "tags": {"places": ["goa"], "hotels": [], "themes": ["beach"]}
      }
    ]
  }'
```

---

## Testing Checklist

### Image Search Endpoint
- [ ] Upload a hotel image
- [ ] Verify response contains similar hotels
- [ ] Check similarity scores are between 0 and 1
- [ ] Verify best_match_image_path is included
- [ ] Check score_breakdown has ai_semantic_score and color_texture_score

### Hotel Recommendations Endpoint
- [ ] Send chat messages with hotel preferences
- [ ] Verify extracted_preferences are correctly parsed
- [ ] Check that max_price is extracted (should ignore rejected prices like "40k is too costly")
- [ ] Verify visual_descriptors are extracted
- [ ] Check recommendations list is returned
- [ ] Verify is_ready and readiness_score are included

### Chat Summarization Endpoint
- [ ] Send at least 15 messages with 200+ words
- [ ] Verify summary is generated
- [ ] Check key_points are returned (max 5)
- [ ] Test with insufficient messages (should return appropriate message)
- [ ] Verify message_count and word_count are accurate

### Content Moderation Endpoint
- [ ] Test with normal message (should allow)
- [ ] Test with spam content (should flag/block)
- [ ] Test with toxic content (should flag/block)
- [ ] Verify confidence_score is between 0 and 1
- [ ] Check flagged_categories are populated when violations detected
- [ ] Test batch endpoint with multiple messages

### Sentiment Analysis Endpoint
- [ ] Analyze single message with sentiment
- [ ] Verify tags are extracted (places, hotels, themes)
- [ ] Check tag_sentiments are created for each tag
- [ ] Test batch analysis
- [ ] Test aggregation with multiple messages
- [ ] Verify sentiment_score and sentiment_label in aggregation

---

## Notes

1. **Image Search** uses:
   - CLIP model (ViT-L/14@336px) for semantic matching (70% weight)
   - Color and texture signatures for exact visual matching (30% weight)
   - Multi-scale analysis for better accuracy

2. **Hotel Recommendations** extracts:
   - Budget constraints (with negation detection)
   - Visual preferences (beach view, wooden flooring, etc.)
   - Amenities (pool, spa, etc.)
   - Area preferences
   - Room type preferences

3. Both services require the data files to be present:
   - Image Search: `hotel_features_ai.npy`, `hotel_features_color.npy`, `mapping.pkl`, `hotels.db`
   - Hotel Recommendations: `hotel_data.json`, `hotel_features_ai.npy`, `mapping.pkl`

4. **Chat Summarization** requires:
   - Hugging Face API key (set `HF_API_KEY` or `HUGGINGFACE_API_KEY` environment variable)
   - Minimum 15 messages and 200 words to generate summary
   - Uses `facebook/bart-large-cnn` model via Hugging Face Inference API

5. **Content Moderation** requires:
   - Node.js installed and available in PATH
   - Hugging Face API key for AI-based toxicity detection (optional, rule-based checks work without it)
   - Moderation module located at `moderation/index.js`

6. **Sentiment Analysis** requires:
   - PyTorch and Transformers libraries
   - Model downloads automatically on first use (requires internet)
   - Uses `cardiffnlp/twitter-roberta-base-sentiment` model

7. The services are initialized on first request, so first request may take longer (especially sentiment analysis which downloads the model).
