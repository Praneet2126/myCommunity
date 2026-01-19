# 🚀 LLM Activity Recommendation & Itinerary Generation Workflow

## 📖 Overview

This system integrates an AI-powered activity recommendation engine with your private group chats. It analyzes chat messages, recommends activities, allows admins to curate a cart, and generates intelligent itineraries.

---

## 🎯 Complete Workflow

```
1. Chat Messages (Group Discussion)
   ↓
2. Admin clicks "Analyze Chat" → LLM analyzes messages
   ↓
3. Activity Recommendations appear in "Recommendations" tab
   ↓
4. Admin adds selected recommendations to "Cart"
   ↓
5. Admin clicks "Generate Itinerary" → LLM creates day-by-day plan
   ↓
6. Itinerary displayed in "Itineraries" tab
```

---

## 🛠️ Setup Instructions

### 1. Install Backend Dependencies

```bash
cd backend
npm install
# This will install axios and other required packages
```

### 2. Start the LLM Service

The LLM service must be running on port 8000 before using the features.

```bash
cd "activities rec from chat"

# Create virtual environment (first time only)
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On macOS/Linux
# OR
venv\Scripts\activate     # On Windows

# Install dependencies (first time only)
pip install -r requirements.txt

# Start the LLM service
python main.py
```

The service will start on `http://localhost:8000`

### 3. Configure Environment Variables

Add to your `.env` file (if not already present):

```bash
# Backend .env
LLM_SERVICE_URL=http://localhost:8000
```

### 4. Start Your Application

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: LLM Service
cd "activities rec from chat"
source venv/bin/activate
python main.py
```

---

## 📚 Data Models

### Recommendation Schema
```javascript
{
  type: 'activity' | 'hotel',
  name: String,
  description: String,
  image_url: String,
  added_at: Date,
  added_by: ObjectId,
  
  // Activity-specific
  duration: String,          // e.g., "2-3 hours"
  score: Number,            // 0-1 relevance score
  category: String,         // e.g., "Beach", "Adventure"
  region: String,          // e.g., "North", "South"
  lat: Number,
  lon: Number,
  best_time: String,       // e.g., "Morning", "Night"
  
  // Hotel-specific
  hotel_id: String,
  price: Number,
  stars: Number,
  similarity_score: Number,
  
  // Voting
  votes: [{
    user_id: ObjectId,
    voted_at: Date
  }]
}
```

### Cart Item Schema
```javascript
{
  name: String,
  type: 'activity' | 'hotel',
  added_by: ObjectId,
  added_at: Date,
  
  // Copied from recommendation
  duration: String,
  category: String,
  region: String,
  lat: Number,
  lon: Number,
  best_time: String,
  price: Number,
  stars: Number,
  image_url: String,
  description: String
}
```

### Itinerary Schema
```javascript
{
  num_days: Number,
  num_people: Number,
  created_at: Date,
  created_by: ObjectId,
  days: [{
    day: Number,
    activities: [{
      name: String,
      start_time: String,      // e.g., "09:00 AM"
      end_time: String,        // e.g., "11:00 AM"
      travel_time_from_prev: String,  // e.g., "45 mins"
      duration: String,
      category: String,
      region: String,
      lat: Number,
      lon: Number,
      best_time: String,
      score: Number
    }],
    total_duration_mins: Number
  }]
}
```

---

## 🔌 API Endpoints

### Recommendations

#### `POST /api/chats/:chatId/analyze-chat`
Analyzes chat messages and generates activity recommendations using LLM.

**Auth Required:** Yes  
**Access:** Group members

**Response:**
```json
{
  "success": true,
  "message": "Found 5 new recommendations",
  "newRecommendationsCount": 5
}
```

#### `POST /api/chats/:chatId/recommendations`
Manually add a recommendation (used by myLens for hotels).

**Auth Required:** Yes  
**Access:** Group members

**Body:**
```json
{
  "recommendation": {
    "type": "hotel",
    "name": "Hotel Name",
    "price": 3500,
    "stars": 4,
    "description": "...",
    "image_url": "...",
    "similarity_score": 0.85
  }
}
```

#### `POST /api/chats/:chatId/recommendations/:recIndex/vote`
Toggle vote on a recommendation.

**Auth Required:** Yes  
**Access:** Group members

#### `DELETE /api/chats/:chatId/recommendations/:recIndex`
Delete a recommendation.

**Auth Required:** Yes  
**Access:** Admin only

### Cart

#### `POST /api/chats/:chatId/cart/add`
Add a recommendation to the cart.

**Auth Required:** Yes  
**Access:** Admin only

**Body:**
```json
{
  "recIndex": 0
}
```

#### `DELETE /api/chats/:chatId/cart/:cartIndex`
Remove an item from the cart.

**Auth Required:** Yes  
**Access:** Admin only

### Itinerary

#### `POST /api/chats/:chatId/generate-itinerary`
Generate an AI itinerary from cart items.

**Auth Required:** Yes  
**Access:** Admin only

**Body:**
```json
{
  "num_days": 3,
  "num_people": 4
}
```

**Response:**
```json
{
  "success": true,
  "message": "Itinerary generated successfully",
  "data": {
    "chat_id": "...",
    "num_days": 3,
    "num_people": 4,
    "days": [...]
  }
}
```

#### `DELETE /api/chats/:chatId/itineraries/:itinIndex`
Delete an itinerary.

**Auth Required:** Yes  
**Access:** Admin only

---

## 🎨 Frontend Components

### GroupProfileModal
Main component for group profile with 4 tabs:

1. **Members Tab**: View and manage group members
2. **Recommendations Tab**: 
   - View activity/hotel recommendations
   - "Analyze Chat" button (admin only)
   - Vote on recommendations
   - Add to cart (admin only)
3. **Cart Tab**:
   - View cart items
   - Configure trip settings (days, people)
   - "Generate Itinerary" button (admin only)
   - Remove items (admin only)
4. **Itineraries Tab**:
   - View generated itineraries
   - Day-by-day breakdown
   - Delete itineraries (admin only)

---

## 🔄 LLM Service Details

### Chat Message Analysis (`/chat/message`)

- Triggers every 7 messages
- Uses sentence transformers for semantic search
- Returns top 3-5 relevant activities
- Filters out duplicates and items already in cart

### Itinerary Generation (`/itinerary/generate`)

1. **Primary Method**: Uses Qwen 2.5 0.5B Instruct model
   - Generates realistic, non-overlapping schedules
   - Respects activity best times (e.g., casinos at night)
   - Includes travel time between activities

2. **Fallback Method**: Deterministic scheduling algorithm
   - Groups activities by region
   - Sorts by time preference
   - Ensures max 6 hours of activities per day

---

## 🧪 Testing the Workflow

1. **Create a Private Group**
   ```
   - Go to a city page
   - Click "Create Private Chat"
   - Add members
   ```

2. **Have a Conversation**
   ```
   - Send messages about trip preferences
   - Example: "We want to visit beaches and try water sports"
   - Send at least 7 messages for analysis
   ```

3. **Analyze Chat**
   ```
   - Open group profile (click arrow in chat header)
   - Go to "Recommendations" tab
   - Click "Analyze Chat for Activities"
   - Wait for LLM to process (5-10 seconds)
   ```

4. **Add to Cart**
   ```
   - Review recommendations
   - Members can vote on favorites
   - Admin clicks "Add to Cart" on selected items
   ```

5. **Generate Itinerary**
   ```
   - Go to "Cart" tab
   - Set number of days and people
   - Click "Generate AI Itinerary"
   - Wait for generation (10-15 seconds)
   ```

6. **View Itinerary**
   ```
   - Switch to "Itineraries" tab
   - Expand to see day-by-day schedule
   - View activity times, durations, and travel times
   ```

---

## ⚠️ Troubleshooting

### LLM Service Not Running

**Error**: `Failed to analyze chat. Make sure the LLM service is running on port 8000.`

**Fix**:
```bash
cd "activities rec from chat"
source venv/bin/activate
python main.py
```

### Port Already in Use

**Error**: `Address already in use: 8000`

**Fix**:
```bash
# Find and kill the process
lsof -ti:8000 | xargs kill -9

