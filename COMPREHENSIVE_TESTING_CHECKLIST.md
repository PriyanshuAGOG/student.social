# Comprehensive Operation & Notification Testing Checklist

## Status: Ready for Testing
All notification enhancements have been implemented. Run schema update first, then test each operation.

## Pre-Test Setup

### 1. Update Schema
```bash
node scripts/update-schema.js
```

**Expected**: Schema updated with notification fields:
- `actorId` (string, 255)
- `actorName` (string, 255)
- `actorAvatar` (string, 500)
- `metadata` (string, 5000)

### 2. Start Development Server
```bash
npm run dev
```

### 3. Create Test Accounts
- User A: Primary tester
- User B: Secondary for interaction testing
- User C: Third member for pod interactions

---

## Core CRUD Operations

### Posts

#### ✅ Create Post
**Test Steps**:
1. Login as User A
2. Navigate to feed/pod
3. Create new post with text content
4. Create post with image
5. Create post in pod

**Expected**:
- Post appears in feed
- Post saved to database
- ✨ **NEW**: If posted in pod, all pod members (except author) receive notification:
  - Type: `pod_post`
  - Title: "New Pod Post"
  - Message: "[User] posted in [Pod Name]"
  - Metadata: `postId`, `podId`, `actorId`, `actorName`, `actorAvatar`

**Verify**:
- [ ] Post created successfully
- [ ] Images uploaded and displayed
- [ ] Pod post visible to pod members
- [ ] Pod members notified (bell icon shows unread count)

#### ✅ Edit Post
**Test Steps**:
1. As User A, find own post
2. Click edit
3. Modify content
4. Save changes

**Expected**:
- Post content updated
- `updatedAt` timestamp updated
- `isEdited` flag set to true

**Verify**:
- [ ] Edited content appears
- [ ] "Edited" indicator visible

#### ✅ Delete Post
**Test Steps**:
1. As User A, find own post
2. Click delete
3. Confirm deletion

**Expected**:
- Post removed from feed
- Post document deleted from database
- Associated comments deleted (if implemented)
- Associated notifications remain (for history)

**Verify**:
- [ ] Post no longer visible
- [ ] No errors in console

---

### Interactions

#### ✅ Like Post
**Test Steps**:
1. Login as User B
2. Find post by User A
3. Click like button

**Expected**:
- Like count increments
- User B added to `likedBy` array
- ✨ **EXISTING**: User A receives notification:
  - Type: `like`
  - Title: "New Like"
  - Message: "[User B] liked your post"
  - Metadata: `postId`, `actorId`, `actorName`, `actorAvatar`

**Verify**:
- [ ] Like count updates
- [ ] User A notified (bell icon)
- [ ] Unlike works (removes notification? - check behavior)

#### ✅ Comment on Post
**Test Steps**:
1. Login as User B
2. Find post by User A
3. Write comment and submit

**Expected**:
- Comment appears below post
- Comment count increments
- ✨ **EXISTING**: User A receives notification:
  - Type: `comment`
  - Title: "New Comment"
  - Message: "[User B] commented on your post"
  - Metadata: `postId`, `commentId`, `actorId`, `actorName`, `actorAvatar`

**Verify**:
- [ ] Comment visible
- [ ] User A notified
- [ ] Comment author info correct

#### ✅ Save/Bookmark Post
**Test Steps**:
1. Login as User B
2. Find post by User A
3. Click save/bookmark icon

**Expected**:
- Post added to saved collection
- Save count increments (if visible)
- ✨ **NEW**: User A receives notification:
  - Type: `save`
  - Title: "Post Saved"
  - Message: "[User B] saved your post"
  - Metadata: `postId`, `actorId`, `actorName`, `actorAvatar`

**Verify**:
- [ ] Post appears in "Saved Posts"
- [ ] User A notified
- [ ] Unsave works (removes notification? - check behavior)

---

### User Interactions

#### ✅ Follow User
**Test Steps**:
1. Login as User B
2. Navigate to User A's profile
3. Click follow button

**Expected**:
- User B added to User A's followers
- User A added to User B's following
- Follower/following counts update
- ✨ **EXISTING**: User A receives notification:
  - Type: `follow`
  - Title: "New Follower"
  - Message: "[User B] started following you"
  - Metadata: `actorId`, `actorName`, `actorAvatar`

**Verify**:
- [ ] Follow status updates
- [ ] Counts accurate
- [ ] User A notified
- [ ] Unfollow works

---

### Pods

