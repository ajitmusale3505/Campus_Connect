# MongoDB Atlas Integration Guide

This project uses MongoDB Atlas for data storage with Mongoose ODM.

## Setup

### 1. Environment Variables

The MongoDB connection string is stored in `.env.local`:

```env
MONGODB_URI=mongodb+srv://vishalroad2tech_db_user:vishal@123@p1.qshu0ys.mongodb.net/campusconnect?retryWrites=true&w=majority
```

**Note:** If you need a new API key/connection string, create one in MongoDB Atlas:
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Navigate to Database Access → Add New Database User
3. Create credentials and whitelist your IP address
4. Get the connection string from Database → Connect → Connect your application

### 2. Database Models

The following models are available in `src/models/`:

- **User** - User accounts (students, teachers, HOD, principal)
- **Attendance** - Student attendance records
- **Mark** - Student marks/grades
- **Doubt** - Student doubts/questions with replies
- **ChatMessage** - Chat room messages
- **Notification** - User notifications
- **LibraryResource** - Library books and resources
- **Material** - Teaching materials uploaded by teachers

## API Endpoints

### Users API (`/api/users`)

**GET** - Fetch users
```javascript
// Get all users
GET /api/users

// Get user by ID
GET /api/users?id=USER_ID

// Get user by Firebase UID
GET /api/users?firebaseUid=FIREBASE_UID

// Get user by email
GET /api/users?email=user@example.com
```

**POST** - Create user
```javascript
POST /api/users
Body: {
  firebaseUid: "string",
  name: "string",
  email: "string",
  role: "student" | "teacher" | "hod" | "principal",
  avatarUrl: "string",
  department: "string"
}
```

**PUT** - Update user
```javascript
PUT /api/users
Body: {
  id: "USER_ID",
  name: "Updated Name",
  // other fields to update
}
```

**DELETE** - Delete user
```javascript
DELETE /api/users?id=USER_ID
```

### Attendance API (`/api/attendance`)

**GET** - Fetch attendance
```javascript
// Get all attendance
GET /api/attendance

// Get user's attendance
GET /api/attendance?userId=USER_ID

// Get attendance for date range
GET /api/attendance?userId=USER_ID&startDate=2024-01-01&endDate=2024-12-31
```

**POST** - Create attendance
```javascript
POST /api/attendance
Body: {
  userId: "USER_ID",
  date: "2024-01-01",
  status: "present" | "absent" | "late",
  subject: "string",
  remarks: "string"
}
```

### Marks API (`/api/marks`)

**GET** - Fetch marks
```javascript
GET /api/marks?userId=USER_ID
GET /api/marks?userId=USER_ID&subject=Mathematics
GET /api/marks?userId=USER_ID&semester=Fall2024
```

**POST** - Create mark
```javascript
POST /api/marks
Body: {
  userId: "USER_ID",
  assessment: "Mid-Term",
  subject: "Mathematics",
  score: 85,
  total: 100,
  semester: "Fall2024"
}
```

### Doubts API (`/api/doubts`)

**GET** - Fetch doubts
```javascript
GET /api/doubts
GET /api/doubts?studentId=USER_ID
GET /api/doubts?isResolved=false
```

**POST** - Create doubt
```javascript
POST /api/doubts
Body: {
  studentId: "USER_ID",
  text: "What is the difference between...",
  subject: "Computer Science"
}
```

**PUT** - Update doubt (add reply, upvote, resolve)
```javascript
// Add reply
PUT /api/doubts
Body: {
  id: "DOUBT_ID",
  action: "addReply",
  reply: {
    authorId: "USER_ID",
    text: "Here's the answer...",
    timestamp: new Date()
  }
}

// Upvote
PUT /api/doubts
Body: {
  id: "DOUBT_ID",
  action: "upvote",
  userId: "USER_ID"
}

// Resolve
PUT /api/doubts
Body: {
  id: "DOUBT_ID",
  action: "resolve",
  resolvedBy: "TEACHER_ID"
}
```

### Chat API (`/api/chat`)

**GET** - Fetch messages
```javascript
GET /api/chat?roomId=ROOM_ID
GET /api/chat?roomId=ROOM_ID&limit=50
```

**POST** - Create message
```javascript
POST /api/chat
Body: {
  roomId: "ROOM_ID",
  authorId: "USER_ID",
  text: "Message text",
  attachments: [],
  isAnonymous: false
}
```

