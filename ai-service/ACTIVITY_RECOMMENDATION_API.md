# Activity Recommendation API

This document describes the Activity Recommendation API endpoints that provide AI-powered activity recommendations for Goa based on chat conversations.

## Overview

The Activity Recommendation system analyzes chat messages to recommend relevant activities and places in Goa. It features:
- **Semantic Search**: Uses sentence transformers to understand intent beyond keywords
- **Smart Recommendations**: Triggered every 7 messages in a conversation
- **Activity Cart**: Users can save activities to a cart
- **AI Itinerary Generation**: Automatically creates day-by-day schedules with timing and travel considerations

## Base URL

```
http://localhost:8001/api/v1
```

## Endpoints

### 1. Process Chat Message

Analyzes a chat message and returns activity recommendations when the threshold (7 messages) is reached.

**Endpoint:** `POST /activities/message`

**Request Body:**
```json
{
  "chat_id": "city_goa_123",
  "user": "john_doe",
  "message": "I want to visit beaches and try water sports"
}
```

**Response:**
```json
{
  "message_count": 7,
  "trigger_rec": true,
  "recommendations": [
    {
      "name": "Baga Beach",
      "duration": "2-3 hours",
      "score": 0.85,
      "category": "Beach",
      "region": "North",
      "lat": 15.5559,
      "lon": 73.7516,
      "best_time": "Morning"
    },
    {
      "name": "Calangute Beach",
      "duration": "2-3 hours",
      "score": 0.82,
      "category": "Beach",
      "region": "North",
      "lat": 15.5463,
      "lon": 73.7538,
      "best_time": "Morning"
    }
  ]
}
```

**Postman Setup:**
- Method: POST
- URL: `http://localhost:8001/api/v1/activities/message`
- Headers: `Content-Type: application/json`
- Body (raw JSON): Use the request body above

---

### 2. Add Activity to Cart

Adds a recommended activity to the cart for trip planning.

**Endpoint:** `POST /activities/cart/add`

**Request Body:**
```json
{
  "chat_id": "city_goa_123",
  "user": "john_doe",
  "place_name": "Baga Beach"
}
```

**Response:**
```json
{
  "status": "success",
  "cart": {
    "items": [
      {
        "place_name": "Baga Beach",
        "added_by": "john_doe",
        "count": 1
      }
    ],
    "num_days": 3,
    "num_people": 2
  }
}
```

**Postman Setup:**
- Method: POST
- URL: `http://localhost:8001/api/v1/activities/cart/add`
- Headers: `Content-Type: application/json`
- Body (raw JSON): Use the request body above

---

### 3. Get Cart

Retrieves the current cart for a specific chat.

**Endpoint:** `GET /activities/cart/{chat_id}`

**Example:** `GET /activities/cart/city_goa_123`

**Response:**
```json
{
  "items": [
    {
      "place_name": "Baga Beach",
      "added_by": "john_doe",
      "count": 1
    },
    {
      "place_name": "Fort Aguada",
      "added_by": "jane_smith",
      "count": 1
    }
  ],
  "num_days": 3,
  "num_people": 2
}
```

**Postman Setup:**
- Method: GET
- URL: `http://localhost:8001/api/v1/activities/cart/city_goa_123`
- No body required

---

### 4. Update Cart Settings

Updates the number of days and people for the trip.

**Endpoint:** `POST /activities/cart/update`

**Request Body:**
```json
{
  "chat_id": "city_goa_123",
  "num_days": 5,
  "num_people": 4
}
```

**Response:**
```json
{
  "status": "success"
}
```

**Postman Setup:**
- Method: POST
- URL: `http://localhost:8001/api/v1/activities/cart/update`
- Headers: `Content-Type: application/json`
- Body (raw JSON): Use the request body above

---

### 5. Generate Itinerary

Generates a complete day-by-day itinerary from the activities in the cart. Uses AI (LLM) first, falls back to deterministic scheduling if AI fails.

**Endpoint:** `POST /activities/itinerary/generate?chat_id={chat_id}`

**Example:** `POST /activities/itinerary/generate?chat_id=city_goa_123`

**Response:**
```json
{
  "chat_id": "city_goa_123",
  "num_people": 4,
  "days": [
    {
      "day": 1,
      "total_duration_mins": 300,
      "activities": [
        {
          "name": "Baga Beach",
          "duration": "2-3 hours",
          "category": "Beach",
          "region": "North",
          "start_time": "08:00 AM",
          "end_time": "10:30 AM",
          "travel_time_from_prev": "0 mins",
          "best_time": "Morning",
          "lat": 15.5559,
          "lon": 73.7516,
          "score": 0.0
        },
        {
          "name": "Fort Aguada",
          "duration": "1-2 hours",
          "category": "Historical",
          "region": "North",
          "start_time": "11:15 AM",
          "end_time": "12:45 PM",
          "travel_time_from_prev": "45 mins",
          "best_time": "Morning",
          "lat": 15.4909,
          "lon": 73.7735,
          "score": 0.0
        }
      ]
    },
    {
      "day": 2,
      "total_duration_mins": 240,
      "activities": [
        {
          "name": "Dudhsagar Falls",
          "duration": "3-4 hours",
          "category": "Nature",
          "region": "South",
          "start_time": "08:00 AM",
          "end_time": "12:00 PM",
          "travel_time_from_prev": "0 mins",
          "best_time": "Morning",
          "lat": 15.3144,
          "lon": 74.3144,
          "score": 0.0
        }
      ]
    }
  ]
}
```