#### ✅ Create Pod
**Test Steps**:
1. Login as User A
2. Navigate to Pods section
3. Fill pod creation form
4. Submit

**Expected**:
- Pod created in database
- User A set as creator
- User A added to members array
- Pod visible in browse/explore

**Verify**:
- [ ] Pod appears in listing
- [ ] Pod accessible
- [ ] Creator can access admin features

#### ✅ Join Pod
**Test Steps**:
1. Login as User B
2. Browse pods
3. Find User A's pod
4. Click join

**Expected**:
- User B added to pod members
- Member count increments
- ✨ **EXISTING**: User A (creator) receives notification:
  - Type: `pod_join`
  - Title: "New Member"
  - Message: "[User B] joined [Pod Name]"
  - Metadata: `podId`, `actorId`, `actorName`, `actorAvatar`

**Verify**:
- [ ] User B appears in members list
- [ ] Pod creator notified
- [ ] User B can see pod posts

#### ✅ Leave Pod
**Test Steps**:
1. As User B, navigate to joined pod
2. Click leave pod
3. Confirm

**Expected**:
- User B removed from members
- Member count decrements
- User B loses access to pod-only content

**Verify**:
- [ ] User removed from pod
- [ ] No longer sees pod posts

---

### Calendar/Events

#### ✅ Create Event (Personal)
**Test Steps**:
1. Login as User A
2. Navigate to Calendar
3. Create new event (no pod)
4. Fill details (title, start, end, description)
5. Save

**Expected**:
- Event appears in calendar
- Event saved to database

**Verify**:
- [ ] Event visible in calendar view
- [ ] Event details correct
- [ ] No notifications sent (personal event)

#### ✅ Create Event (Pod)
**Test Steps**:
1. Login as User A
2. Navigate to Calendar
3. Create new event for Pod
4. Select pod from dropdown
5. Save

**Expected**:
- Event created with `podId`
- ✨ **NEW**: All pod members (except creator) receive notification:
  - Type: `event`
  - Title: "New Event"
  - Message: "[User A] scheduled: [Event Title]"
  - Metadata: `eventId`, `podId`, `startTime`, `actorId`

**Verify**:
- [ ] Event visible to pod members
- [ ] Pod members notified
- [ ] Event shows pod association

#### ✅ Invite Attendees to Event
**Test Steps**:
1. Login as User A
2. Create/edit event
3. Add User B and User C as attendees
4. Save

**Expected**:
- Attendees array includes User B and C IDs
- ✨ **NEW**: User B and C receive notifications:
  - Type: `event_invite`
  - Title: "You're Invited"
  - Message: "[User A] invited you to: [Event Title]"
  - Metadata: `eventId`, `startTime`, `actorId`

**Verify**:
- [ ] Attendees listed in event
- [ ] User B and C notified
- [ ] Event appears in their calendars

#### ✅ Update Event
**Test Steps**:
1. Login as User A (event creator)
2. Edit event details
3. Save changes

**Expected**:
- Event details updated
- `updatedAt` timestamp set

**Verify**:
- [ ] Changes reflected
- [ ] No errors

#### ✅ Delete Event
**Test Steps**:
1. Login as User A
2. Find event
3. Delete event
4. Confirm

**Expected**:
- Event removed from calendar
- Event document deleted

**Verify**:
- [ ] Event no longer visible
- [ ] No errors (handles 404 gracefully)

---

### Chat/Messages

#### ✅ Send Direct Message
**Test Steps**:
1. Login as User A
2. Navigate to messages
3. Start chat with User B
4. Send message

**Expected**:
- Message appears in chat
- Message saved with `senderId`, `senderName`, `senderAvatar`
- Chat room `lastMessage` updated

**Verify**:
- [ ] Message visible to both users
- [ ] Sender info correct
- [ ] Timestamp accurate

#### ✅ Send Pod Chat Message
**Test Steps**:
1. Login as User A
2. Navigate to pod
3. Open pod chat
4. Send message

**Expected**:
- Message visible to all pod members
- Pod chat room updated

**Verify**:
- [ ] All members see message
- [ ] Message persists

---

### Resources

#### ✅ Upload Resource
**Test Steps**:
1. Login as User A
2. Navigate to Resources or Pod Resources
3. Upload file
4. Fill metadata (title, description, tags)
5. Submit

**Expected**:
- File uploaded to Appwrite Storage
- Resource document created with:
  - `authorId` (not uploadedBy)
  - `fileId`
  - `visibility`
  - Metadata fields

**Verify**:
- [ ] Resource appears in listing
- [ ] File downloadable
- [ ] Author info correct

