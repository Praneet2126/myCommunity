# Database Schema Documentation

Complete documentation of the MongoDB schema for myCommunity backend.

## Overview

The database uses 7 collections with relationships managed through references (ObjectIds and string IDs).

## Collections

### 1. Users

Stores user account information and authentication details.

**Collection Name**: `users`

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  username: "johndoe",
  email: "john@example.com",
  password: "$2a$10$...", // bcrypt hashed
  phone: "+1234567890",
  full_name: "John Doe",
  profile_photo_url: "https://example.com/photo.jpg",
  role: "user", // enum: ['user', 'city_admin', 'super_admin']
  is_verified: false,
  is_active: true,
  last_login: ISODate("2026-01-15T10:30:00Z"),
  password_reset_token: null,
  password_reset_expires: null,
  created_at: ISODate("2026-01-01T00:00:00Z"),
  updated_at: ISODate("2026-01-15T10:30:00Z")
}
```

**Indexes**:
- `email`: unique
- `username`: unique

**Validations**:
- `username`: 3-20 chars, alphanumeric + underscore only
- `email`: valid email format
- `password`: min 6 chars (stored as bcrypt hash)
- `phone`: E.164 format (optional)
- `full_name`: required, max 100 chars

---

### 2. Cities

Travel destination communities that users can join.

**Collection Name**: `cities`

```javascript
{
  _id: "mumbai", // String ID for SEO-friendly URLs
  name: "Mumbai",
  displayName: "Mumbai",
  description: "The City of Dreams - Financial capital of India",
  image: "https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=800",
  tagline: "Experience the vibrant energy of India's financial capital",
  is_active: true,
  member_count: 42,
  created_at: ISODate("2026-01-01T00:00:00Z"),
  updated_at: ISODate("2026-01-15T10:30:00Z")
}
```

**Indexes**:
- `is_active`: 1

**Validations**:
- `_id`: string, custom (e.g., 'mumbai', 'delhi')
- `name`: required
- `description`: max 500 chars
- `tagline`: max 200 chars

**Pre-seeded Cities**:
- mumbai, delhi, bangalore, goa, jaipur

---

### 3. City Memberships

Many-to-many relationship between users and cities.

**Collection Name**: `citymemberships`

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439012"),
  user_id: ObjectId("507f1f77bcf86cd799439011"), // ref: Users
  city_id: "mumbai", // ref: Cities
  role: "member", // enum: ['member', 'moderator', 'admin']
  joined_at: ISODate("2026-01-10T14:20:00Z"),
  last_active_at: ISODate("2026-01-15T10:30:00Z"),
  notifications_enabled: true
}
```

**Indexes**:
- `{user_id: 1, city_id: 1}`: unique compound index
- `{city_id: 1, joined_at: -1}`: for member lists

**Business Rules**:
- A user can join multiple cities
- A user can only have one membership per city
- When a user joins, city's `member_count` increments
- When a user leaves, city's `member_count` decrements

---

### 4. City Chats

One main group chat per city.

**Collection Name**: `citychats`

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439013"),
  city_id: "mumbai", // ref: Cities, unique
  last_message_at: ISODate("2026-01-15T10:30:00Z"),
  created_at: ISODate("2026-01-01T00:00:00Z")
}
```

**Indexes**:
- `city_id`: unique

**Business Rules**:
- Automatically created when a city is seeded
- One chat per city (1:1 relationship)
- Only city members can view and send messages

---

### 5. Private Chats

User-created private group chats.

**Collection Name**: `privatechats`

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439014"),
  name: "Mumbai Trip Planning - December",
  created_by: ObjectId("507f1f77bcf86cd799439011"), // ref: Users
  avatar: "https://example.com/group-avatar.jpg",
  last_message_at: ISODate("2026-01-15T10:30:00Z"),
  created_at: ISODate("2026-01-12T08:00:00Z"),
  updated_at: ISODate("2026-01-15T10:30:00Z")
}
```

**Indexes**:
- `created_by`: 1
- `last_message_at`: -1 (for sorting)

**Validations**:
- `name`: optional, max 100 chars

**Business Rules**:
- Creator becomes admin automatically
- Must have at least 2 participants (creator + 1 other)
- Admins can add/remove members
- Members can leave voluntarily

---

### 6. Private Chat Participants

Many-to-many relationship for private chat membership.

**Collection Name**: `privatechatparticipants`

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439015"),
  chat_id: ObjectId("507f1f77bcf86cd799439014"), // ref: PrivateChats
  user_id: ObjectId("507f1f77bcf86cd799439011"), // ref: Users
  role: "admin", // enum: ['admin', 'member']
  joined_at: ISODate("2026-01-12T08:00:00Z"),
  last_read_at: ISODate("2026-01-15T10:25:00Z"),
  notifications_enabled: true
}
```

**Indexes**:
- `{chat_id: 1, user_id: 1}`: unique compound index
- `user_id`: 1 (for finding user's chats)

**Business Rules**:
- Chat creator is automatically admin
- Admins can add members
- Admins can remove other members
- Any member can leave (remove themselves)
- `last_read_at` used for unread message counts

---

### 7. Messages

Unified message collection for both city and private chats.

**Collection Name**: `messages`

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439016"),
  sender_id: ObjectId("507f1f77bcf86cd799439011"), // ref: Users
  chat_type: "city", // enum: ['city', 'private']
  chat_id: ObjectId("507f1f77bcf86cd799439013"), // ref: CityChats or PrivateChats
  chat_ref: "CityChat", // enum: ['CityChat', 'PrivateChat']
  content: "Hello everyone! Excited to explore Mumbai!",
  message_type: "text", // enum: ['text', 'image', 'file', 'system']
  media_url: null,
  reply_to: null, // ObjectId ref to another Message
  is_edited: false,
  is_deleted: false,
  created_at: ISODate("2026-01-15T10:30:00Z"),
  updated_at: ISODate("2026-01-15T10:30:00Z")
}
```

