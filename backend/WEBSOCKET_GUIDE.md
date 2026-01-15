# WebSocket Real-Time Chat Guide

Complete guide for implementing real-time chat functionality using Socket.io in the myCommunity backend.

## Overview

The backend now supports **real-time bi-directional communication** using Socket.io alongside the existing REST API. This enables:

✅ **Instant message delivery** - No polling required  
✅ **Typing indicators** - See when others are typing  
✅ **Online presence** - Know who's currently online  
✅ **Read receipts** - Track when messages are read  
✅ **Real-time notifications** - Instant updates for all events  

---

## Architecture

### Hybrid Approach

We use a **hybrid REST + WebSocket** architecture:

- **REST API**: User auth, message history, profile management
- **WebSocket**: Real-time message delivery, typing indicators, presence

### Components

```
server.js
  ├── config/socket.js         # Socket.io initialization & auth
  └── socket/handlers/
      ├── cityChat.js          # City group chat events
      ├── privateChat.js       # Private chat events
      └── presence.js          # Online status & presence
```

---

## Connection & Authentication

### Server-Side (Already Implemented)

Socket connections are authenticated using JWT tokens:

```javascript
// In config/socket.js
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  const decoded = verifyToken(token);
  const user = await User.findById(decoded.userId);
  
  if (!user || !user.is_active) {
    return next(new Error('Authentication error'));
  }
  
  socket.user = user; // Attach user to socket
  next();
});
```

### Client-Side Connection

```javascript
import { io } from 'socket.io-client';

// Connect to server with JWT token
const socket = io('http://localhost:3000', {
  auth: {
    token: localStorage.getItem('accessToken') // JWT token from login
  }
});

// Connection successful
socket.on('connect', () => {
  console.log('Connected to WebSocket server');
  console.log('Socket ID:', socket.id);
});

// Connection error
socket.on('connect_error', (error) => {
  console.error('Connection error:', error.message);
  // Token might be expired, refresh and reconnect
});

// Disconnected
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});

// Server error
socket.on('error', (error) => {
  console.error('Socket error:', error.message);
});
```

---

## City Group Chat Events

### 1. Join City Chat

**Emit:**
```javascript
socket.emit('join-city-chat', {
  cityId: 'mumbai'
});
```

**Receive (confirmation):**
```javascript
socket.on('joined-city-chat', (data) => {
  console.log('Joined:', data);
  // {
  //   cityId: 'mumbai',
  //   cityName: 'Mumbai',
  //   message: 'Successfully joined Mumbai chat'
  // }
});
```

**Receive (others notified):**
```javascript
socket.on('user-joined-city-chat', (data) => {
  console.log(`${data.full_name} joined the chat`);
  // {
  //   userId: '507f1f77bcf86cd799439011',
  //   username: 'johndoe',
  //   full_name: 'John Doe',
  //   profile_photo_url: 'https://...',
  //   cityId: 'mumbai'
  // }
});
```

### 2. Leave City Chat

**Emit:**
```javascript
socket.emit('leave-city-chat', {
  cityId: 'mumbai'
});
```

**Receive:**
```javascript
socket.on('left-city-chat', (data) => {
  console.log('Left city chat:', data.cityId);
});

socket.on('user-left-city-chat', (data) => {
  console.log(`${data.username} left the chat`);
});
```

### 3. Send Message to City Chat

**Emit:**
```javascript
socket.emit('send-city-message', {
  cityId: 'mumbai',
  content: 'Hello everyone! 👋',
  message_type: 'text', // 'text', 'image', 'file'
  media_url: null, // Optional: URL for images/files
  reply_to: null // Optional: ID of message being replied to
});
```

**Receive (everyone in the room):**
```javascript
socket.on('new-city-message', (message) => {
  console.log('New message:', message);
  // {
  //   _id: '507f1f77bcf86cd799439011',
  //   sender_id: {
  //     _id: '507f1f77bcf86cd799439012',
  //     username: 'johndoe',
  //     full_name: 'John Doe',
  //     profile_photo_url: 'https://...'
  //   },
  //   content: 'Hello everyone! 👋',
  //   message_type: 'text',
  //   is_edited: false,
  //   is_deleted: false,
  //   created_at: '2026-01-15T10:30:00.000Z',
  //   cityId: 'mumbai'
  // }
  
  // Add to your message list UI
  addMessageToUI(message);
});
```

