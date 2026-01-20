# MyLens Image Flow Diagram

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION                         │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    1. UPLOAD IMAGE TO MYLENS                     │
│  Components: MyLensModal.jsx / MylensPage.jsx                    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              2. AI SERVICE - VISUAL SEARCH                       │
│  Endpoint: POST /api/v1/hotels/similar                           │
│  Returns: Hotel matches with similarity scores                   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│         3. FETCH CORRECT IMAGES FROM HOTELS FOLDER               │
│  Service: hotelService.getHotelFirstImageUrl()                   │
│  For each hotel result:                                          │
│    - Call: GET /api/hotels/{hotelName}/first-image              │
│    - Returns: Image URL from hotels folder                       │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              4. DISPLAY RESULTS WITH CORRECT IMAGES              │
│  Each hotel now shows its unique image                           │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│           5. USER ADDS HOTEL TO RECOMMENDATIONS                  │
│  Component: ChatWindow.jsx                                       │
│  Function: handleAddToRecommendations()                          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│         6. FETCH IMAGE AGAIN BEFORE SAVING                       │
│  Ensures database stores correct image URL                       │
│  Endpoint: POST /api/chats/{chatId}/recommendations              │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              7. VIEW IN GROUP PROFILE MODAL                      │
│  Component: GroupProfileModal.jsx                                │
│  Function: fetchChatDetails()                                    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│         8. LOAD IMAGES FOR SAVED RECOMMENDATIONS                 │
│  For each recommendation:                                        │
│    - Check if has valid image URL                               │
│    - If not, fetch from hotels folder                           │
│    - Display with correct image                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Before Fix:
```
AI Search → Returns hotel data → Display same image for all
                                          ↓
                              User sees duplicate images ❌
```

### After Fix:
```
AI Search → Returns hotel data → Fetch images from hotels folder
                                          ↓
                              Map hotel name to actual images
                                          ↓
                              Display unique images ✅
```

## Backend API Endpoints

### New Hotel Images API
```
GET /api/hotels/:hotelName/info
├─ Returns: Hotel metadata + first image URL
└─ Example: /api/hotels/Taj Exotica Resort & Spa/info

GET /api/hotels/:hotelName/image/:imageName
├─ Returns: Actual image file (PNG/JPG/WebP)
├─ Headers: Cache-Control: public, max-age=86400
└─ Example: /api/hotels/Taj Exotica Resort & Spa/image/slide2.png

GET /api/hotels/:hotelName/first-image
├─ Returns: { image_url: "/api/hotels/.../image/..." }
└─ Example: /api/hotels/Taj Exotica Resort & Spa/first-image
```

## Component Updates

### 1. MyLensModal.jsx
```javascript
// BEFORE
handleSearch() {
  const hotels = await searchSimilarHotels(image);
  setHotels(hotels); // All show same image
}

// AFTER
handleSearch() {
  const hotels = await searchSimilarHotels(image);
  const hotelsWithImages = await Promise.all(
    hotels.map(async (hotel) => {
      const imageUrl = await getHotelFirstImageUrl(hotel.name);
      return { ...hotel, image_url: imageUrl };
    })
  );
  setHotels(hotelsWithImages); // Each has unique image ✅
}
```

### 2. ChatWindow.jsx
```javascript
// BEFORE
handleAddToRecommendations(hotel) {
  const recommendation = {
    ...hotel,
    image_url: hotel.best_match_image_path // Wrong image
  };
  saveRecommendation(recommendation);
}

// AFTER
handleAddToRecommendations(hotel) {
  const imageUrl = await getHotelFirstImageUrl(hotel.name);
  const recommendation = {
    ...hotel,
    image_url: imageUrl // Correct image ✅
  };
  saveRecommendation(recommendation);
}
```

### 3. GroupProfileModal.jsx
```javascript
// BEFORE
fetchChatDetails() {
  const data = await fetch('/api/chats/:id');
  setChatDetails(data); // Shows wrong images
}

// AFTER
fetchChatDetails() {
  const data = await fetch('/api/chats/:id');
  const recommendations = await Promise.all(
    data.recommendations.map(async (rec) => {
      const imageUrl = await getHotelFirstImageUrl(rec.name);
      return { ...rec, image_url: imageUrl };
    })
  );
  setChatDetails({ ...data, recommendations }); // Correct images ✅
}
```

## Hotels Folder Structure

```
hotels/
├── Taj Exotica Resort & Spa/
│   ├── info.json              ← Hotel metadata
│   ├── 514931641.png          ← Image 1 (returned as first)
│   ├── 996x492.png            ← Image 2
│   ├── slide2.png             ← Image 3
│   └── ...
├── Alila Diwa Goa/
│   ├── info.json
│   └── images...
└── ... (112 hotels total)
```

### info.json Structure
```json
{
  "name": "Taj Exotica Resort & Spa",
  "stars": 5,
  "special_themes": ["luxury", "beachfront"],
  "description": "Welcome to Taj Exotica...",
  "amenities": ["pool", "spa", "fitness_center"],
  "price": 16361,
  "external_link": "https://www.makemytrip.com/..."
}
```

## Image Resolution Priority

```
1. Fetch from hotels folder    ← Primary (NEW)
   └─ GET /api/hotels/{name}/first-image
         ↓ Success
2. Use existing image_url       ← Fallback 1
         ↓ Not available
3. Use best_match_image_path    ← Fallback 2
         ↓ Not available
4. Show placeholder image       ← Fallback 3
   └─ Unsplash hotel image
```

## Key Benefits

✅ **Unique Images**: Each hotel displays its actual image  
✅ **Persistent**: Images saved correctly in recommendations  
✅ **Scalable**: Works with all 112 hotels automatically  
✅ **Performant**: Parallel fetching + 24h caching  
✅ **Resilient**: Multiple fallback strategies  
✅ **Consistent**: Same logic across all components  

## Testing Checklist

- [ ] MyLens search shows unique images for each hotel
- [ ] Adding to recommendations preserves correct image
- [ ] Group profile displays correct images
- [ ] Images persist after page refresh
- [ ] Fallback images work for missing hotels
- [ ] No console errors during normal operation
- [ ] Performance is acceptable (< 2s for image loading)
