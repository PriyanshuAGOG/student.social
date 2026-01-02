# 📚 APPWRITE BACKEND SERVICES DOCUMENTATION

## Overview

PeerSpark has 50+ backend service methods across 9 main services. This document explains each one and how to test them.

## 1. Authentication Service (`authService`)

**Purpose:** User registration, login, password management, session handling

### Methods:

#### `register(email, password, name)`
- **What it does:** Creates new user account and profile
- **Parameters:**
  - `email` - User email (unique)
  - `password` - Password (min 8 chars)
  - `name` - Display name
- **Returns:** User object
- **Errors:** "User already exists", "Invalid email format"
- **Test:** Click "Sign Up" on login page

```typescript
// Example
await authService.register(
  'user@example.com',
  'SecurePass123!',
  'John Doe'
);
```

#### `login(email, password)`
- **What it does:** Authenticates user and creates session
- **Parameters:**
  - `email` - User email
  - `password` - User password
- **Returns:** Session object
- **Errors:** "Invalid email or password"
- **Test:** Login with registered account

```typescript
// Example
const session = await authService.login(
  'user@example.com',
  'SecurePass123!'
);
```

#### `loginWithOAuth(provider)`
- **What it does:** OAuth login (Google, GitHub, etc.)
- **Parameters:**
  - `provider` - 'google', 'github', 'facebook'
- **Returns:** OAuth session
- **Errors:** "OAuth not configured", "User cancelled"
- **Note:** Requires OAuth setup in Appwrite

```typescript
// Example
await authService.loginWithOAuth('google');
```

#### `getCurrentUser()`
- **What it does:** Gets current logged-in user
- **Returns:** User object or null
- **Errors:** None (returns null if not logged in)
- **Used by:** Auth context on app load

```typescript
// Example
const user = await authService.getCurrentUser();
if (user) {
  console.log('Logged in as:', user.email);
}
```

#### `getCurrentUserProfile()`
- **What it does:** Gets user profile with extended data
- **Returns:** Profile document with bio, avatar, interests, etc.
- **Errors:** "Profile not found" (rare)
- **Used by:** Sidebar, profile pages

```typescript
// Example
const profile = await authService.getCurrentUserProfile();
console.log('Bio:', profile.bio);
console.log('Level:', profile.level);
```

#### `logout()`
- **What it does:** Clears user session and marks offline
- **Returns:** Success response
- **Errors:** "Not logged in"
- **Test:** Click logout button in sidebar

```typescript
// Example
await authService.logout();
// User is redirected to /login
```

#### `changePassword(newPassword, oldPassword)`
- **What it does:** Changes user password
- **Parameters:**
  - `newPassword` - New password
  - `oldPassword` - Current password
- **Returns:** Success response
- **Errors:** "Invalid old password"
- **Test:** Settings page → Change Password

```typescript
// Example
await authService.changePassword(
  'NewPassword123!',
  'OldPassword123!'
);
```

#### `requestPasswordReset(email)`
- **What it does:** Sends password reset email
- **Parameters:**
  - `email` - User email
- **Returns:** Recovery token
- **Errors:** "User not found", "Email not configured"
- **Test:** Forgot Password link on login page

```typescript
// Example
await authService.requestPasswordReset('user@example.com');
// User receives email with reset link
```

#### `confirmPasswordReset(userId, secret, password)`
- **What it does:** Confirms password reset with token
- **Parameters:**
  - `userId` - User ID from reset link
  - `secret` - Secret token from email
  - `password` - New password
- **Returns:** Success response
- **Errors:** "Invalid token", "Token expired"

```typescript
// Example
await authService.confirmPasswordReset(
  'user123',
  'reset_token',
  'NewPassword123!'
);
```

## 2. Profile Service (`profileService`)

**Purpose:** User profile management

### Methods:

#### `getProfile(userId)`
- **What it does:** Gets user profile by ID
- **Parameters:** `userId` - User ID
- **Returns:** Profile document
- **Test:** View another user's profile

```typescript
const profile = await profileService.getProfile('user123');
console.log(profile.name, profile.bio);
```

#### `updateProfile(userId, data)`
- **What it does:** Updates user profile
- **Parameters:**
  - `userId` - User ID
  - `data` - Profile fields to update
- **Returns:** Updated profile
- **Test:** Edit profile in settings

```typescript
await profileService.updateProfile('user123', {
  bio: 'New bio text',
  interests: ['Math', 'Physics'],
});
```

