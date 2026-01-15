# API Testing Guide

This guide provides step-by-step instructions to test all API endpoints using cURL or any REST client (Postman, Insomnia, etc.).

## Prerequisites

1. Start the backend server: `npm run dev`
2. Seed cities: `curl -X POST http://localhost:3000/api/cities/seed`

## Testing Flow

### 1. Health Check

```bash
curl http://localhost:3000/health
```

### 2. Seed Cities (Development Only)

```bash
curl -X POST http://localhost:3000/api/cities/seed
```

### 3. Register Users

**User 1 (Alice)**:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "email": "alice@example.com",
    "password": "password123",
    "full_name": "Alice Johnson",
    "phone": "+1234567890"
  }'
```

**User 2 (Bob)**:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "bob",
    "email": "bob@example.com",
    "password": "password123",
    "full_name": "Bob Smith"
  }'
```

**User 3 (Charlie)**:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "charlie",
    "email": "charlie@example.com",
    "password": "password123",
    "full_name": "Charlie Brown"
  }'
```

Save the `accessToken` from each response for subsequent requests.

### 4. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "password123"
  }'
```

### 5. Get User Profile

```bash
curl http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 6. Update Profile

```bash
curl -X PUT http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Alice Updated Johnson",
    "phone": "+1987654321"
  }'
```

### 7. Get All Cities

```bash
curl http://localhost:3000/api/cities
```

### 8. Join Cities

**Alice joins Mumbai**:
```bash
curl -X POST http://localhost:3000/api/cities/mumbai/join \
  -H "Authorization: Bearer ALICE_TOKEN"
```

**Alice joins Goa**:
```bash
curl -X POST http://localhost:3000/api/cities/goa/join \
  -H "Authorization: Bearer ALICE_TOKEN"
```

**Bob joins Mumbai**:
```bash
curl -X POST http://localhost:3000/api/cities/mumbai/join \
  -H "Authorization: Bearer BOB_TOKEN"
```

**Charlie joins Mumbai**:
```bash
curl -X POST http://localhost:3000/api/cities/mumbai/join \
  -H "Authorization: Bearer CHARLIE_TOKEN"
```

### 9. Get City Members

```bash
curl http://localhost:3000/api/cities/mumbai/members \
  -H "Authorization: Bearer ALICE_TOKEN"
```

### 10. Send Messages to City Chat

**Alice sends a message**:
```bash
curl -X POST http://localhost:3000/api/cities/mumbai/chat/messages \
  -H "Authorization: Bearer ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello everyone! Excited to explore Mumbai!"
  }'
```

**Bob replies**:
```bash
curl -X POST http://localhost:3000/api/cities/mumbai/chat/messages \
  -H "Authorization: Bearer BOB_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hi Alice! Welcome to the Mumbai community!"
  }'
```

### 11. Get City Chat Messages

```bash
curl "http://localhost:3000/api/cities/mumbai/chat/messages?page=1&limit=50" \
  -H "Authorization: Bearer ALICE_TOKEN"
```

### 12. Edit Message

First, get the message ID from the previous response, then:

```bash
curl -X PUT http://localhost:3000/api/cities/mumbai/chat/messages/MESSAGE_ID \
  -H "Authorization: Bearer ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello everyone! Super excited to explore Mumbai!"
  }'
```

### 13. Create Private Chat

**Alice creates a private chat with Bob and Charlie**:
```bash
curl -X POST http://localhost:3000/api/chats \
  -H "Authorization: Bearer ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mumbai Trip Planning - December",
    "participant_ids": ["BOB_USER_ID", "CHARLIE_USER_ID"]
  }'
```

Save the `chat_id` from the response.

### 14. Get User's Private Chats

```bash
curl http://localhost:3000/api/chats \
  -H "Authorization: Bearer ALICE_TOKEN"
```

### 15. Get Private Chat Details

```bash
curl http://localhost:3000/api/chats/CHAT_ID \
  -H "Authorization: Bearer ALICE_TOKEN"
```

### 16. Send Message to Private Chat

```bash
curl -X POST http://localhost:3000/api/chats/CHAT_ID/messages \
  -H "Authorization: Bearer ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hey guys! Let'\''s plan our Mumbai trip for December!"
  }'