**PUT** - Update message (add reply, upvote)
```javascript
// Add reply
PUT /api/chat
Body: {
  id: "MESSAGE_ID",
  action: "addReply",
  reply: {
    authorId: "USER_ID",
    text: "Reply text",
    attachments: [],
    timestamp: new Date()
  }
}

// Upvote
PUT /api/chat
Body: {
  id: "MESSAGE_ID",
  action: "upvote",
  userId: "USER_ID"
}
```

### Notifications API (`/api/notifications`)

**GET** - Fetch notifications
```javascript
GET /api/notifications?userId=USER_ID
GET /api/notifications?userId=USER_ID&unreadOnly=true
GET /api/notifications?userId=USER_ID&limit=20
```

**POST** - Create notification
```javascript
POST /api/notifications
Body: {
  userId: "USER_ID",
  text: "You have a new assignment",
  type: "info" | "warning" | "success" | "error",
  link: "/assignments/123"
}
```

**PUT** - Mark as read
```javascript
PUT /api/notifications
Body: {
  id: "NOTIFICATION_ID",
  read: true
}
```

### Library API (`/api/library`)

**GET** - Fetch resources
```javascript
GET /api/library
GET /api/library?type=pdf
GET /api/library?subject=Mathematics
GET /api/library?search=calculus
GET /api/library?tags=physics,quantum
```

**POST** - Create resource
```javascript
POST /api/library
Body: {
  title: "Introduction to Algorithms",
  author: "Thomas Cormen",
  type: "pdf" | "video" | "paper" | "book",
  tags: ["algorithms", "computer-science"],
  url: "https://...",
  subject: "Computer Science",
  uploadedBy: "USER_ID"
}
```

**PUT** - Update resource
```javascript
// Increment downloads
PUT /api/library
Body: {
  id: "RESOURCE_ID",
  action: "incrementDownloads"
}
```

### Materials API (`/api/materials`)

**GET** - Fetch materials
```javascript
GET /api/materials
GET /api/materials?teacherId=TEACHER_ID
GET /api/materials?subject=Physics
GET /api/materials?class=CS101
GET /api/materials?search=quantum
```

**POST** - Create material
```javascript
POST /api/materials
Body: {
  teacherId: "TEACHER_ID",
  title: "Lecture Notes - Week 1",
  subject: "Physics",
  description: "Introduction to quantum mechanics",
  fileUrl: "https://...",
  fileType: "pdf" | "ppt" | "doc" | "video",
  class: "PHY101",
  semester: "Spring2024"
}
```

## Usage Example

```typescript
// Example: Fetch user by Firebase UID
const response = await fetch('/api/users?firebaseUid=abc123');
const { data } = await response.json();

// Example: Create attendance record
const response = await fetch('/api/attendance', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: '507f1f77bcf86cd799439011',
    date: new Date(),
    status: 'present',
    subject: 'Mathematics'
  })
});

// Example: Add reply to doubt
const response = await fetch('/api/doubts', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 'doubt_id',
    action: 'addReply',
    reply: {
      authorId: 'teacher_id',
      text: 'Here is the answer...',
      timestamp: new Date()
    }
  })
});
```

## Database Connection

The database connection is managed in `src/lib/mongodb.ts` and automatically:
- Caches connections in development
- Reconnects on failures
- Handles connection pooling

## Testing the Connection

Start the development server and the MongoDB connection will be established automatically when you make your first API call.

```bash
npm run dev
```

Visit any API endpoint to test:
```
http://localhost:3000/api/users
```

## Security Notes

1. **Never commit `.env.local`** to version control
2. Store sensitive credentials in environment variables
3. Use MongoDB Atlas IP whitelisting for production
4. Implement proper authentication middleware for protected routes
5. Validate all input data before saving to database

## Additional Configuration

If you need a new MongoDB connection string:

1. **Create a new database user** in MongoDB Atlas
2. **Update the connection string** format:
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
   ```
3. **Add to `.env.local`**:
   ```
   MONGODB_URI=your_new_connection_string
   ```

## Troubleshooting

- **Connection Timeout**: Check if your IP is whitelisted in MongoDB Atlas
- **Authentication Failed**: Verify username and password in connection string
- **Database Not Found**: The database will be created automatically on first write operation