### 4. Edit City Message

**Emit:**
```javascript
socket.emit('edit-city-message', {
  messageId: '507f1f77bcf86cd799439011',
  content: 'Updated message content',
  cityId: 'mumbai'
});
```

**Receive:**
```javascript
socket.on('city-message-edited', (message) => {
  console.log('Message edited:', message);
  // Update the message in your UI
  updateMessageInUI(message._id, message.content);
});
```

### 5. Delete City Message

**Emit:**
```javascript
socket.emit('delete-city-message', {
  messageId: '507f1f77bcf86cd799439011',
  cityId: 'mumbai'
});
```

**Receive:**
```javascript
socket.on('city-message-deleted', (data) => {
  console.log('Message deleted:', data.messageId);
  // Update UI to show "[Message deleted]"
  markMessageAsDeleted(data.messageId);
});
```

### 6. Typing Indicator (City Chat)

**Emit (when user starts typing):**
```javascript
socket.emit('city-typing', {
  cityId: 'mumbai'
});
```

**Emit (when user stops typing):**
```javascript
socket.emit('city-stop-typing', {
  cityId: 'mumbai'
});
```

**Receive:**
```javascript
socket.on('user-typing-city', (data) => {
  console.log(`${data.username} is typing...`);
  // Show typing indicator: "John is typing..."
  showTypingIndicator(data.userId, data.username);
});

socket.on('user-stopped-typing-city', (data) => {
  // Hide typing indicator
  hideTypingIndicator(data.userId);
});
```

**Example Implementation:**
```javascript
let typingTimer;
const TYPING_TIMER_LENGTH = 3000; // 3 seconds

messageInput.addEventListener('input', () => {
  socket.emit('city-typing', { cityId: 'mumbai' });
  
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    socket.emit('city-stop-typing', { cityId: 'mumbai' });
  }, TYPING_TIMER_LENGTH);
});
```

---

## Private Chat Events

### 1. Join Private Chat

**Emit:**
```javascript
socket.emit('join-private-chat', {
  chatId: '507f1f77bcf86cd799439011'
});
```

**Receive:**
```javascript
socket.on('joined-private-chat', (data) => {
  console.log('Joined private chat:', data);
});

socket.on('user-joined-private-chat', (data) => {
  console.log(`${data.full_name} joined`);
});
```

### 2. Leave Private Chat

**Emit:**
```javascript
socket.emit('leave-private-chat', {
  chatId: '507f1f77bcf86cd799439011'
});
```

**Receive:**
```javascript
socket.on('left-private-chat', (data) => {
  console.log('Left chat:', data.chatId);
});

socket.on('user-left-private-chat', (data) => {
  console.log(`${data.username} left`);
});
```

### 3. Send Message to Private Chat

**Emit:**
```javascript
socket.emit('send-private-message', {
  chatId: '507f1f77bcf86cd799439011',
  content: 'Hey guys! Let\'s plan the trip',
  message_type: 'text',
  media_url: null,
  reply_to: null
});
```

**Receive:**
```javascript
socket.on('new-private-message', (message) => {
  console.log('New private message:', message);
  addMessageToUI(message);
});
```

### 4. Edit Private Message

**Emit:**
```javascript
socket.emit('edit-private-message', {
  messageId: '507f1f77bcf86cd799439011',
  content: 'Updated content',
  chatId: '507f1f77bcf86cd799439011'
});
```

**Receive:**
```javascript
socket.on('private-message-edited', (message) => {
  updateMessageInUI(message._id, message.content);
});
```

### 5. Delete Private Message

**Emit:**
```javascript
socket.emit('delete-private-message', {
  messageId: '507f1f77bcf86cd799439011',
  chatId: '507f1f77bcf86cd799439011'
});
```

**Receive:**
```javascript
socket.on('private-message-deleted', (data) => {
  markMessageAsDeleted(data.messageId);
});
```

### 6. Typing Indicator (Private Chat)

**Emit:**
```javascript
socket.emit('private-typing', {
  chatId: '507f1f77bcf86cd799439011'
});

socket.emit('private-stop-typing', {
  chatId: '507f1f77bcf86cd799439011'
});
```

**Receive:**
```javascript
socket.on('user-typing-private', (data) => {
  showTypingIndicator(data.userId, data.username);
});

socket.on('user-stopped-typing-private', (data) => {
  hideTypingIndicator(data.userId);
});
```