```

### 17. Get Private Chat Messages

```bash
curl "http://localhost:3000/api/chats/CHAT_ID/messages?page=1&limit=50" \
  -H "Authorization: Bearer BOB_TOKEN"
```

### 18. Add Member to Private Chat

```bash
curl -X POST http://localhost:3000/api/chats/CHAT_ID/members \
  -H "Authorization: Bearer ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_ids": ["ANOTHER_USER_ID"]
  }'
```

### 19. Leave City

```bash
curl -X DELETE http://localhost:3000/api/cities/goa/leave \
  -H "Authorization: Bearer ALICE_TOKEN"
```

### 20. Remove Member from Private Chat

**Alice removes Bob from the private chat**:
```bash
curl -X DELETE http://localhost:3000/api/chats/CHAT_ID/members/BOB_USER_ID \
  -H "Authorization: Bearer ALICE_TOKEN"
```

**Or Bob leaves the chat himself**:
```bash
curl -X DELETE http://localhost:3000/api/chats/CHAT_ID/members/BOB_USER_ID \
  -H "Authorization: Bearer BOB_TOKEN"
```

### 21. Delete Message

```bash
curl -X DELETE http://localhost:3000/api/cities/mumbai/chat/messages/MESSAGE_ID \
  -H "Authorization: Bearer ALICE_TOKEN"
```

### 22. Change Password

```bash
curl -X PUT http://localhost:3000/api/users/change-password \
  -H "Authorization: Bearer ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "current_password": "password123",
    "new_password": "newpassword456"
  }'
```

## Testing Error Cases

### 1. Register with Existing Email

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice2",
    "email": "alice@example.com",
    "password": "password123",
    "full_name": "Alice Duplicate"
  }'
```

Expected: `409 Conflict` - "A user with this email already exists"

### 2. Login with Wrong Password

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "wrongpassword"
  }'
```

Expected: `401 Unauthorized` - "Invalid email or password"

### 3. Access Protected Route Without Token

```bash
curl http://localhost:3000/api/users/profile
```

Expected: `401 Unauthorized` - "No token provided"

### 4. Join City Twice

```bash
# Join Mumbai first time (should succeed)
curl -X POST http://localhost:3000/api/cities/mumbai/join \
  -H "Authorization: Bearer ALICE_TOKEN"

# Join Mumbai second time (should fail)
curl -X POST http://localhost:3000/api/cities/mumbai/join \
  -H "Authorization: Bearer ALICE_TOKEN"
```

Expected: `400 Bad Request` - "You are already a member of this city"

### 5. Send Message to City Without Membership

```bash
# Alice tries to send message to Delhi without joining
curl -X POST http://localhost:3000/api/cities/delhi/chat/messages \
  -H "Authorization: Bearer ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello Delhi!"
  }'
```

Expected: `403 Forbidden` - "You must be a member of this city to send messages"

### 6. Edit Someone Else's Message

```bash
# Alice tries to edit Bob's message
curl -X PUT http://localhost:3000/api/cities/mumbai/chat/messages/BOBS_MESSAGE_ID \
  -H "Authorization: Bearer ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Edited content"
  }'
```

Expected: `403 Forbidden` - "You can only edit your own messages"

### 7. Invalid Input Validation

```bash
# Register with invalid email
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test",
    "email": "invalid-email",
    "password": "pass",
    "full_name": "Test User"
  }'
```

Expected: `400 Bad Request` with validation errors

## Postman Collection

You can import this collection structure into Postman:

1. Create a new environment with variables:
   - `baseUrl`: `http://localhost:3000`
   - `aliceToken`: (set after registration/login)
   - `bobToken`: (set after registration/login)
   - `charlieToken`: (set after registration/login)

2. Use `{{baseUrl}}` and `{{aliceToken}}` in your requests

3. Set up a test script to automatically save tokens:
```javascript
if (pm.response.code === 200 || pm.response.code === 201) {
    const response = pm.response.json();
    if (response.data && response.data.accessToken) {
        pm.environment.set("aliceToken", response.data.accessToken);
    }
}
```

## Notes

- All timestamps are in UTC
- Message IDs and User IDs are MongoDB ObjectIds
- City IDs are string slugs (e.g., 'mumbai', 'delhi')
- Pagination defaults: page=1, limit=50
- Rate limiting: 100 requests per 15 minutes on auth endpoints
