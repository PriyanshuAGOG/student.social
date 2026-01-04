# PEERSPARK BACKEND SERVICES - USAGE GUIDE

**Last Updated**: Current Session
**Status**: 70% Implementation Complete

---

## 📚 TABLE OF CONTENTS

1. [Feed/Post Service](#feedpost-service)
2. [Comments Service](#comments-service)
3. [Profile Service](#profile-service)
4. [Chat Service](#chat-service)
5. [Resource Service](#resource-service)
6. [Pod Service](#pod-service-needs-work)
7. [Error Handling](#error-handling)
8. [Pagination Pattern](#pagination-pattern)

---

## 🚀 Feed/Post Service

### Create a Post

```typescript
import { feedService } from '@/lib/appwrite'

// Simple text post
const post = await feedService.createPost(userId, "This is my post content", {
  visibility: "public",
  tags: ["DSA", "Learning"]
})

// Post with images
const files = [imageFile1, imageFile2] // File objects
const post = await feedService.createPost(userId, "Check out these images!", {
  imageFiles: files,
  visibility: "public",
  tags: ["Resources"]
})

// Pod-exclusive post
const post = await feedService.createPost(userId, "Team discussion", {
  visibility: "pod",
  podId: "pod_12345",
  tags: ["Discussion"]
})
```

### Get Feed Posts

```typescript
// Get public posts + user's pod posts
const feed = await feedService.getFeedPosts(userId, limit = 20, offset = 0)
// Returns: { documents: Post[], total: number }

// Get specific user's posts
const userPosts = await feedService.getUserPosts(userId, limit = 50, offset = 0)
```

### Like/Unlike Post

```typescript
// Toggle like
const result = await feedService.toggleLike(postId, userId)
// Returns: { likes: number, isLiked: boolean, post: Post }

// Check likes
const { likes, likedBy } = await feedService.getPostLikes(postId)
```

### Save/Unsave Post

```typescript
// Save a post (bookmark)
const result = await feedService.toggleSavePost(postId, userId)
// Returns: { saved: boolean }

// Check if saved
const isSaved = await feedService.isPostSaved(postId, userId)

// Get user's saved posts
const saved = await feedService.getSavedPosts(userId, limit = 50, offset = 0)
```

### Update/Delete Post

```typescript
// Update post content
const updated = await feedService.updatePost(postId, {
  content: "Updated content",
  tags: ["NewTag"]
})

// Delete post (cascading cleanup)
await feedService.deletePost(postId)
// Also deletes: comments, images, save entries
```

---

## 💬 Comments Service

### Create a Comment

```typescript
import { commentService } from '@/lib/appwrite'

const comment = await commentService.createComment(
  postId,
  userId,
  "Great post!",
  {
    authorName: "John Doe",
    authorAvatar: "https://..."
  }
)
// Auto-creates notification for post author
```

### Get Comments

```typescript
// Get post comments (chronological)
const comments = await commentService.getComments(postId, limit = 50, offset = 0)
// Returns: { documents: Comment[], total: number }

// Get replies to a comment
const replies = await commentService.getReplies(commentId, limit = 20)
```

### Like Comments

```typescript
// Toggle like on comment
const result = await commentService.toggleLike(commentId, userId)
// Returns: { likes: number, isLiked: boolean }

// Check comment likes
const { likes, likedBy } = await commentService.getCommentLikes(commentId)
```

### Edit/Delete Comments

```typescript
// Edit comment
await commentService.updateComment(commentId, "Updated comment text")

// Delete comment (decrements post count)
await commentService.deleteComment(commentId)
```

---

## 👤 Profile Service

### Get Profile

```typescript
import { profileService } from '@/lib/appwrite'

// Get user profile
const profile = await profileService.getProfile(userId)

// Get by username
const profile = await profileService.getProfileByUsername("john_doe")

// Get all profiles (for search/leaderboard)
const allProfiles = await profileService.getAllProfiles(limit = 50)
```

### Update Profile

```typescript
// Update profile info
const updated = await profileService.updateProfile(userId, {
  name: "John Doe",
  bio: "Software developer",
  avatar: "https://..."
})
```

### Upload Avatar

```typescript
// Upload user avatar
const avatarUrl = await profileService.uploadAvatar(imageFile, userId)
// Automatically updates profile
```

### Follow/Unfollow

```typescript
// Follow a user
const result = await profileService.followUser(followerId, followingId)
// Creates bidirectional relationship + notification

// Unfollow a user
await profileService.unfollowUser(followerId, followingId)

// Check if following
const isFollowing = await profileService.isFollowing(followerId, followingId)
// Returns: boolean
```

---

## 💬 Chat Service

### Send Message

```typescript
import { chatService } from '@/lib/appwrite'

const message = await chatService.sendMessage(
  roomId,
  senderId,
  "Hello team!",
  {
    senderName: "John Doe",
    senderAvatar: "https://..."
  }
)
// Also updates room's lastMessage and lastMessageTime
```

### Get Messages

```typescript
// Get chat history (chronological order)
const messages = await chatService.getMessages(roomId, limit = 50, offset = 0)
// Returns: { documents: Message[], total: number }

// Messages are ordered newest first in DB, but reversed for display
```

### Create Direct Chat

```typescript
// Get or create direct chat between two users
const chatRoom = await chatService.createDirectChat(userId1, userId2)

// Get all user's chat rooms
const rooms = await chatService.getUserChatRooms(userId)
// Returns: { documents: ChatRoom[], total: number }
```

### Mark as Read

```typescript
// Mark message as read
await chatService.markMessageAsRead(messageId, userId)
// Adds userId to readBy array
```

---

## 📦 Resource Service

### Upload Resource

```typescript
import { resourceService } from '@/lib/appwrite'

const resource = await resourceService.uploadResource(
  userId,
  file, // File object
  {
    title: "Study Guide",
    description: "Complete DSA guide",
    podId: "pod_12345", // Optional
    tags: ["DSA", "Guide"]
  }
)

// Validates:
// - File type (PDF, Word, Excel, Images, TXT only)
// - File size (max 50MB)
```

### Get Resources

```typescript
// Get resources (optionally filtered by pod)
const resources = await resourceService.getResources(podId?, limit = 50)

// Get user's bookmarked resources
const bookmarked = await resourceService.getBookmarkedResources(userId, limit = 50)
```

### Bookmark Resource

```typescript
// Save/unsave resource
const result = await resourceService.toggleBookmarkResource(resourceId, userId)
// Returns: { bookmarked: boolean, resource: Resource }
```

### Delete Resource

```typescript
// Delete resource (owner only)
await resourceService.deleteResource(resourceId, userId)
// Verifies ownership, deletes file from storage
```

---

## 🐛 Error Handling

All services use consistent error handling:

```typescript
try {
  const result = await feedService.createPost(userId, content, metadata)
} catch (error) {
  if (error instanceof Error) {
    // Show user-friendly message
    toast({
      title: "Error",
      description: error.message,
      variant: "destructive"
    })
  }
}
```

### Common Error Cases

| Error | Cause | Solution |
|-------|-------|----------|
| "Post content cannot be empty" | Empty/whitespace content | Validate before submitting |
| "Post content exceeds 5000 character limit" | Content too long | Truncate or split into multiple posts |
| "File type not allowed" | Invalid file type in resource upload | Only PDF, Word, Excel, Images, TXT |
| "File too large (max 50MB)" | Resource file > 50MB | Compress or split file |
| "You cannot follow yourself" | Trying to follow own profile | Disable follow button for own profile |

---

## 📄 Pagination Pattern

Standard pagination used across all list operations:

```typescript
// First page
const page1 = await feedService.getFeedPosts(userId, limit = 20, offset = 0)

// Next page
const page2 = await feedService.getFeedPosts(userId, limit = 20, offset = 20)

// Previous page
const page0 = await feedService.getFeedPosts(userId, limit = 20, offset = 0)

// Response format
type ListResponse = {
  documents: any[]
  total: number
}

// Calculate total pages
const totalPages = Math.ceil(response.total / limit)
```

---

## 🔍 Pod Service (NEEDS REFACTORING)

The Pod Service still needs work. Current implementation has issues with:
- Appwrite Teams dependency (doesn't work reliably)
- Member count verification
- Chat room creation

**Available fix**: Use `appwrite-services-fixes-part2.ts` for pure database approach.

```typescript
// Current broken usage:
const pod = await podService.createPod(name, description, userId, metadata)
const joined = await podService.joinPod(podId, userId)
const members = await podService.getMemberCount(podId) // Returns undefined

// Will be fixed with database-only approach
```

---

## ⚙️ Configuration

All services require these environment variables:

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_DATABASE_ID=your_database_id
NEXT_PUBLIC_PROFILES_COLLECTION_ID=...
NEXT_PUBLIC_POSTS_COLLECTION_ID=...
NEXT_PUBLIC_COMMENTS_COLLECTION_ID=...
NEXT_PUBLIC_MESSAGES_COLLECTION_ID=...
NEXT_PUBLIC_CHAT_ROOMS_COLLECTION_ID=...
NEXT_PUBLIC_RESOURCES_COLLECTION_ID=...
NEXT_PUBLIC_NOTIFICATIONS_COLLECTION_ID=...
NEXT_PUBLIC_PODS_COLLECTION_ID=...
NEXT_PUBLIC_CALENDAR_EVENTS_COLLECTION_ID=...
NEXT_PUBLIC_SAVED_POSTS_COLLECTION_ID=...
NEXT_PUBLIC_AVATARS_BUCKET_ID=...
NEXT_PUBLIC_POST_IMAGES_BUCKET_ID=...
NEXT_PUBLIC_RESOURCES_BUCKET_ID=...
NEXT_PUBLIC_POD_IMAGES_BUCKET_ID=...
NEXT_PUBLIC_ATTACHMENTS_BUCKET_ID=...
```

---

## 🧪 Testing Examples

### Test Post Creation and Deletion

```typescript
// Create
const post = await feedService.createPost(userId, "Test", {
  imageFiles: [file1, file2],
  visibility: "public",
  tags: ["test"]
})
console.assert(post.$id, "Post should have ID")
console.assert(post.likes === 0, "Initial likes should be 0")

// Like
const likeResult = await feedService.toggleLike(post.$id, userId)
console.assert(likeResult.likes === 1, "Likes should be 1")

// Save
const saveResult = await feedService.toggleSavePost(post.$id, otherUserId)
console.assert(saveResult.saved === true, "Should be saved")

// Delete
await feedService.deletePost(post.$id)
const deleted = await feedService.getFeedPosts(userId, 1)
console.assert(!deleted.documents.some(p => p.$id === post.$id), "Post should be deleted")
```

### Test Follow System

```typescript
// Follow
await profileService.followUser(user1, user2)
const isFollowing = await profileService.isFollowing(user1, user2)
console.assert(isFollowing, "User1 should follow User2")

// Check bidirectional
const profile1 = await profileService.getProfile(user1)
const profile2 = await profileService.getProfile(user2)
console.assert(profile1.following.includes(user2), "User1 following list should contain user2")
console.assert(profile2.followers.includes(user1), "User2 followers list should contain user1")

// Unfollow
await profileService.unfollowUser(user1, user2)
const stillFollowing = await profileService.isFollowing(user1, user2)
console.assert(!stillFollowing, "User1 should not follow User2")
```

---

## 📖 Full Example: Create and Interact with Post

```typescript
import { feedService, commentService, profileService } from '@/lib/appwrite'
import { useToast } from '@/hooks/use-toast'

export function PostFlow({ userId }: { userId: string }) {
  const { toast } = useToast()

  const createAndInteract = async () => {
    try {
      // 1. Create post
      const post = await feedService.createPost(userId, "New post!", {
        visibility: "public",
        tags: ["mypost"]
      })
      toast({ title: "Post created!" })

      // 2. Another user likes it
      const likeResult = await feedService.toggleLike(post.$id, otherUserId)
      toast({ title: `${likeResult.likes} likes` })

      // 3. Another user comments
      const comment = await commentService.createComment(
        post.$id,
        otherUserId,
        "Great post!"
      )

      // 4. Like the comment
      await commentService.toggleLike(comment.$id, userId)

      // 5. Save the post
      await feedService.toggleSavePost(post.$id, thirdUserId)

      // 6. Get feed with all interactions
      const feed = await feedService.getFeedPosts(userId)
      console.log(feed.documents[0]) // Shows likes: 1, comments: 1
    } catch (error) {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Unknown error"
      })
    }
  }

  return <button onClick={createAndInteract}>Test Full Flow</button>
}
```

---

## 🎯 Next Steps

1. **Replace Pod Service** - Use database-only approach from appwrite-services-fixes-part2.ts
2. **Build UI Components** - Feed, Posts, Comments, Chat, Resources pages
3. **Implement Auth** - Login/Register/Logout flows
4. **Add Notifications** - Display notifications created by services
5. **Performance** - Add caching, optimize queries
6. **Real-time** - Replace polling with Appwrite realtime subscriptions