#### ✅ Share Resource
**Test Steps**:
1. Login as User A
2. Find uploaded resource
3. Click share
4. Select pod or users
5. Confirm

**Expected**:
- Resource visibility updated or shared

**Verify**:
- [ ] Resource accessible to recipients
- [ ] Share status correct

#### ✅ Delete Resource
**Test Steps**:
1. Login as User A (resource author)
2. Find resource
3. Delete
4. Confirm

**Expected**:
- Resource document deleted
- File removed from storage

**Verify**:
- [ ] Resource no longer listed
- [ ] File inaccessible

---

## Notification System Testing

### Notification Display

#### ✅ View Notifications
**Test Steps**:
1. Login as user with notifications
2. Click bell icon in header
3. View notification list

**Expected**:
- All notifications listed
- Unread notifications highlighted
- Newest first (orderDesc by timestamp)
- Each notification shows:
  - Title
  - Message
  - Actor avatar/name
  - Timestamp
  - Read/unread status

**Verify**:
- [ ] Notifications visible
- [ ] Unread count accurate
- [ ] Sorting correct
- [ ] Actor info displays

#### ✅ Mark as Read
**Test Steps**:
1. Open notification dropdown
2. Click individual notification

**Expected**:
- Notification `isRead` set to true
- Unread count decrements
- Visual indicator changes

**Verify**:
- [ ] Notification marked read
- [ ] Count updates
- [ ] UI reflects change

#### ✅ Mark All as Read
**Test Steps**:
1. Open notification dropdown
2. Click "Mark all as read"

**Expected**:
- All notifications updated
- Unread count goes to 0

**Verify**:
- [ ] All marked read
- [ ] Count resets

#### ✅ Notification Navigation
**Test Steps**:
1. Click notification with associated content (post, event, etc.)

**Expected**:
- Navigate to relevant page
- Notification marked as read

**Verify**:
- [ ] Correct page loaded
- [ ] Content accessible
- [ ] Notification marked read

---

## Notification Types Summary

| Type | Trigger | Implemented | Working |
|------|---------|-------------|---------|
| `like` | User likes post | ✅ | ☐ |
| `comment` | User comments on post | ✅ | ☐ |
| `save` | User saves post | ✅ NEW | ☐ |
| `pod_post` | New post in pod | ✅ NEW | ☐ |
| `follow` | User follows another | ✅ | ☐ |
| `pod_join` | User joins pod | ✅ | ☐ |
| `pod_invite` | User invited to pod | ✅ | ☐ |
| `event` | Event created in pod | ✅ NEW | ☐ |
| `event_invite` | Invited to event | ✅ NEW | ☐ |
| `message` | New DM (optional) | ⏭️ | ☐ |
| `course_enrollment` | Student enrolls | ⏭️ Future | ☐ |
| `assignment_submit` | Assignment submitted | ⏭️ Future | ☐ |
| `assignment_graded` | Assignment graded | ⏭️ Future | ☐ |
| `course_complete` | Course completed | ⏭️ Future | ☐ |

---

## Edge Cases & Error Handling

### ✅ Self-Interaction Prevention
**Test**: User A likes own post
**Expected**: Notification NOT created
**Verify**: [ ] No self-notification

**Test**: User A comments on own post
**Expected**: Notification NOT created (check code)
**Verify**: [ ] No self-notification

### ✅ Deleted Content
**Test**: View notification for deleted post
**Expected**: Handle gracefully, show message or hide
**Verify**: [ ] No errors, graceful handling

### ✅ Notification Failures
**Test**: Trigger notification with invalid user ID
**Expected**: Error caught, logged, operation continues
**Verify**: [ ] Main operation succeeds despite notification failure

### ✅ Concurrent Operations
**Test**: Multiple users like same post simultaneously
**Expected**: All likes counted, all notifications sent
**Verify**: [ ] No race conditions

---

## Performance Testing

### ✅ Notification Load
**Test**: User with 100+ notifications
**Expected**: 
- Pagination works
- Initial load < 2s
- Smooth scrolling

**Verify**:
- [ ] Performance acceptable
- [ ] No memory issues

### ✅ Pod Notification Blast
**Test**: Post in pod with 50+ members
**Expected**:
- All members notified
- Operation completes < 5s
- No errors

**Verify**:
- [ ] All notifications sent
- [ ] Performance acceptable

---

## Database Verification

### Manual Checks

After testing, verify in Appwrite Console:

