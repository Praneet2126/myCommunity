# Cloudinary Integration Setup Guide

This guide explains how to configure Cloudinary for profile photo uploads in myCommunity.

## What is Cloudinary?

Cloudinary is a cloud-based image and video management service. It provides:
- Image storage and hosting
- Automatic image optimization
- Image transformation and resizing
- Fast CDN delivery

## Prerequisites

1. A Cloudinary account (free tier available)
2. Node.js and npm installed
3. Project dependencies installed

## Step 1: Create a Cloudinary Account

1. Go to [https://cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. Once logged in, go to the Dashboard
4. You'll see your account credentials:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

## Step 2: Configure Backend Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/myCommunity

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name-here
CLOUDINARY_API_KEY=your-api-key-here
CLOUDINARY_API_SECRET=your-api-secret-here

# CORS Configuration
CLIENT_URL=http://localhost:5173
```

**Important:** Replace the Cloudinary placeholders with your actual credentials from the Cloudinary dashboard.

## Step 3: Configure Frontend Environment Variables

Create a `.env` file in the `frontend` directory:

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api

# WebSocket Configuration
VITE_WS_URL=http://localhost:5000
```

## Step 4: Install Dependencies

The required packages have already been installed:

**Backend:**
- `cloudinary` - Official Cloudinary SDK
- `multer` - Middleware for handling multipart/form-data
- `multer-storage-cloudinary` - Cloudinary storage engine for Multer

## Step 5: Test the Integration

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

3. Log in to your account and navigate to your profile page (`/profile`)

4. Click on your profile photo to upload a new image

5. Select an image file (max 5MB, formats: jpg, jpeg, png, gif, webp)

6. The image will be automatically uploaded to Cloudinary and your profile will be updated

## Features Implemented

### Backend (`/api/users/upload-photo`)

- **File Upload Endpoint**: POST request with multipart/form-data
- **File Validation**: 
  - Only image files allowed
  - Maximum size: 5MB
  - Allowed formats: jpg, jpeg, png, gif, webp
- **Image Transformation**:
  - Automatic resizing to max 500x500px
  - Quality optimization
- **Storage**: Images stored in `myCommunity/profile-photos` folder in Cloudinary
- **Cleanup**: Old profile photos are automatically deleted when uploading a new one

### Frontend Components

1. **ProfilePhotoUpload Component**:
   - Drag-and-drop or click to upload
   - Image preview before upload
   - Loading state during upload
   - Error handling
   - Hover effect to show upload button

2. **ProfilePage**:
   - Complete user profile management
   - Profile photo upload section
   - Editable profile fields (name, phone)
   - Read-only fields (username, email)
   - Account information display

3. **Upload Service**:
   - `uploadProfilePhoto()` - Upload photo to Cloudinary
   - `updateProfile()` - Update user profile information
   - `getUserProfile()` - Fetch current user profile
   - JWT authentication handling

## API Endpoints

### Upload Profile Photo

```http
POST /api/users/upload-photo
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body:
- photo: File (image file)
```

**Response:**
```json
{
  "success": true,
  "message": "Profile photo uploaded successfully",
  "data": {
    "profile_photo_url": "https://res.cloudinary.com/..."
  }
}
```

### Get User Profile

```http
GET /api/users/profile
Authorization: Bearer {token}
```

### Update User Profile

```http
PUT /api/users/profile
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "full_name": "John Doe",
  "phone": "+1234567890"
}
```

## Security Considerations

1. **Authentication**: All endpoints require JWT authentication
2. **File Validation**: Server-side validation for file type and size
3. **Environment Variables**: Never commit `.env` files to version control
4. **API Keys**: Keep your Cloudinary API credentials secure
5. **CORS**: Properly configure CORS to allow only trusted origins

## Troubleshooting

### Upload fails with "Authentication required"
- Make sure you're logged in
- Check that the JWT token is valid and not expired

### Upload fails with "Only image files are allowed"
- Ensure you're uploading an image file (jpg, png, gif, etc.)
- Check the file extension and MIME type

### Upload fails with file size error
- Image must be less than 5MB
- Consider compressing the image before upload

### Cloudinary connection error
- Verify your Cloudinary credentials in `.env`
- Check that environment variables are loaded correctly
- Ensure you have an active internet connection

### Images not displaying
- Check browser console for errors
- Verify the Cloudinary URL is accessible
- Check if Cloudinary account is active

## Cloudinary Dashboard

Access your Cloudinary dashboard to:
- View uploaded images
- Check storage usage
- Monitor bandwidth
- Set up additional transformations
- Configure security settings

Dashboard URL: [https://cloudinary.com/console](https://cloudinary.com/console)

## Additional Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Cloudinary Node.js SDK](https://cloudinary.com/documentation/node_integration)
- [Multer Documentation](https://github.com/expressjs/multer)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Cloudinary documentation
3. Check application logs for detailed error messages