### 7. Mark Messages as Read

**Emit:**
```javascript
socket.emit('mark-messages-read', {
  chatId: '507f1f77bcf86cd799439011'
});
```

**Receive:**
```javascript
socket.on('messages-read', (data) => {
  console.log(`Messages read by ${data.userId} at ${data.readAt}`);
  // Show read receipts (double checkmarks)
  showReadReceipts(data.userId, data.readAt);
});
```

---

## Presence & Online Status

### 1. Get Online Users Count

**Emit:**
```javascript
socket.emit('get-online-count');
```

**Receive:**
```javascript
socket.on('online-users', (count) => {
  console.log(`${count} users online`);
});
```

**Auto-broadcast (on user connect/disconnect):**
```javascript
socket.on('online-users', (count) => {
  updateOnlineCountBadge(count);
});
```

### 2. Get City Online Users

**Emit:**
```javascript
socket.emit('get-city-online-users', {
  cityId: 'mumbai'
});
```

**Receive:**
```javascript
socket.on('city-online-users', (data) => {
  console.log(`${data.count} online in ${data.cityId}`);
  console.log('Online users:', data.users);
  // data.users = [{userId, username, full_name, profile_photo_url}, ...]
  
  displayOnlineUsers(data.users);
});
```

### 3. Get Private Chat Online Users

**Emit:**
```javascript
socket.emit('get-chat-online-users', {
  chatId: '507f1f77bcf86cd799439011'
});
```

**Receive:**
```javascript
socket.on('chat-online-users', (data) => {
  console.log(`${data.count} online in chat`);
  displayOnlineParticipants(data.users);
});
```

### 4. Check Specific User Online

**Emit:**
```javascript
socket.emit('check-user-online', {
  userId: '507f1f77bcf86cd799439012'
});
```

**Receive:**
```javascript
socket.on('user-online-status', (data) => {
  console.log(`User ${data.userId} is ${data.isOnline ? 'online' : 'offline'}`);
  updateUserStatusIndicator(data.userId, data.isOnline);
});
```

### 5. User Went Offline

**Receive (broadcast to all):**
```javascript
socket.on('user-offline', (data) => {
  console.log(`${data.username} went offline`);
  updateUserStatusIndicator(data.userId, false);
});
```

### 6. Heartbeat (Connection Health)

**Emit (periodic):**
```javascript
setInterval(() => {
  socket.emit('heartbeat');
}, 30000); // Every 30 seconds
```

**Receive:**
```javascript
socket.on('heartbeat-ack', (data) => {
  console.log('Connection healthy, latency:', Date.now() - data.timestamp);
});
```

---

## Complete React Example

### Setup Socket Context

```javascript
// context/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    
    if (!token) return;

    const newSocket = io('http://localhost:3000', {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to WebSocket');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from WebSocket');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
```

### City Chat Component

```javascript
// components/CityChatWindow.jsx
import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';

const CityChatWindow = ({ cityId, cityName }) => {
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Join city chat
    socket.emit('join-city-chat', { cityId });

    // Get online users
    socket.emit('get-city-online-users', { cityId });

    // Listen for new messages
    socket.on('new-city-message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    // Listen for typing indicators
    socket.on('user-typing-city', (data) => {
      if (data.cityId === cityId) {
        setTypingUsers(prev => new Set(prev).add(data.username));
        setTimeout(() => {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.username);
            return newSet;
          });
        }, 3000);
      }
    });

    // Listen for online users
    socket.on('city-online-users', (data) => {
      if (data.cityId === cityId) {
        setOnlineCount(data.count);
      }
    });

    // Listen for user joined
    socket.on('user-joined-city-chat', (data) => {
      if (data.cityId === cityId) {
        console.log(`${data.full_name} joined`);
      }
    });

    // Cleanup
    return () => {
      socket.emit('leave-city-chat', { cityId });
      socket.off('new-city-message');
      socket.off('user-typing-city');
      socket.off('city-online-users');
      socket.off('user-joined-city-chat');
    };
  }, [socket, isConnected, cityId]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!messageInput.trim() || !socket) return;

    socket.emit('send-city-message', {
      cityId,
      content: messageInput.trim()
    });

    setMessageInput('');
  };

  const handleTyping = () => {
    if (!socket) return;
    socket.emit('city-typing', { cityId });
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <h2>{cityName} Chat</h2>
        <span className="online-badge">
          🟢 {onlineCount} online
        </span>
      </div>

      <div className="messages">
        {messages.map((msg) => (
          <div key={msg._id} className="message">
            <img src={msg.sender_id.profile_photo_url} alt="" />
            <div>
              <strong>{msg.sender_id.full_name}</strong>
              <p>{msg.content}</p>
              <small>{new Date(msg.created_at).toLocaleTimeString()}</small>
            </div>
          </div>
        ))}
      </div>

      {typingUsers.size > 0 && (
        <div className="typing-indicator">
          {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
        </div>
      )}

      <form onSubmit={handleSendMessage}>
        <input
          type="text"
          value={messageInput}
          onChange={(e) => {
            setMessageInput(e.target.value);
            handleTyping();
          }}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default CityChatWindow;
```