**Indexes**:
- `{chat_type: 1, chat_id: 1, created_at: -1}`: for fetching messages
- `sender_id`: 1 (for user's messages)

**Validations**:
- `content`: required, max 5000 chars
- `message_type`: text, image, file, or system

**Business Rules**:
- `chat_ref` is automatically set based on `chat_type`
- Soft delete: `is_deleted` = true, `content` = "[Message deleted]"
- Users can only edit/delete their own messages
- `is_edited` flag set to true when message is edited
- When message is sent, updates `last_message_at` in chat

---

## Relationships Diagram

```
Users (1) ──────< (M) CityMemberships (M) >────── (1) Cities
  │                                                    │
  │                                                    │
  │                                                    │ (1:1)
  │                                                    │
  │                                                 CityChats
  │                                                    │
  │                                                    │
  │                                                    │
  │                                                    ▼
  │                                                 Messages
  │                                                    ▲
  │                                                    │
  │                                                    │
  │                                                    │
  │                                                PrivateChats
  │                                                    │
  │                                                    │
  └──< (M) PrivateChatParticipants (M) >──────────────┘
```

## Relationship Details

### User ↔ City (Many-to-Many)

- **Through**: CityMemberships
- **Cascade**: When user is deleted, remove their memberships
- **Business Rule**: User can join multiple cities

### City ↔ CityChat (One-to-One)

- **Direct**: city_id in CityChat
- **Cascade**: When city is deleted, delete its chat
- **Business Rule**: Each city has exactly one group chat

### User ↔ PrivateChat (Many-to-Many)

- **Through**: PrivateChatParticipants
- **Cascade**: When user is deleted, remove from participants
- **Business Rule**: User can be in multiple private chats

### Message ↔ Chat (Polymorphic)

- **Type**: Polymorphic association
- **Fields**: chat_type, chat_id, chat_ref
- **Cascade**: When chat is deleted, messages can be kept or deleted
- **Business Rule**: Message belongs to either CityChat or PrivateChat

## Query Examples

### Get all cities a user is a member of

```javascript
db.citymemberships.aggregate([
  { $match: { user_id: ObjectId("USER_ID") } },
  { $lookup: {
      from: "cities",
      localField: "city_id",
      foreignField: "_id",
      as: "city"
  }},
  { $unwind: "$city" }
])
```

### Get all messages in a city chat with sender info

```javascript
db.messages.aggregate([
  { $match: { 
      chat_type: "city",
      chat_id: ObjectId("CHAT_ID"),
      is_deleted: false
  }},
  { $lookup: {
      from: "users",
      localField: "sender_id",
      foreignField: "_id",
      as: "sender"
  }},
  { $unwind: "$sender" },
  { $sort: { created_at: -1 } },
  { $limit: 50 }
])
```

### Get user's private chats with last message

```javascript
db.privatechatparticipants.aggregate([
  { $match: { user_id: ObjectId("USER_ID") } },
  { $lookup: {
      from: "privatechats",
      localField: "chat_id",
      foreignField: "_id",
      as: "chat"
  }},
  { $unwind: "$chat" },
  { $sort: { "chat.last_message_at": -1 } }
])
```

### Count unread messages in a private chat

```javascript
db.messages.countDocuments({
  chat_type: "private",
  chat_id: ObjectId("CHAT_ID"),
  created_at: { $gt: ISODate("LAST_READ_AT") },
  is_deleted: false
})
```

## Performance Considerations

### Indexes

All critical queries are covered by indexes:
- User lookups by email/username: O(log n)
- City membership checks: O(log n)
- Message fetching: O(log n)
- User's chats: O(log n)

### Caching Opportunities

Consider caching:
- City list (rarely changes)
- User profile data
- City member counts
- Recent messages per chat

### Pagination

All message endpoints support pagination:
- Default: 50 messages per page
- Max: 100 messages per page
- Sort: created_at descending (newest first)

## Data Integrity

### Constraints

1. **Unique Constraints**:
   - User email and username
   - City membership per user per city
   - Private chat participation per user per chat

2. **Required Fields**:
   - All user authentication fields
   - Message content and sender
   - Chat type and reference

3. **Referential Integrity**:
   - Managed at application level
   - Use transactions for critical operations

### Soft Deletes

Messages use soft delete:
- `is_deleted: true`
- Content replaced with "[Message deleted]"
- Preserves conversation flow
- Can be hard deleted later for GDPR compliance

## Backup Strategy

Recommended backup approach:
1. Daily full backups
2. Hourly incremental backups
3. Point-in-time recovery enabled
4. Test restore process monthly

## Migration Notes

When schema changes are needed:
1. Create migration script
2. Test on staging environment
3. Backup production database
4. Run migration during low-traffic period
5. Verify data integrity
6. Monitor application logs

## Future Enhancements

Planned schema additions:
- Events collection (for city events)
- Notifications collection
- AI recommendations collection
- File uploads metadata
- Message reactions
- User blocking/reporting
