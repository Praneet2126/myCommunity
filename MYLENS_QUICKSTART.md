# MyLens Hotel Images - Quick Start Guide

## 🎯 What Was Fixed

**Problem:** All hotels in myLens recommendations showed the same image.

**Solution:** Now each hotel displays its unique image from the `hotels` folder.

## 🚀 Quick Start

### 1. Start the Backend Server
```bash
cd backend
npm install  # If not already done
node server.js
```
The backend should be running on `http://localhost:3000`

### 2. Start the Frontend
```bash
cd frontend
npm install  # If not already done
npm run dev
```
The frontend should be running on `http://localhost:5173`

### 3. Test the Feature

#### Test MyLens Search:
1. Log in to the application
2. Navigate to MyLens page (or open MyLens modal in a private chat)
3. Upload a hotel image
4. Click "Find Similar Hotels"
5. **Verify:** Each hotel result shows a unique image

#### Test Recommendations:
1. From MyLens results, click "Add to Recommendations" on a hotel
2. Open the Group Profile modal
3. Go to "Recommendations" tab
4. **Verify:** The hotel appears with its correct image

#### Test Persistence:
1. Refresh the page
2. Open Group Profile modal again
3. **Verify:** Saved recommendations still show correct images

## 📁 Files Modified

### Backend
- ✅ `backend/routes/hotels.js` (NEW) - Hotel images API
- ✅ `backend/server.js` - Added hotels route

### Frontend
- ✅ `frontend/src/services/hotelService.js` (NEW) - Hotel service
- ✅ `frontend/src/components/chat/MyLensModal.jsx` - Fetch images in search
- ✅ `frontend/src/components/chat/ChatWindow.jsx` - Fetch images when saving
- ✅ `frontend/src/components/chat/GroupProfileModal.jsx` - Fetch images on load
- ✅ `frontend/src/pages/MylensPage.jsx` - Fetch images in search

## 🔍 How It Works

```
User uploads image
       ↓
AI finds similar hotels
       ↓
For each hotel:
  - Fetch image from: /api/hotels/{hotelName}/first-image
  - Get first image from hotels/{hotelName}/ folder
       ↓
Display hotels with correct images ✅
```

## 🛠️ API Endpoints

### Get Hotel Image URL
```bash
GET /api/hotels/Taj%20Exotica%20Resort%20%26%20Spa/first-image

Response:
{
  "success": true,
  "data": {
    "hotel_name": "Taj Exotica Resort & Spa",
    "image_url": "/api/hotels/Taj%20Exotica.../image/514931641.png",
    "image_name": "514931641.png"
  }
}
```

### Get Hotel Image File
```bash
GET /api/hotels/Taj%20Exotica%20Resort%20%26%20Spa/image/514931641.png

Response: Image file (PNG/JPG/WebP)
Headers: Cache-Control: public, max-age=86400
```

### Get Hotel Info
```bash
GET /api/hotels/Taj%20Exotica%20Resort%20%26%20Spa/info

Response:
{
  "success": true,
  "data": {
    "name": "Taj Exotica Resort & Spa",
    "stars": 5,
    "price": 16361,
    "description": "...",
    "image_url": "/api/hotels/.../image/...",
    "available_images": ["514931641.png", "996x492.png", ...]
  }
}
```

## 🧪 Testing with cURL

```bash
# Test if backend can access hotels folder
curl http://localhost:3000/api/hotels/Taj%20Exotica%20Resort%20%26%20Spa/first-image

# Test image serving
curl http://localhost:3000/api/hotels/Taj%20Exotica%20Resort%20%26%20Spa/image/514931641.png --output test.png

# Test hotel info
curl http://localhost:3000/api/hotels/Taj%20Exotica%20Resort%20%26%20Spa/info
```

## 🐛 Troubleshooting

### Images Not Loading?

**Check 1:** Verify hotels folder exists
```bash
ls -la hotels/
# Should show 112 hotel folders
```

**Check 2:** Check backend logs
```bash
# Look for errors in terminal where backend is running
```

**Check 3:** Check browser console
```javascript
// Open DevTools (F12) → Console
// Look for errors related to image loading
```

**Check 4:** Test API directly
```bash
curl http://localhost:3000/api/hotels/Alila%20Diwa%20Goa/first-image
```

### Still Showing Same Image?

**Clear browser cache:**
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

**Check network requests:**
1. Open DevTools → Network tab
2. Search for hotels
3. Look for `/api/hotels/` requests
4. Verify they return 200 status

### CORS Errors?

Check `backend/server.js` has correct CORS settings:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
```

## 📊 Expected Behavior

### ✅ Correct Behavior:
- Each hotel shows a unique image
- Images load within 1-2 seconds
- Images persist after page refresh
- Fallback image shows if hotel image missing
- No console errors

### ❌ Incorrect Behavior:
- All hotels show the same image
- Images don't load (broken image icon)
- Console shows 404 errors for `/api/hotels/`
- Images disappear after refresh

## 🎨 Image Fallback Chain

```
1. Try: GET /api/hotels/{name}/first-image
   ↓ (if fails)
2. Try: Use existing image_url from hotel data
   ↓ (if fails)
3. Try: Use best_match_image_path from AI
   ↓ (if fails)
4. Show: Unsplash placeholder image
```

## 📝 Environment Variables

Make sure these are set in your `.env` files:

### Backend `.env`
```bash
PORT=3000
FRONTEND_URL=http://localhost:5173
```

### Frontend `.env`
```bash
VITE_API_URL=http://localhost:3000/api
VITE_AI_SERVICE_URL=http://localhost:8001
```

## 🔗 Related Documentation

- `MYLENS_IMAGE_FIX_SUMMARY.md` - Detailed implementation guide
- `MYLENS_IMAGE_FLOW.md` - Architecture and data flow diagrams
- `backend/routes/hotels.js` - Backend API code
- `frontend/src/services/hotelService.js` - Frontend service code

## 💡 Tips

1. **Performance:** Images are cached for 24 hours by the backend
2. **Parallel Loading:** Multiple images load simultaneously
3. **Error Handling:** System gracefully falls back if images missing
4. **Scalability:** Automatically works with all hotels in the folder

## ✨ Success Indicators

You'll know it's working when:
- ✅ MyLens search shows different images for each hotel
- ✅ Saved recommendations keep their correct images
- ✅ Images load smoothly without errors
- ✅ Browser DevTools shows successful `/api/hotels/` requests
- ✅ Each hotel's image matches its actual appearance

## 🎉 You're All Set!

The myLens feature now displays unique, correct images for each hotel recommendation!

For questions or issues, check the detailed documentation in:
- `MYLENS_IMAGE_FIX_SUMMARY.md`
- `MYLENS_IMAGE_FLOW.md`
