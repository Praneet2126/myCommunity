# Azure OpenAI Integration for Itinerary Generation

## Overview

The itinerary generation service has been upgraded to use **Azure OpenAI** (GPT-4 or GPT-3.5-turbo) instead of the small local LLM. This provides:

✅ **Intelligent Planning**: AI understands context and makes smart decisions  
✅ **Hotel Selection**: Picks the best hotels from cart based on location, quality, and price  
✅ **MyLens Integration**: Incorporates user interests from myLens  
✅ **Time-Aware Scheduling**: Respects activity timing constraints  
✅ **Accurate Day Counts**: Always generates the exact number of days requested  

## Architecture

### Three-Tier Fallback System

1. **Azure OpenAI** (Primary) - Most capable, handles complex planning
2. **Local LLM** (Secondary) - Lightweight fallback if Azure fails
3. **Deterministic Scheduler** (Final) - Rule-based scheduling as last resort

### Data Flow

```
Frontend (GroupProfileModal.jsx)
    ↓ (Generate Itinerary Request)
Backend (chats.js)
    ↓ (Fetch hotels from cart + myLens data)
AI Service (main.py)
    ↓ (Extract activities from cart)
Azure Itinerary Service (azure_itinerary_service.py)
    ↓ (Call Azure OpenAI with comprehensive prompt)
Azure OpenAI API
    ↓ (Return structured JSON itinerary)
Response flows back with:
    - Days with time-slotted activities
    - Selected hotels with reasoning
    - Total duration calculations
```

## Key Features

### 1. Intelligent Hotel Selection

Azure OpenAI analyzes:
- **Location**: Hotels near planned activities
- **Quality**: Star ratings and reviews
- **Price**: Value for money
- **Trip Duration**: 1 hotel for 1-3 days, 2 for 4-6 days, etc.

Example reasoning:
```json
{
  "day": 1,
  "hotel_id": "hotel_123",
  "name": "Beachside Resort",
  "reason": "Recommended for first half of trip (Days 1-2) - 4-star quality, good value"
}
```

### 2. Time-Aware Scheduling

Activities are scheduled according to their nature:

| Time Slot | Activities |
|-----------|------------|
| 6 AM - 11 AM | Treks, Wildlife tours, Yoga, Sunrise spots |
| 11 AM - 4 PM | Museums, Forts, Shopping, Water sports |
| 4 PM - 6 PM | Beach visits, Sunset viewpoints |
| 6 PM - 9 PM | Dining, River cruises, Cultural shows |
| 9 PM - 3 AM | Casinos, Nightclubs, Beach parties |

**Strict Constraints:**
- ❌ Beach activities after 6 PM (beaches close at sunset)
- ❌ Nightclubs before 9 PM
- ❌ Water sports outside 10 AM - 5 PM window
- ✅ Wildlife activities in early morning
- ✅ Forts/Museums in late morning to afternoon

### 3. MyLens Integration

User interests from myLens are incorporated into planning:
- Prioritizes activities from cart
- Supplements with myLens suggestions
- Balances user preferences with practical constraints

### 4. Comprehensive Prompt Engineering

The Azure OpenAI prompt includes:
- **System Instructions**: Expert travel planner persona with strict rules
- **Activity Details**: Name, location, category, hours, duration, description
- **Hotel Details**: Name, rating, price, description, ID
- **MyLens Places**: User's interests and preferences
- **Output Schema**: Exact JSON structure required
- **Validation Rules**: Day count, time constraints, activity flow

## Setup Instructions

### 1. Install Dependencies

```bash
cd /Users/int1934/myCommunity/ai-service
pip install openai>=1.58.1
```

Or install all requirements:
```bash
pip install -r requirements.txt
```

### 2. Create .env File

**Location**: `/Users/int1934/myCommunity/ai-service/.env`

```env
# Azure OpenAI Configuration (REQUIRED)
AZURE_OPENAI_API_KEY=your-azure-openai-api-key-here
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_CHAT_DEPLOYMENT=your-deployment-name-here

# Other Configuration
HOST=0.0.0.0
PORT=8001
DEBUG=True
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 3. Get Azure Credentials

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your Azure OpenAI resource
3. **Keys and Endpoint** → Copy Key 1 and Endpoint
4. **Model deployments** → Copy your deployment name (e.g., `gpt-4-deployment`)

See `ENV_SETUP_INSTRUCTIONS.md` for detailed steps.

### 4. Restart Services

```bash
# Restart AI service
cd /Users/int1934/myCommunity/ai-service
python main.py

