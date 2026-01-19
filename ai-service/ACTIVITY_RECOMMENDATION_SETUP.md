# Activity Recommendation Feature - Setup Complete! 🎉

## What Was Done

I've successfully integrated the Activity Recommendation AI feature into your `ai-service`. This feature provides intelligent activity recommendations for Goa based on chat conversations.

### Files Created/Modified:

1. **`services/activity_recommendation_service.py`** ✨ NEW
   - Complete service implementation with semantic search
   - Activity cart management
   - AI-powered itinerary generation using Qwen 2.5 LLM
   - Deterministic fallback scheduler

2. **`main.py`** ✏️ UPDATED
   - Added 5 new API endpoints for activity recommendations
   - Integrated with existing service architecture
   - Added request/response models (Pydantic)

3. **`requirements.txt`** ✏️ UPDATED
   - Added `sentence-transformers>=2.7.0`
   - Added `accelerate>=0.24.1`

4. **`ACTIVITY_RECOMMENDATION_API.md`** ✨ NEW
   - Complete API documentation
   - Postman examples
   - Testing workflow

5. **`API_ENDPOINTS.md`** ✏️ UPDATED
   - Added section 7: Activity Recommendations
   - Quick reference for all 5 new endpoints

6. **`test_activity_endpoints.py`** ✨ NEW
   - Automated test script
   - Verifies all endpoints work correctly

### Data File:
- ✅ `data/goa_activities.json` - Already present (100+ activities)

---

## Quick Start Guide

### Step 1: Install Dependencies

```bash
cd ai-service
pip install -r requirements.txt
```

This will install the new dependencies:
- `sentence-transformers` (for semantic search)
- `accelerate` (for model optimization)

### Step 2: Start the Service

```bash
python main.py
```

The service will start on `http://localhost:8001`

**Note:** The first request may take 10-30 seconds as models are downloaded and loaded.

### Step 3: Test the Endpoints

#### Option A: Automated Test Script (Recommended)

```bash
python test_activity_endpoints.py
```

This will run through all endpoints and verify they work correctly.

#### Option B: Manual Testing with Postman

Import these requests into Postman:

**1. Process Chat Messages (Trigger Recommendations)**
```
POST http://localhost:8001/api/v1/activities/message
Content-Type: application/json

{
  "chat_id": "test_goa_123",
  "user": "alice",
  "message": "I want to visit beaches and water sports"
}
```

Send 7 messages to trigger recommendations!

**2. Add to Cart**
```
POST http://localhost:8001/api/v1/activities/cart/add
Content-Type: application/json

{
  "chat_id": "test_goa_123",
  "user": "alice",
  "place_name": "Baga Beach"
}
```

**3. Get Cart**
```
GET http://localhost:8001/api/v1/activities/cart/test_goa_123
```

**4. Update Settings**
```
POST http://localhost:8001/api/v1/activities/cart/update
Content-Type: application/json

{
  "chat_id": "test_goa_123",
  "num_days": 3,
  "num_people": 2
}
```

**5. Generate Itinerary**
```
POST http://localhost:8001/api/v1/activities/itinerary/generate?chat_id=test_goa_123
```

---

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/activities/message` | POST | Process chat message, get recommendations |
| `/api/v1/activities/cart/add` | POST | Add activity to cart |
| `/api/v1/activities/cart/{chat_id}` | GET | Get current cart |
| `/api/v1/activities/cart/update` | POST | Update trip settings |
| `/api/v1/activities/itinerary/generate` | POST | Generate day-by-day itinerary |

---

## How It Works

### 1. **Semantic Search & Recommendations**
- Uses `sentence-transformers` to understand user intent
- Analyzes every 7 messages in a conversation
- Returns top 5 relevant activities from 100+ Goa locations
- Excludes already-added items

### 2. **Activity Cart**
- Users can add recommended activities
- Supports multiple users in same chat
- Maximum 10 activities per cart
- Tracks who added what

### 3. **AI Itinerary Generation**
- **Primary:** Uses Qwen 2.5 0.5B Instruct model
- **Fallback:** Deterministic rule-based scheduler
- Considers:
  - Regional clustering (North/South/Central Goa)
  - Best time to visit (morning/evening/night)
  - Travel time between locations (45 mins)
  - Maximum 6 hours of activities per day
  - Sequential, non-overlapping time slots

---

## Performance Notes

- **First Request:** 10-30 seconds (model loading)
- **Subsequent Requests:** <1 second (search), 2-5 seconds (itinerary)
- **Memory Usage:** ~1-2GB for models
- **Model Storage:** `~/.cache/huggingface/` (auto-downloaded)

---

## Frontend Integration Guide

Here's how to integrate this into your React frontend:

### 1. Create an API Service File

```javascript
// frontend/src/services/activityService.js

const API_BASE = 'http://localhost:8001/api/v1';