#### `uploadAvatar(userId, file)`
- **What it does:** Uploads user avatar image
- **Parameters:**
  - `userId` - User ID
  - `file` - Image file
- **Returns:** Avatar URL
- **Test:** Profile → Change Avatar

```typescript
const fileInput = document.querySelector('input[type="file"]');
const url = await profileService.uploadAvatar('user123', fileInput.files[0]);
```

#### `getAllProfiles()`
- **What it does:** Gets all user profiles (for directory)
- **Returns:** Array of profile documents
- **Test:** Explore page

```typescript
const profiles = await profileService.getAllProfiles();
profiles.forEach(p => console.log(p.name));
```

## 3. Pod Service (`podService`)

**Purpose:** Study pod management

### Methods:

#### `createPod(name, description, subject, isPublic)`
- **What it does:** Creates new study pod
- **Parameters:**
  - `name` - Pod name
  - `description` - Pod description
  - `subject` - Subject area
  - `isPublic` - Public or private
- **Returns:** Pod document
- **Test:** Click "Create Pod" button

```typescript
const pod = await podService.createPod(
  'Math Study Group',
  'Learning calculus together',
  'Mathematics',
  true
);
```

#### `joinPod(podId)`
- **What it does:** Adds current user to pod
- **Parameters:** `podId` - Pod ID
- **Returns:** Updated pod
- **Test:** Click "Join Pod" on pod page

```typescript
await podService.joinPod('pod123');
// Current user added to members list
```

#### `leavePod(podId)`
- **What it does:** Removes current user from pod
- **Parameters:** `podId` - Pod ID
- **Returns:** Updated pod
- **Test:** Click "Leave Pod" on pod page

```typescript
await podService.leavePod('pod123');
```

#### `getUserPods()`
- **What it does:** Gets pods of current user
- **Returns:** Array of pod documents
- **Test:** Pods page

```typescript
const myPods = await podService.getUserPods();
```

#### `getAllPods()`
- **What it does:** Gets all public pods (for discovery)
- **Returns:** Array of pod documents
- **Test:** Explore page → Pods section

```typescript
const allPods = await podService.getAllPods();
```

#### `getPodDetails(podId)`
- **What it does:** Gets single pod with members
- **Parameters:** `podId` - Pod ID
- **Returns:** Pod document with member details
- **Test:** Click on a pod

```typescript
const pod = await podService.getPodDetails('pod123');
console.log('Members:', pod.members.length);
```

## 4. Chat Service (`chatService`)

**Purpose:** Real-time messaging

### Methods:

#### `sendMessage(roomId, content, type)`
- **What it does:** Sends message to chat room
- **Parameters:**
  - `roomId` - Chat room ID
  - `content` - Message text
  - `type` - 'text', 'image', 'file'
- **Returns:** Message document
- **Test:** Type and send message in chat

```typescript
const msg = await chatService.sendMessage(
  'room123',
  'Hello everyone!',
  'text'
);
```

#### `getMessages(roomId, limit, offset)`
- **What it does:** Gets messages from room
- **Parameters:**
  - `roomId` - Chat room ID
  - `limit` - Number of messages (default 50)
  - `offset` - Skip first N messages
- **Returns:** Array of message documents
- **Test:** Load chat messages

```typescript
const messages = await chatService.getMessages('room123', 50);
```

#### `subscribeToMessages(roomId, callback)`
- **What it does:** Real-time message subscription
- **Parameters:**
  - `roomId` - Chat room ID
  - `callback` - Function called when message arrives
- **Returns:** Unsubscribe function
- **Test:** Real-time chat updates

```typescript
const unsubscribe = chatService.subscribeToMessages(
  'room123',
  (message) => {
    console.log('New message:', message.content);
  }
);
// Call unsubscribe() to stop listening
```

#### `uploadAttachment(roomId, file)`
- **What it does:** Uploads file to chat
- **Parameters:**
  - `roomId` - Chat room ID
  - `file` - File to upload
- **Returns:** File URL
- **Test:** Click attachment button in chat

```typescript
const url = await chatService.uploadAttachment(
  'room123',
  fileInput.files[0]
);
```

#### `getOrCreateDirectRoom(userId1, userId2)`
- **What it does:** Creates or gets DM room between users
- **Parameters:**
  - `userId1` - First user ID
  - `userId2` - Second user ID
- **Returns:** Room document
- **Test:** Start direct message with user

```typescript
const room = await chatService.getOrCreateDirectRoom(
  'user1',
  'user2'
);
```