#### Notifications Collection
```
Check recent documents:
- userId matches recipient
- title present
- message present
- type correct
- actorId, actorName, actorAvatar present (when applicable)
- metadata contains relevant IDs
- isRead defaults to false
- timestamp accurate
```

#### Posts Collection
```
Check recent documents:
- imageUrls array (if images)
- likes, comments, saves counts accurate
- likedBy, savedBy arrays correct
- podId set for pod posts
- authorName, authorAvatar, authorUsername present
```

#### Events Collection
```
Check recent documents:
- description, location, meetingUrl present
- attendees array populated
- podId set for pod events
- reminders array present
```

---

## Regression Testing

### ✅ Previously Working Features
After notification additions, verify no breakage:

- [ ] User registration/login
- [ ] Profile creation/update
- [ ] Feed loading
- [ ] Search functionality
- [ ] File uploads
- [ ] Image display
- [ ] Routing/navigation

---

## Deployment Checklist

Before deploying to production:

1. [ ] All core operations tested
2. [ ] All notification types verified
3. [ ] No console errors
4. [ ] No TypeScript errors (critical ones)
5. [ ] Schema synced (`node scripts/update-schema.js`)
6. [ ] Environment variables set (.env.local)
7. [ ] Build succeeds (`npm run build`)
8. [ ] Production build tested locally

---

## Known Issues & Limitations

### Current Limitations
1. **No real-time notifications**: User must refresh to see new notifications
2. **No email notifications**: Only in-app notifications
3. **No push notifications**: PWA push not implemented
4. **No notification preferences**: All notifications enabled for all users
5. **Course notifications**: Not implemented (courses not actively used yet)

### Planned Enhancements
1. WebSocket/Appwrite Realtime for live notifications
2. Notification preferences page
3. Email digest option
4. Push notifications for PWA
5. Notification grouping (e.g., "5 people liked your post")

---

## Test Execution Log

### Session [DATE]

#### Tester: [NAME]
#### Environment: [Development/Staging/Production]

**Schema Update**:
- [ ] `node scripts/update-schema.js` - Success
- [ ] All new fields added
- [ ] No errors

**Posts**:
- [ ] Create post - Working
- [ ] Edit post - Working
- [ ] Delete post - Working
- [ ] Like post - Working + Notification ✅
- [ ] Comment post - Working + Notification ✅
- [ ] Save post - Working + Notification ✅

**Pods**:
- [ ] Create pod - Working
- [ ] Join pod - Working + Notification ✅
- [ ] Post in pod - Working + Notification ✅
- [ ] Leave pod - Working

**Calendar**:
- [ ] Create personal event - Working
- [ ] Create pod event - Working + Notification ✅
- [ ] Invite attendees - Working + Notification ✅
- [ ] Update event - Working
- [ ] Delete event - Working

**Follow**:
- [ ] Follow user - Working + Notification ✅

**Notifications UI**:
- [ ] View notifications - Working
- [ ] Mark as read - Working
- [ ] Navigate from notification - Working

**Issues Found**:
1. [Describe issue]
2. [Describe issue]

**Overall Status**: ✅ Pass / ⚠️ Partial / ❌ Fail

**Notes**:
[Add any observations, suggestions, or concerns]

---

## Quick Test Commands

```bash
# Update schema
node scripts/update-schema.js

# Start dev server
npm run dev

# Check TypeScript errors
npx tsc --noEmit

# Build for production
npm run build

# View logs (if using PM2 or similar)
pm2 logs peerspark
```

---

## Support & Debugging

### Common Issues

**Notification not appearing**:
1. Check notification collection in Appwrite Console
2. Verify userId matches logged-in user
3. Check browser console for errors
4. Verify createNotification function called (add console.log)

**Actor info missing**:
1. Check notification document in Appwrite
2. Verify actorId, actorName, actorAvatar fields present
3. Check profileService.getProfile works
4. Verify schema has actor fields

**Schema mismatch errors**:
1. Run `node scripts/update-schema.js`
2. Check Appwrite Console for attribute names
3. Verify .env.local variables correct
4. Check database ID matches

**TypeScript errors**:
1. Run `npx tsc --noEmit` to see all errors
2. Check types in lib/appwrite.ts
3. Most are non-blocking (event handlers, comparisons)

### Debug Mode

Add to notification functions for debugging:
```typescript
console.log("Creating notification:", {
  userId,
  title,
  type,
  metadata
})
```

Enable Appwrite debug:
```typescript
import { Client } from "appwrite"
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!)
  .enableDebugMode() // Add this
```

---

**End of Testing Checklist**
