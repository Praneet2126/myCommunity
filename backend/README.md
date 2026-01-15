# myCommunity Backend API

A comprehensive REST API with **real-time WebSocket support** for the myCommunity travel-based social platform built with Node.js, Express, Socket.io, and MongoDB.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **User Management**: User registration, login, profile management
- **City Communities**: Join multiple city-based travel communities
- **City Group Chats**: Public group chats for each city community
- **Private Chats**: Create private group chats with known individuals
- **Message System**: Unified messaging system with support for text, images, and files
- **Real-Time Communication**: WebSocket support with Socket.io for instant messaging
- **Typing Indicators**: See when others are typing in real-time
- **Online Presence**: Track which users are currently online
- **Read Receipts**: Know when messages are read in private chats
- **Security**: Helmet.js, CORS, rate limiting, password hashing with bcrypt

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Real-Time**: Socket.io (WebSocket)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT)
- **Security**: Helmet, bcryptjs, express-rate-limit
- **Validation**: express-validator

## Project Structure

```
backend/
├── config/
│   ├── db.js              # MongoDB connection
│   ├── jwt.js             # JWT token utilities
│   └── socket.js          # Socket.io configuration
├── socket/
│   └── handlers/
│       ├── cityChat.js    # City chat WebSocket events
│       ├── privateChat.js # Private chat WebSocket events
│       └── presence.js    # Online presence tracking
├── models/
│   ├── User.js            # User schema
│   ├── City.js            # City schema
│   ├── CityMembership.js  # User-City relationship
│   ├── CityChat.js        # City group chat schema
│   ├── PrivateChat.js     # Private chat schema
│   ├── PrivateChatParticipant.js  # Private chat participants
│   └── Message.js         # Unified message schema
├── middleware/
│   ├── auth.js            # Authentication & authorization
│   ├── validator.js       # Input validation rules
│   └── errorHandler.js    # Global error handling
├── routes/
│   ├── auth.js            # Authentication routes
│   ├── users.js           # User management routes
│   ├── cities.js          # City and city chat routes
│   └── chats.js           # Private chat routes
├── .env                   # Environment variables
├── package.json
└── server.js              # Application entry point
```

## Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Set up environment variables**:
Create a `.env` file in the backend directory:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/mycommunity
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

3. **Start MongoDB**:
```bash
# Make sure MongoDB is running on your system
mongod
```

4. **Seed the database with cities** (optional):
```bash
curl -X POST http://localhost:3000/api/cities/seed
```

## Running the Server

**Development mode** (with auto-reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication Routes (`/api/auth`)

#### Register a new user
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "full_name": "John Doe",
  "phone": "+1234567890"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### User Routes (`/api/users`)

All user routes require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

#### Get current user profile
```http
GET /api/users/profile
```

#### Update profile
```http
PUT /api/users/profile
Content-Type: application/json

{
  "full_name": "John Updated Doe",
  "phone": "+1234567890",
  "profile_photo_url": "https://example.com/photo.jpg"
}
```

#### Change password
```http
PUT /api/users/change-password
Content-Type: application/json

{
  "current_password": "oldpassword123",
  "new_password": "newpassword123"
}
```

### City Routes (`/api/cities`)

#### Get all active cities
```http
GET /api/cities
```

#### Get city details
```http
GET /api/cities/:cityId
```

#### Join a city (requires auth)
```http
POST /api/cities/:cityId/join
Authorization: Bearer YOUR_ACCESS_TOKEN
```

#### Leave a city (requires auth)
```http
DELETE /api/cities/:cityId/leave
Authorization: Bearer YOUR_ACCESS_TOKEN
```

#### Get city members (requires auth)
```http
GET /api/cities/:cityId/members
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### City Chat Routes (`/api/cities/:cityId/chat`)

#### Get city chat messages (requires auth and membership)
```http
GET /api/cities/:cityId/chat/messages?page=1&limit=50
Authorization: Bearer YOUR_ACCESS_TOKEN
```

#### Send message to city chat (requires auth and membership)
```http
POST /api/cities/:cityId/chat/messages
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "content": "Hello everyone!",
  "message_type": "text"
}
```

#### Edit message (requires auth, own message only)
```http
PUT /api/cities/:cityId/chat/messages/:messageId
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "content": "Updated message content"
}
```

#### Delete message (requires auth, own message only)
```http
DELETE /api/cities/:cityId/chat/messages/:messageId
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Private Chat Routes (`/api/chats`)

#### Get user's private chats (requires auth)
```http
GET /api/chats
Authorization: Bearer YOUR_ACCESS_TOKEN
```

#### Create new private chat (requires auth)
```http
POST /api/chats
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "name": "Mumbai Trip Planning",
  "participant_ids": ["user_id_1", "user_id_2", "user_id_3"]
}
```

#### Get chat details (requires auth and membership)
```http
GET /api/chats/:chatId
Authorization: Bearer YOUR_ACCESS_TOKEN
```

#### Add members to chat (requires auth and admin role in chat)
```http
POST /api/chats/:chatId/members
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "user_ids": ["user_id_4", "user_id_5"]
}
```

#### Remove member from chat (requires auth)
```http
DELETE /api/chats/:chatId/members/:userId
Authorization: Bearer YOUR_ACCESS_TOKEN
```

#### Get chat messages (requires auth and membership)
```http
GET /api/chats/:chatId/messages?page=1&limit=50
Authorization: Bearer YOUR_ACCESS_TOKEN
```

#### Send message to private chat (requires auth and membership)
```http
POST /api/chats/:chatId/messages
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "content": "Let's meet at 5 PM!",
  "message_type": "text"
}
```

## Database Schema

### Collections

1. **users**: User accounts with authentication details
2. **cities**: Travel destination communities
3. **citymemberships**: Many-to-many relationship between users and cities
4. **citychats**: One group chat per city
5. **privatechats**: User-created private group chats
6. **privatechatparticipants**: Many-to-many relationship for private chat members
7. **messages**: Unified message collection for both city and private chats

### Key Relationships

- A user can join multiple cities
- Each city has one main group chat
- Users can create multiple private chats
- Messages are polymorphic (can belong to city chats or private chats)

## Security Features

1. **Password Hashing**: All passwords are hashed using bcrypt with 10 salt rounds
2. **JWT Tokens**: 
   - Access tokens expire in 15 minutes
   - Refresh tokens expire in 7 days
3. **Rate Limiting**: Auth endpoints limited to 100 requests per 15 minutes
4. **Input Validation**: All inputs validated using express-validator
5. **Security Headers**: Helmet.js protects against common vulnerabilities
6. **CORS**: Configured to allow only specified frontend origins

## Error Handling

The API uses consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ]
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (duplicate resource)
- `500`: Internal Server Error

## Future Enhancements

- [ ] WebSocket/Socket.io for real-time chat
- [ ] File upload for profile photos and chat media
- [ ] AI-powered travel recommendations
- [ ] Event creation and management within cities
- [ ] Push notifications for new messages
- [ ] Advanced search and filtering
- [ ] User blocking and reporting
- [ ] Message read receipts and typing indicators

## License

ISC
