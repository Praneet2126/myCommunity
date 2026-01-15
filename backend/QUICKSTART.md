# Quick Start Guide

Get your myCommunity backend up and running in 5 minutes!

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally or remote connection string)
- npm or yarn

## Step 1: Install Dependencies

```bash
cd backend
npm install
```

## Step 2: Configure Environment

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

**Important**: Change `JWT_SECRET` to a strong random string in production!

## Step 3: Start MongoDB

Make sure MongoDB is running:

```bash
# macOS with Homebrew
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

## Step 4: Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

You should see:
```
Connected to MongoDB
Server is running on http://localhost:3000
Health check available at http://localhost:3000/health
Environment: development
```

## Step 5: Seed Cities (Optional but Recommended)

Open a new terminal and run:

```bash
curl -X POST http://localhost:3000/api/cities/seed
```

This will populate your database with 5 cities:
- Mumbai
- Delhi
- Bangalore
- Goa
- Jaipur

## Step 6: Test the API

### Check Health

```bash
curl http://localhost:3000/health
```

### Register a User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "full_name": "Test User"
  }'
```

Save the `accessToken` from the response.

### Get All Cities

```bash
curl http://localhost:3000/api/cities
```

### Join a City

```bash
curl -X POST http://localhost:3000/api/cities/mumbai/join \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Send a Message

```bash
curl -X POST http://localhost:3000/api/cities/mumbai/chat/messages \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello Mumbai community!"
  }'
```

## Troubleshooting

### MongoDB Connection Error

**Error**: `MongoDB connection error: connect ECONNREFUSED`

**Solution**: 
- Make sure MongoDB is running
- Check your `MONGODB_URI` in `.env`
- Try: `mongodb://127.0.0.1:27017/mycommunity` instead of `localhost`

### Port Already in Use

**Error**: `Error: listen EADDRINUSE: address already in use :::3000`

**Solution**:
- Change `PORT` in `.env` to another port (e.g., 3001)
- Or kill the process using port 3000:
  ```bash
  # macOS/Linux
  lsof -ti:3000 | xargs kill -9
  
  # Windows
  netstat -ano | findstr :3000
  taskkill /PID <PID> /F
  ```

### JWT Secret Warning

**Error**: Using default JWT secret

**Solution**: Set a strong `JWT_SECRET` in your `.env` file:
```bash
# Generate a random secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Next Steps

1. Read the full [API Documentation](./README.md)
2. Check out the [API Testing Guide](./API_TESTING_GUIDE.md)
3. Import the Postman collection for easy testing
4. Connect your frontend to the API
5. Implement real-time features with Socket.io (coming soon)

## Development Tips

### Auto-reload on Changes

The `npm run dev` command uses nodemon to automatically restart the server when you make changes to the code.

### View Database

Use MongoDB Compass or mongosh to view your data:

```bash
mongosh mongodb://localhost:27017/mycommunity
```

Common commands:
```javascript
// Show all collections
show collections

// View users
db.users.find().pretty()

// View cities
db.cities.find().pretty()

// View messages
db.messages.find().pretty()

// Count documents
db.users.countDocuments()
```

### Debug Mode

Enable detailed error logging:

```env
NODE_ENV=development
```

This will include stack traces in error responses.

## Production Deployment

Before deploying to production:

1. ✅ Change `JWT_SECRET` to a strong random string
2. ✅ Set `NODE_ENV=production`
3. ✅ Use a production MongoDB instance (MongoDB Atlas, etc.)
4. ✅ Configure proper CORS origins in `FRONTEND_URL`
5. ✅ Enable HTTPS
6. ✅ Set up proper logging (Winston, Morgan, etc.)
7. ✅ Configure rate limiting for all routes
8. ✅ Set up monitoring (PM2, New Relic, etc.)
9. ✅ Enable database backups
10. ✅ Review and adjust security headers

## Support

For issues or questions:
- Check the [README.md](./README.md) for detailed documentation
- Review the [API Testing Guide](./API_TESTING_GUIDE.md) for examples
- Check MongoDB and Node.js logs for errors

Happy coding! 🚀
