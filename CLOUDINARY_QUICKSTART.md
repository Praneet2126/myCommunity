# Cloudinary Integration - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### 1. Get Cloudinary Credentials

1. Go to [https://cloudinary.com/users/register_free](https://cloudinary.com/users/register_free)
2. Create a free account
3. From the Dashboard, copy:
   - Cloud Name
   - API Key
   - API Secret

### 2. Configure Backend

Create `backend/.env` file:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/myCommunity
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

# Add these Cloudinary credentials
CLOUDINARY_CLOUD_NAME=your-cloud-name-here
CLOUDINARY_API_KEY=your-api-key-here
CLOUDINARY_API_SECRET=your-api-secret-here

CLIENT_URL=http://localhost:5173
```

### 3. Configure Frontend

Create `frontend/.env` file:

```env
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=http://localhost:5000
```

### 4. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 5. Test Upload

1. Open browser to `http://localhost:5173`
2. Log in to your account
3. Navigate to Profile (`/profile`)
4. Click on profile photo
5. Select an image (max 5MB)
6. Photo uploads automatically to Cloudinary!

## ✅ What's Included

### Backend Features
- ✅ Cloudinary configuration
- ✅ Multer file upload middleware
- ✅ Image validation (type, size)
- ✅ Automatic image optimization
- ✅ Old photo cleanup
- ✅ Secure upload endpoint

### Frontend Features
- ✅ ProfilePhotoUpload component
- ✅ ProfilePage with full user management
- ✅ Upload service with API calls
- ✅ Real-time preview
- ✅ Loading states
- ✅ Error handling

## 📁 Files Created/Modified

### Backend
- `backend/config/cloudinary.js` - Cloudinary configuration
- `backend/routes/users.js` - Added upload endpoint
- `backend/package.json` - Added dependencies

### Frontend
- `frontend/src/components/auth/ProfilePhotoUpload.jsx` - Upload component
- `frontend/src/pages/ProfilePage.jsx` - Profile management page
- `frontend/src/services/uploadService.js` - API service
- `frontend/src/App.jsx` - Added profile route

## 🔧 Configuration Details

### Image Upload Settings
- **Max file size**: 5MB
- **Allowed formats**: jpg, jpeg, png, gif, webp
- **Auto resize**: 500x500px (maintains aspect ratio)
- **Quality**: Auto-optimized by Cloudinary
- **Storage folder**: `myCommunity/profile-photos`

### Security
- JWT authentication required
- Server-side file validation
- CORS protection
- Secure API key handling

## 🎯 API Endpoint

```http
POST /api/users/upload-photo
Authorization: Bearer {your-jwt-token}
Content-Type: multipart/form-data

Body:
- photo: File
```

## 🐛 Common Issues

**"Authentication required"**
- Make sure you're logged in
- Check JWT token is valid

**"Only image files are allowed"**
- Upload jpg, png, gif, or webp files only

**"File size must be less than 5MB"**
- Compress your image before uploading

**Cloudinary connection error**
- Verify credentials in `.env`
- Check internet connection
- Ensure Cloudinary account is active

## 📚 Full Documentation

See `CLOUDINARY_SETUP.md` for detailed documentation.

## 🎉 You're Done!

Your application now supports profile photo uploads with Cloudinary!