**Postman Setup:**
- Method: POST
- URL: `http://localhost:8001/api/v1/activities/itinerary/generate?chat_id=city_goa_123`
- No body required

---

## Testing Workflow

Here's a complete testing workflow you can follow in Postman:

### Step 1: Send Chat Messages

Send several messages to build up conversation context:

```bash
# Message 1
POST /activities/message
{
  "chat_id": "test_goa_123",
  "user": "alice",
  "message": "I want to visit some beaches"
}

# Message 2
POST /activities/message
{
  "chat_id": "test_goa_123",
  "user": "bob",
  "message": "Yeah and some historical forts too"
}

# Continue until message 7 to trigger recommendations...
# Message 7
POST /activities/message
{
  "chat_id": "test_goa_123",
  "user": "alice",
  "message": "Maybe some water sports as well"
}
```

After the 7th message, you'll get recommendations!

### Step 2: Add Activities to Cart

```bash
POST /activities/cart/add
{
  "chat_id": "test_goa_123",
  "user": "alice",
  "place_name": "Baga Beach"
}

POST /activities/cart/add
{
  "chat_id": "test_goa_123",
  "user": "bob",
  "place_name": "Fort Aguada"
}
```

### Step 3: Check Cart

```bash
GET /activities/cart/test_goa_123
```

### Step 4: Update Trip Settings

```bash
POST /activities/cart/update
{
  "chat_id": "test_goa_123",
  "num_days": 3,
  "num_people": 2
}
```

### Step 5: Generate Itinerary

```bash
POST /activities/itinerary/generate?chat_id=test_goa_123
```

---

## Error Responses

### Cart Full (400)
```json
{
  "detail": "Cart is full (max 10 items)"
}
```

### Place Not Found (400)
```json
{
  "detail": "Place not found"
}
```

### Empty Cart (400)
```json
{
  "detail": "Cart is empty"
}
```

### Server Error (500)
```json
{
  "detail": "Error processing message: <error details>"
}
```

---

## Features & Implementation Details

### Semantic Search
- Uses `sentence-transformers` (`all-MiniLM-L6-v2`) for understanding user intent
- Searches across 100+ Goa activities with descriptions
- Returns top 5 most relevant activities with similarity scores

### Smart Triggering
- Recommendations triggered every 7 messages
- Maintains message buffer to analyze recent conversation context
- Excludes already-added items from new recommendations

### Cart Management
- Maximum 10 activities per cart
- Tracks who added each activity
- Supports multiple counts of the same activity
- Per-chat isolation (different chats have separate carts)

### Itinerary Generation
- **AI-Powered (Primary)**: Uses Qwen 2.5 0.5B Instruct model for natural scheduling
- **Deterministic (Fallback)**: Rule-based scheduler if AI fails
- Considers:
  - Regional clustering (North/South/Central Goa)
  - Best time to visit (morning/evening/night)
  - Travel time between activities (45 mins default)
  - Maximum 6 hours of activities per day
  - Sequential, non-overlapping time slots

---

## Notes for Frontend Integration

1. **Chat Integration**: Call `/activities/message` on every chat message sent
2. **Show Recommendations**: When `trigger_rec` is `true`, display the recommendations to users
3. **Add to Cart**: Users can click to add recommended activities
4. **Cart Badge**: Show cart item count in UI
5. **Itinerary View**: Display the generated itinerary in a timeline/calendar view

---

## Dependencies

The following packages are required (already in `requirements.txt`):
- `sentence-transformers>=2.7.0` - For semantic search
- `transformers>=4.30.0` - For LLM-based itinerary generation
- `torch>=2.0.0` - For model inference
- `accelerate>=0.24.1` - For model optimization

---

## Performance Notes

- **First Request**: May take 10-30 seconds as models are loaded (lazy initialization)
- **Subsequent Requests**: Fast (<1 second for search, 2-5 seconds for itinerary generation)
- **Memory Usage**: ~1-2GB for models in memory
- **Model Storage**: Models cached in `~/.cache/huggingface/`

---

## Support

For issues or questions, refer to:
- Main README: `/ai-service/README.md`
- Original implementation: `/activities rec from chat/main.py`