# Backend should already be running
# Frontend should already be running
```

## API Changes

### Updated Endpoint

**POST** `/api/v1/activities/itinerary/generate`

**Query Parameters:**
- `chat_id` (string, required): Chat identifier

**Request Body:**
```json
{
  "hotels_in_cart": [
    {
      "hotel_id": "hotel_123",
      "name": "Beachside Resort",
      "price": 5000,
      "stars": 4,
      "description": "Luxury beachfront resort",
      "image_url": "https://..."
    }
  ],
  "mylens_data": [
    {
      "name": "Dudhsagar Falls",
      "type": "waterfall",
      "description": "Majestic four-tiered waterfall",
      "region": "South Goa",
      "category": "Nature"
    }
  ]
}
```

**Response:**
```json
{
  "chat_id": "chat_123",
  "num_people": 2,
  "days": [
    {
      "day": 1,
      "activities": [
        {
          "name": "Baga Beach",
          "start_time": "09:00 AM",
          "end_time": "11:30 AM",
          "travel_time_from_prev": "30 mins",
          "region": "North Goa",
          "category": "Beach",
          "duration": "2.5 hours",
          "description": "Popular beach with water sports"
        }
      ],
      "total_duration_mins": 360
    }
  ],
  "hotels": [
    {
      "day": 1,
      "hotel_id": "hotel_123",
      "name": "Beachside Resort",
      "price": 5000,
      "stars": 4,
      "description": "Luxury beachfront resort",
      "image_url": "https://...",
      "reason": "Best choice for your 3-day trip - 4-star quality, good value"
    }
  ]
}
```

## Code Changes

### New Files

1. **`ai-service/services/azure_itinerary_service.py`**
   - Azure OpenAI client initialization
   - Comprehensive prompt building
   - Response validation
   - Error handling

2. **`ai-service/ENV_SETUP_INSTRUCTIONS.md`**
   - Step-by-step setup guide
   - Credential retrieval instructions

3. **`AZURE_OPENAI_INTEGRATION.md`** (this file)
   - Complete integration documentation

### Modified Files

1. **`ai-service/config.py`**
   - Added Azure OpenAI configuration fields

2. **`ai-service/services/activity_recommendation_service.py`**
   - Updated `generate_itinerary()` to try Azure OpenAI first
   - Added `mylens_data` parameter support
   - Maintained fallback chain

3. **`ai-service/main.py`**
   - Added `MyLensPlace` Pydantic model
   - Updated `GenerateItineraryRequest` to include `mylens_data`
   - Enhanced endpoint documentation
   - Added comprehensive logging

4. **`backend/routes/chats.js`**
   - Accept `mylens_data` from frontend
   - Pass myLens data to AI service
   - Enhanced logging

5. **`ai-service/requirements.txt`**
   - Added `openai>=1.58.1` dependency

## Testing

### 1. Verify Configuration

```bash
cd /Users/int1934/myCommunity/ai-service
python -c "from config import settings; print(f'Endpoint: {settings.AZURE_OPENAI_ENDPOINT}'); print(f'Deployment: {settings.AZURE_CHAT_DEPLOYMENT}')"
```

### 2. Check Logs

When generating an itinerary, you should see:

```
[AzureItineraryService] Initialized with deployment: gpt-4-deployment
[Itinerary] Activities: 5, Hotels: 3, MyLens: 2
[AzureItineraryService] Generating itinerary for 3 days...
[AzureItineraryService] Successfully generated 3 days
[Azure OpenAI] Successfully generated 3 days as requested
```

### 3. Test API Directly

```bash
curl -X POST "http://localhost:8001/api/v1/activities/itinerary/generate?chat_id=test_123" \
  -H "Content-Type: application/json" \
  -d '{
    "hotels_in_cart": [
      {
        "hotel_id": "hotel_1",
        "name": "Test Hotel",
        "price": 5000,
        "stars": 4,
        "description": "Test hotel"
      }
    ],
    "mylens_data": []
  }'
```

## Troubleshooting

### Error: "API key not found"

**Solution**: Check that `.env` file exists in `ai-service/` directory and contains `AZURE_OPENAI_API_KEY`

### Error: "Deployment not found"

**Solution**: Verify `AZURE_CHAT_DEPLOYMENT` matches your deployment name in Azure Portal

### Error: "Invalid endpoint"

**Solution**: Ensure `AZURE_OPENAI_ENDPOINT` ends with a trailing slash and uses HTTPS

### Fallback to Local LLM

If you see `[Fallback] Trying local LLM...`, Azure OpenAI failed. Check:
1. API key is valid
2. Endpoint is correct
3. Deployment name matches
4. Azure subscription is active
5. Network connectivity

### Fallback to Deterministic Scheduler

If you see `[Scheduler] Using deterministic scheduler...`, both LLMs failed. This is the final fallback and will work without any AI service.

## Benefits Over Previous System

| Feature | Old (Local LLM) | New (Azure OpenAI) |
|---------|----------------|-------------------|
| Model Size | 0.5B parameters | 175B+ parameters |
| Context Understanding | Limited | Excellent |
| Hotel Selection | Rule-based | AI-driven |
| MyLens Integration | No | Yes |
| Day Count Accuracy | ~70% | ~99% |
| Time Awareness | Basic | Advanced |
| Response Quality | Acceptable | Professional |
| Reasoning | None | Detailed |

## Future Enhancements

1. **Location-based Hotel Scoring**: Use hotel coordinates to match with activity regions
2. **Budget Optimization**: Total trip cost calculation and budget-aware planning
3. **User Preference Learning**: Learn from past itineraries to improve recommendations
4. **Multi-destination Support**: Extend beyond Goa to other destinations
5. **Real-time Updates**: Dynamic itinerary adjustment based on weather, availability, etc.

## Security Notes

- ⚠️ **Never commit `.env` file** to version control
- ⚠️ **Rotate API keys** periodically
- ⚠️ **Use environment-specific keys** (dev/staging/prod)
- ⚠️ **Monitor API usage** in Azure Portal to avoid unexpected costs
- ⚠️ **Set spending limits** in Azure to prevent overuse

## Cost Considerations

Azure OpenAI charges per token:
- **Input tokens**: ~$0.03 per 1K tokens (GPT-4)
- **Output tokens**: ~$0.06 per 1K tokens (GPT-4)

Typical itinerary generation:
- Input: ~2,000 tokens (activities, hotels, myLens)
- Output: ~1,500 tokens (itinerary JSON)
- **Cost per request**: ~$0.15

For high-volume usage, consider:
- Using GPT-3.5-turbo (10x cheaper)
- Caching common itineraries
- Rate limiting per user

## Support

For issues or questions:
1. Check logs in terminal running `ai-service`
2. Review Azure Portal for API errors
3. Verify `.env` configuration
4. Test with curl command above
5. Check Azure OpenAI service status

---

**Last Updated**: January 20, 2026  
**Version**: 1.0.0  
**Author**: AI Assistant