---

## Best Practices

### 1. Connection Management

```javascript
// Reconnect on token refresh
const refreshTokenAndReconnect = async () => {
  const newToken = await refreshAccessToken();
  localStorage.setItem('accessToken', newToken);
  
  socket.auth.token = newToken;
  socket.connect();
};
```

### 2. Error Handling

```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error.message);
  
  // Show user-friendly error
  showToast('error', error.message);
  
  // Handle specific errors
  if (error.message.includes('token')) {
    refreshTokenAndReconnect();
  }
});
```

### 3. Cleanup on Component Unmount

```javascript
useEffect(() => {
  // ... socket listeners

  return () => {
    // Always clean up listeners
    socket.off('new-city-message');
    socket.off('user-typing-city');
    // ... other listeners
  };
}, [socket]);
```

### 4. Optimistic UI Updates

```javascript
const handleSendMessage = (content) => {
  // Add message to UI immediately (optimistic)
  const tempMessage = {
    _id: `temp-${Date.now()}`,
    content,
    sender_id: currentUser,
    created_at: new Date(),
    pending: true
  };
  
  setMessages(prev => [...prev, tempMessage]);
  
  // Send to server
  socket.emit('send-city-message', { cityId, content });
  
  // Server will broadcast the real message
  // Remove temp message when real one arrives
};
```

### 5. Rate Limiting Typing Indicators

```javascript
let typingTimer;
const TYPING_DELAY = 3000;

const handleInputChange = (e) => {
  setMessage(e.target.value);
  
  // Emit typing only if not already typing
  if (!typingTimer) {
    socket.emit('city-typing', { cityId });
  }
  
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    socket.emit('city-stop-typing', { cityId });
    typingTimer = null;
  }, TYPING_DELAY);
};
```

---

## Testing WebSocket Events

### Using Socket.io Client in Browser Console

```javascript
// In browser console
const { io } = require('socket.io-client');

const socket = io('http://localhost:3000', {
  auth: { token: 'YOUR_JWT_TOKEN' }
});

socket.on('connect', () => console.log('Connected!'));

socket.emit('join-city-chat', { cityId: 'mumbai' });

socket.on('new-city-message', (msg) => console.log('Message:', msg));
```

### Using Postman or Similar Tools

Postman now supports WebSocket connections! Use it to test events.

---

## Security Considerations

1. **Authentication**: All connections require valid JWT tokens
2. **Authorization**: Users can only join chats they're members of
3. **Validation**: All inputs validated on server side
4. **Rate Limiting**: Consider adding rate limits for message sending
5. **XSS Protection**: Always sanitize message content before displaying

---

## Scaling Considerations

For production with multiple server instances, you'll need Redis adapter:

```bash
npm install socket.io-redis
```

```javascript
// In config/socket.js
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```

---

## Troubleshooting

### Connection Refused
- Check if server is running
- Verify CORS settings
- Check firewall rules

### Authentication Failed
- Verify JWT token is valid
- Check token format in `auth.token`
- Token might be expired, refresh it

### Messages Not Received
- Verify you joined the room
- Check socket connection status
- Look for errors in console

### High Latency
- Check network connection
- Consider using Redis for scaling
- Implement message queuing

---

## Summary

You now have a complete real-time chat system with:
- ✅ City group chats with instant messaging
- ✅ Private chats with real-time updates
- ✅ Typing indicators
- ✅ Online presence tracking
- ✅ Message editing and deletion
- ✅ Read receipts
- ✅ Secure authentication

The REST API remains available for message history, pagination, and fallback scenarios.