#### `getUserChatRooms()`
- **What it does:** Gets all chat rooms for user
- **Returns:** Array of room documents
- **Test:** Chat page sidebar

```typescript
const rooms = await chatService.getUserChatRooms();
```

## 5. Feed Service (`feedService`)

**Purpose:** Social feed and posts

### Methods:

#### `createPost(content, type, podId, imageUrl)`
- **What it does:** Creates new post
- **Parameters:**
  - `content` - Post text
  - `type` - 'text', 'question', 'resource'
  - `podId` - Optional pod ID
  - `imageUrl` - Optional image URL
- **Returns:** Post document
- **Test:** Create Post modal

```typescript
const post = await feedService.createPost(
  'I just solved this hard problem!',
  'achievement',
  'pod123',
  null
);
```

#### `getFeedPosts(limit, offset)`
- **What it does:** Gets feed posts for user
- **Parameters:**
  - `limit` - Number of posts (default 20)
  - `offset` - Skip first N posts
- **Returns:** Array of post documents
- **Test:** Feed page

```typescript
const posts = await feedService.getFeedPosts(20, 0);
```

#### `toggleLike(postId)`
- **What it does:** Likes or unlikes post
- **Parameters:** `postId` - Post ID
- **Returns:** Updated post
- **Test:** Click heart icon on post

```typescript
await feedService.toggleLike('post123');
// Post likes count updated
```

#### `subscribeToFeed(callback)`
- **What it does:** Real-time feed subscription
- **Parameters:** `callback` - Called when posts change
- **Returns:** Unsubscribe function
- **Test:** Auto-refresh feed with new posts

```typescript
const unsubscribe = feedService.subscribeToFeed((posts) => {
  console.log('Feed updated with', posts.length, 'posts');
});
```

## 6. Resource Service (`resourceService`)

**Purpose:** Study material management

### Methods:

#### `uploadResource(title, file, podId, description)`
- **What it does:** Uploads study resource
- **Parameters:**
  - `title` - Resource title
  - `file` - File to upload
  - `podId` - Pod ID
  - `description` - Resource description
- **Returns:** Resource document
- **Test:** Upload button in pod

```typescript
const resource = await resourceService.uploadResource(
  'Chapter 5 Notes',
  fileInput.files[0],
  'pod123',
  'Key concepts from lecture'
);
```

#### `getResources(podId, limit, offset)`
- **What it does:** Gets resources from pod
- **Parameters:**
  - `podId` - Pod ID
  - `limit` - Number of resources
  - `offset` - Skip first N
- **Returns:** Array of resource documents
- **Test:** Resources tab in pod

```typescript
const resources = await resourceService.getResources('pod123', 20);
```

#### `downloadResource(resourceId)`
- **What it does:** Downloads resource file
- **Parameters:** `resourceId` - Resource ID
- **Returns:** Download initiated
- **Test:** Click download button

```typescript
await resourceService.downloadResource('resource123');
// File download starts
```

## 7. Calendar Service (`calendarService`)

**Purpose:** Study schedule management

### Methods:

#### `createEvent(title, startTime, endTime, podId)`
- **What it does:** Creates calendar event
- **Parameters:**
  - `title` - Event title
  - `startTime` - ISO timestamp
  - `endTime` - ISO timestamp
  - `podId` - Optional pod ID
- **Returns:** Event document
- **Test:** Calendar → New Event

```typescript
const event = await calendarService.createEvent(
  'Math Study Session',
  '2024-01-20T10:00:00Z',
  '2024-01-20T11:00:00Z',
  'pod123'
);
```

#### `getUserEvents()`
- **What it does:** Gets user's calendar events
- **Returns:** Array of event documents
- **Test:** Calendar page

```typescript
const events = await calendarService.getUserEvents();
```

#### `updateEvent(eventId, data)`
- **What it does:** Updates event details
- **Parameters:**
  - `eventId` - Event ID
  - `data` - Fields to update
- **Returns:** Updated event
- **Test:** Edit event

```typescript
await calendarService.updateEvent('event123', {
  title: 'Updated Title',
  startTime: '2024-01-20T14:00:00Z',
});
```

#### `deleteEvent(eventId)`
- **What it does:** Deletes event
- **Parameters:** `eventId` - Event ID
- **Returns:** Success response
- **Test:** Delete event button

```typescript
await calendarService.deleteEvent('event123');
```

## 8. Notification Service (`notificationService`)

**Purpose:** User notifications

### Methods:

