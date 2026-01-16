# Notification System Audit & Enhancements

## Current Status

### ✅ Notifications Already Working
1. **Follow** - [lib/appwrite.ts](lib/appwrite.ts#L703-L711) - When user follows another user
2. **Like Post** - [lib/appwrite.ts](lib/appwrite.ts#L2789) - When user likes a post (not self-likes)
3. **Comment** - [lib/appwrite.ts](lib/appwrite.ts#L2966) - When user comments on a post
4. **Pod Join** - [lib/appwrite.ts](lib/appwrite.ts#L943) - When user joins a pod

### ❌ Missing Notifications (Need to Add)
1. **Post Created in Pod** - Should notify all pod members
2. **Save/Bookmark Post** - Should notify post author
3. **Calendar Event Created** - Should notify pod members if pod event
4. **Calendar Event Invite** - Should notify specific attendees
5. **Course Enrollment** - Should notify instructor
6. **Course Completion** - Should notify student
7. **Assignment Submission** - Should notify instructor
8. **Assignment Graded** - Should notify student
9. **Pod Invitation** - Partially exists, needs verification
10. **Message Sent** - For direct messages (if implementing DM system)

### ⚠️ Notification Schema Issues
Some existing notifications use inconsistent field names:
- Some use `read` instead of `isRead`
- Some use `actor` instead of `actorId`
- Some missing `title` field

## Required Fixes

### 1. Add Notification for Post Creation in Pod

**Location**: [lib/appwrite.ts](lib/appwrite.ts#L2520-L2537)

```typescript
// After creating post document
const post = await databases.createDocument(DATABASE_ID, COLLECTIONS.POSTS, "unique()", {
  // ... existing fields ...
})

// Notify pod members if post is in a pod
if (podId) {
  try {
    const pod = await databases.getDocument(DATABASE_ID, COLLECTIONS.PODS, podId)
    const members = Array.isArray(pod.members) ? pod.members : []
    // Notify all pod members except author
    for (const memberId of members.filter(m => m !== authorId)) {
      try {
        await notificationService.createNotification(
          memberId,
          "New Pod Post",
          `${authorName} posted in ${pod.name}`,
          "pod_post",
          {
            postId: post.$id,
            podId: podId,
            actorId: authorId,
            actorName: authorName,
            actorAvatar: authorAvatar,
          }
        )
      } catch (e) {
        console.error(`Failed to notify member ${memberId}:`, e)
      }
    }
  } catch (e) {
    console.error("Failed to send pod post notifications:", e)
  }
}
```

### 2. Add Notification for Save/Bookmark

**Location**: [lib/appwrite.ts](lib/appwrite.ts#L2854-L2858)

```typescript
// After creating save document
await databases.createDocument(DATABASE_ID, "saved_posts", "unique()", {
  postId: postId,
  userId: userId,
  savedAt: new Date().toISOString(),
})

// Notify post author
try {
  const post = await databases.getDocument(DATABASE_ID, COLLECTIONS.POSTS, postId)
  if (post.authorId !== userId) {
    const saverProfile = await profileService.getProfile(userId)
    await notificationService.createNotification(
      post.authorId,
      "Post Saved",
      `${saverProfile?.name || 'Someone'} saved your post`,
      "save",
      {
        postId: postId,
        actorId: userId,
        actorName: saverProfile?.name,
        actorAvatar: saverProfile?.avatar,
      }
    )
  }
} catch (e) {
  console.error("Failed to create save notification:", e)
}
```

### 3. Add Notifications for Calendar Events

**Location**: [lib/appwrite.ts](lib/appwrite.ts#L3177-L3192)

```typescript
async createEvent(userId: string, title: string, startTime: string, endTime: string, metadata: any = {}) {
  try {
    const event = await databases.createDocument(DATABASE_ID, COLLECTIONS.CALENDAR_EVENTS, "unique()", {
      // ... existing fields ...
    })

    // Notify pod members if event is for a pod
    if (metadata.podId) {
      try {
        const pod = await databases.getDocument(DATABASE_ID, COLLECTIONS.PODS, metadata.podId)
        const creator = await profileService.getProfile(userId)
        const members = Array.isArray(pod.members) ? pod.members : []
        
        for (const memberId of members.filter(m => m !== userId)) {
          try {
            await notificationService.createNotification(
              memberId,
              "New Event",
              `${creator?.name || 'Someone'} scheduled: ${title}`,
              "event",
              {
                eventId: event.$id,
                podId: metadata.podId,
                startTime: startTime,
                actorId: userId,
              }
            )
          } catch (e) {
            console.error(`Failed to notify member ${memberId}:`, e)
          }
        }
      } catch (e) {
        console.error("Failed to send event notifications:", e)
      }
    }

    // Notify attendees if specified
    if (Array.isArray(metadata.attendees) && metadata.attendees.length > 0) {
      try {
        const creator = await profileService.getProfile(userId)
        
        for (const attendeeId of metadata.attendees.filter((a: string) => a !== userId)) {
          try {
            await notificationService.createNotification(
              attendeeId,
              "You're Invited",
              `${creator?.name || 'Someone'} invited you to: ${title}`,
              "event_invite",
              {
                eventId: event.$id,
                startTime: startTime,
                actorId: userId,
              }
            )
          } catch (e) {
            console.error(`Failed to notify attendee ${attendeeId}:`, e)
          }
        }
      } catch (e) {
        console.error("Failed to send attendee notifications:", e)
      }
    }

    return event
  } catch (error) {
    console.error("Create event error:", error)
    throw error
  }
}
```

### 4. Fix Notification Schema Inconsistencies

**Existing issues** in [lib/appwrite.ts](lib/appwrite.ts#L703-L711):
- Uses `read` instead of `isRead`
- Uses `actor` instead of `actorId`

**Should standardize to**:
```typescript
{
  userId: string,           // Recipient
  title: string,            // Notification title
  message: string,          // Notification message
  type: string,             // Type: follow, like, comment, pod_post, etc.
  isRead: boolean,          // Read status (not "read")
  timestamp: string,        // Created timestamp
  actorId: string,          // User who triggered the notification
  actorName: string,        // Actor's name
  actorAvatar: string,      // Actor's avatar
  metadata: object          // Additional context (postId, podId, etc.)
}
```

### 5. Course Notifications (Future Enhancement)

These should be added when course features are actively used:

```typescript
// Course Enrollment
await notificationService.createNotification(
  instructorId,
  "New Enrollment",
  `${studentName} enrolled in ${courseName}`,
  "course_enrollment",
  { courseId, studentId }
)

// Assignment Submission
await notificationService.createNotification(
  instructorId,
  "Assignment Submitted",
  `${studentName} submitted: ${assignmentTitle}`,
  "assignment_submit",
  { courseId, assignmentId, submissionId }
)

// Assignment Graded
await notificationService.createNotification(
  studentId,
  "Assignment Graded",
  `Your ${assignmentTitle} was graded: ${grade}%`,
  "assignment_graded",
  { courseId, assignmentId, grade }
)

// Course Completion
await notificationService.createNotification(
  studentId,
  "Course Completed!",
  `Congratulations! You completed ${courseName}`,
  "course_complete",
  { courseId, certificateId }
)
```

## Notification Types Reference

| Type | Trigger | Recipients | Priority |
|------|---------|-----------|----------|
| `follow` | User follows another | Followed user | Medium |
| `like` | User likes post | Post author | Low |
| `comment` | User comments on post | Post author | High |
| `save` | User saves post | Post author | Low |
| `pod_post` | New post in pod | All pod members | Medium |
| `pod_join` | User joins pod | Pod creator | Medium |
| `pod_invite` | User invited to pod | Invited user | High |
| `event` | Event created in pod | Pod members | High |
| `event_invite` | User invited to event | Invited users | High |
| `course_enrollment` | Student enrolls | Instructor | Low |
| `assignment_submit` | Assignment submitted | Instructor | Medium |
| `assignment_graded` | Assignment graded | Student | High |
| `course_complete` | Course completed | Student | High |

## Testing Checklist

### Core Operations
- [ ] Create post in pod → pod members get notified
- [ ] Like post → author gets notified (not self-likes)
- [ ] Comment on post → author gets notified
- [ ] Save post → author gets notified
- [ ] Follow user → followed user gets notified
- [ ] Join pod → pod creator gets notified

### Calendar Operations
- [ ] Create event in pod → pod members get notified
- [ ] Invite users to event → invited users get notified
- [ ] Update event → attendees get notified (future)
- [ ] Event reminder 1 hour before → attendees get notified (future)

### Course Operations (Future)
- [ ] Enroll in course → instructor gets notified
- [ ] Submit assignment → instructor gets notified
- [ ] Grade assignment → student gets notified
- [ ] Complete course → student gets notified

### UI Verification
- [ ] Notifications visible in header bell icon
- [ ] Unread count updates in real-time
- [ ] Clicking notification marks as read
- [ ] Clicking notification navigates to relevant content
- [ ] Old notifications paginate correctly

## Implementation Priority

### Phase 1 (Immediate - This Session)
1. ✅ Audit existing notifications
2. Add pod post notifications
3. Add save/bookmark notifications
4. Add calendar event notifications
5. Fix notification schema inconsistencies

### Phase 2 (Next Session)
1. Add event reminder system (1 hour before)
2. Add event update notifications
3. Add bulk notification preferences
4. Add notification filtering in UI

### Phase 3 (Future)
1. Course notification system
2. Real-time notifications with WebSocket/Realtime API
3. Email notifications for important events
4. Push notifications (PWA)
5. Notification digest/summary emails

## Schema Verification

Run to verify notification collection schema:
```bash
node scripts/update-schema.js
```

Expected notification attributes:
- userId (string, required)
- title (string, required)
- message (string, required)
- type (string, required)
- isRead (boolean, default: false)
- timestamp (datetime, required)
- actorId (string, optional)
- actorName (string, optional)
- actorAvatar (string, optional)
- metadata (string, optional - JSON)