# Or use a different port
python main.py --port 8001
```

Then update backend `.env`:
```
LLM_SERVICE_URL=http://localhost:8001
```

### No Recommendations Found

**Possible Causes**:
- Less than 7 messages in chat
- Messages too generic
- All activities already recommended

**Fix**:
- Have more detailed conversations
- Mention specific interests (beaches, forts, nightlife)
- Clear old recommendations if needed

### Axios Not Found

**Error**: `Cannot find module 'axios'`

**Fix**:
```bash
cd backend
npm install axios
```

---

## 🎯 Feature Highlights

✅ **AI-Powered Analysis**: Semantic understanding of chat messages  
✅ **Smart Recommendations**: Relevance scoring and duplicate filtering  
✅ **Voting System**: Democratic decision-making  
✅ **Intelligent Scheduling**: Time-aware, region-grouped itineraries  
✅ **Admin Controls**: Curated experience with member input  
✅ **Dual Integration**: Works with both LLM activities and myLens hotels  
✅ **Real-time Updates**: Instant synchronization across all tabs  

---

## 📝 Notes

- The LLM service uses CPU by default for stability
- First-time model download may take 2-3 minutes
- Itinerary generation works best with 3-10 cart items
- Activity best times are respected (night activities after 7 PM)
- Maximum 6 hours of activities per day for realistic planning

---

## 🚀 Future Enhancements

- [ ] Save itineraries as PDF
- [ ] Share itineraries with non-members
- [ ] Real-time collaboration on cart
- [ ] Google Maps integration for routes
- [ ] Budget tracking
- [ ] Weather-aware scheduling
- [ ] User preference learning

---

**Need Help?** Check the backend logs and LLM service terminal for detailed error messages.