#### `createNotification(userId, title, message, type, actionUrl)`
- **What it does:** Creates notification for user
- **Parameters:**
  - `userId` - Target user ID
  - `title` - Notification title
  - `message` - Notification message
  - `type` - 'mention', 'like', 'join', 'message'
  - `actionUrl` - URL to navigate to
- **Returns:** Notification document
- **Used by:** System when events occur

```typescript
// Created by system when someone likes post
await notificationService.createNotification(
  'user123',
  'John liked your post',
  'John liked your achievement post',
  'like',
  '/app/feed/post456'
);
```

#### `getUserNotifications()`
- **What it does:** Gets user's notifications
- **Returns:** Array of notification documents
- **Test:** Notifications icon in header

```typescript
const notifs = await notificationService.getUserNotifications();
```

#### `markAsRead(notificationId)`
- **What it does:** Marks notification as read
- **Parameters:** `notificationId` - Notification ID
- **Returns:** Updated notification
- **Test:** Click notification

```typescript
await notificationService.markAsRead('notif123');
```

#### `markAllAsRead()`
- **What it does:** Marks all notifications as read
- **Returns:** Success response
- **Test:** Click "Mark all as read"

```typescript
await notificationService.markAllAsRead();
```

#### `subscribeToNotifications(callback)`
- **What it does:** Real-time notification subscription
- **Parameters:** `callback` - Called on new notification
- **Returns:** Unsubscribe function
- **Test:** Real-time notification badge

```typescript
const unsubscribe = notificationService.subscribeToNotifications(
  (notification) => {
    console.log('New notification:', notification.title);
  }
);
```

## 9. Jitsi Service (`jitsiService`)

**Purpose:** Video calling for pods

### Methods:

#### `generateMeetingUrl(podId, userName)`
- **What it does:** Generates Jitsi meeting URL
- **Parameters:**
  - `podId` - Pod ID
  - `userName` - User's display name
- **Returns:** Meeting URL
- **Test:** Click "Start Meeting" in pod

```typescript
const url = await jitsiService.generateMeetingUrl('pod123', 'John');
// URL: https://meet.jitsi/PeerSparkpod123
```

#### `createPodMeeting(podId, title)`
- **What it does:** Creates scheduled pod meeting
- **Parameters:**
  - `podId` - Pod ID
  - `title` - Meeting title
- **Returns:** Meeting document
- **Test:** Schedule meeting in pod

```typescript
const meeting = await jitsiService.createPodMeeting(
  'pod123',
  'Chapter 5 Study Session'
);
```

## Testing Checklist

After setting up permissions, test each feature:

### Authentication
- [ ] Register new account
- [ ] Login with credentials
- [ ] Logout
- [ ] Can't access /app without login
- [ ] Change password
- [ ] Request password reset

### Profile
- [ ] View own profile
- [ ] Edit profile
- [ ] Upload avatar
- [ ] View other user profiles

### Pods
- [ ] Create pod
- [ ] Join pod
- [ ] See pod members
- [ ] Leave pod
- [ ] Discover pods

### Chat
- [ ] Send message in pod chat
- [ ] See message history
- [ ] Upload file to chat
- [ ] Direct message user
- [ ] Real-time message updates

### Feed
- [ ] Create post
- [ ] Like post
- [ ] See own posts
- [ ] Real-time feed updates
- [ ] See other users' posts

### Resources
- [ ] Upload resource
- [ ] Download resource
- [ ] See resource list

### Calendar
- [ ] Create event
- [ ] View calendar
- [ ] Edit event
- [ ] Delete event

### Notifications
- [ ] Get notified on mention
- [ ] Get notified on like
- [ ] Mark notification as read
- [ ] Real-time notifications

### Jitsi
- [ ] Start video meeting
- [ ] Join meeting from link

## Error Handling

All service methods throw errors. Handle them:

```typescript
try {
  await podService.createPod(...);
} catch (error) {
  if (error.message.includes('unauthorized')) {
    // User not authenticated
  } else if (error.message.includes('invalid')) {
    // Invalid input
  } else {
    // Other error
    console.error('Error:', error.message);
  }
}
```

## Performance Tips

- Use `limit` and `offset` for pagination
- Subscribe only when needed, unsubscribe when done
- Cache user profile after first load
- Load feed posts on scroll (infinite scroll)

---

For more help, see:
- APPWRITE_DEBUG_GUIDE.md - Debugging
- APPWRITE_CRITICAL_FIX.md - Initial setup
- COMPLETE_SETUP_SUMMARY.md - Complete walkthrough
