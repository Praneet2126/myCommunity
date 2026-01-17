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

4. The services are initialized at startup, so first request may take longer.