export const activityService = {
  // Process a chat message
  async processMessage(chatId, user, message) {
    const response = await fetch(`${API_BASE}/activities/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, user, message })
    });
    return response.json();
  },

  // Add activity to cart
  async addToCart(chatId, user, placeName) {
    const response = await fetch(`${API_BASE}/activities/cart/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, user, place_name: placeName })
    });
    return response.json();
  },

  // Get cart
  async getCart(chatId) {
    const response = await fetch(`${API_BASE}/activities/cart/${chatId}`);
    return response.json();
  },

  // Update settings
  async updateSettings(chatId, numDays, numPeople) {
    const response = await fetch(`${API_BASE}/activities/cart/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, num_days: numDays, num_people: numPeople })
    });
    return response.json();
  },

  // Generate itinerary
  async generateItinerary(chatId) {
    const response = await fetch(
      `${API_BASE}/activities/itinerary/generate?chat_id=${chatId}`,
      { method: 'POST' }
    );
    return response.json();
  }
};
```

### 2. Integration in Chat Component

```javascript
// In your CityPage.jsx or chat component

import { activityService } from '../services/activityService';
import { useState, useEffect } from 'react';

function CityChat() {
  const [recommendations, setRecommendations] = useState([]);
  const [showRecommendations, setShowRecommendations] = useState(false);

  // When user sends a message
  const handleSendMessage = async (message) => {
    // ... existing message sending logic ...
    
    // Process message for activity recommendations
    try {
      const result = await activityService.processMessage(
        cityId,  // or chat_id
        currentUser.username,
        message
      );
      
      if (result.trigger_rec && result.recommendations.length > 0) {
        setRecommendations(result.recommendations);
        setShowRecommendations(true);
      }
    } catch (error) {
      console.error('Activity recommendation error:', error);
    }
  };

  // Render recommendations
  return (
    <div>
      {/* Your existing chat UI */}
      
      {showRecommendations && (
        <div className="recommendations-panel">
          <h3>🎯 Recommended Activities</h3>
          {recommendations.map(rec => (
            <div key={rec.name} className="recommendation-card">
              <h4>{rec.name}</h4>
              <p>{rec.category} • {rec.region} Goa</p>
              <p>Duration: {rec.duration}</p>
              <p>Match: {(rec.score * 100).toFixed(0)}%</p>
              <button onClick={() => handleAddToCart(rec.name)}>
                Add to Trip
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 3. Cart & Itinerary Component

```javascript
function TripPlanner({ chatId }) {
  const [cart, setCart] = useState(null);
  const [itinerary, setItinerary] = useState(null);

  useEffect(() => {
    loadCart();
  }, [chatId]);

  const loadCart = async () => {
    const data = await activityService.getCart(chatId);
    setCart(data);
  };

  const generateItinerary = async () => {
    const data = await activityService.generateItinerary(chatId);
    setItinerary(data);
  };

  return (
    <div>
      <h2>Trip Cart ({cart?.items?.length || 0} activities)</h2>
      
      {/* Display cart items */}
      {cart?.items.map(item => (
        <div key={item.place_name}>
          {item.place_name} (x{item.count})
        </div>
      ))}
      
      <button onClick={generateItinerary}>
        Generate Itinerary
      </button>
      
      {/* Display itinerary */}
      {itinerary && (
        <div>
          {itinerary.days.map(day => (
            <div key={day.day}>
              <h3>Day {day.day}</h3>
              {day.activities.map((act, i) => (
                <div key={i}>
                  <strong>{act.start_time} - {act.end_time}</strong>
                  <p>{act.name}</p>
                  <small>{act.category} • {act.region}</small>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Troubleshooting

### Models Taking Too Long to Download?
- First run downloads ~400MB of models
- Ensure stable internet connection
- Models cached in `~/.cache/huggingface/`

### Out of Memory Error?
- The service uses ~1-2GB RAM for models
- Use CPU inference (already configured)
- Close other memory-intensive applications

### Port 8001 Already in Use?
Change the port in `config.py` or set environment variable:
```bash
export PORT=8002
python main.py
```

### Connection Refused from Frontend?
Check CORS settings in `config.py`:
```python
FRONTEND_URL = "http://localhost:5173"  # Update if needed
```

---

## Next Steps

1. ✅ **Test with Postman** - Verify all endpoints work
2. ✅ **Run automated tests** - `python test_activity_endpoints.py`
3. 🔧 **Integrate with frontend** - Use the code examples above
4. 🎨 **Design UI** - Create components for recommendations and itinerary
5. 🚀 **Deploy** - Consider containerizing with Docker

---

## Documentation Files

- **`ACTIVITY_RECOMMENDATION_API.md`** - Detailed API reference
- **`API_ENDPOINTS.md`** - Quick endpoint reference (section 7)
- **Original implementation:** `../activities rec from chat/main.py`

---

## Support

For questions or issues:
1. Check the API documentation files
2. Review the test script for examples
3. Check terminal logs for error details

Happy coding! 🚀
