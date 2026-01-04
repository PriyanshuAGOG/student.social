# FUNCTION SIGNATURES - QUICK REFERENCE

## Pod Service - All Fixed Functions ✅

```typescript
// Create Pod (with auto chat room creation)
await podService.createPod(name, description, userId, { subject, difficulty, maxMembers, isPublic, image })

// Join Pod (verified member count)
await podService.joinPod(podId, userId, userEmail?)

// Leave Pod (with cleanup)
await podService.leavePod(podId, userId)

// Get All Pods (with filters)
await podService.getAllPods(limit, offset, { isPublic, subject, difficulty, search })

// Get User's Pods
await podService.getUserPods(userId, limit, offset)

// Get Pod Details
await podService.getPodDetails(podId)

// Update Pod (with image)
await podService.updatePod(podId, { name, description, image })

// Delete Pod (cascading)
await podService.deletePod(podId, userId)

// Get Member Count
await podService.getMemberCount(podId)

// Get Pod Members (with profiles)
await podService.getPodMembers(podId, limit)
```

## Analytics Service - All New Functions ✅

```typescript
// Track study time
await analyticsService.trackStudyTime(userId, podId, duration, subject?)

// Track activity
await analyticsService.trackActivity(userId, action, metadata?)

// Get study stats
await analyticsService.getStudyStats(userId, startDate?, endDate?)

// Get activity log
await analyticsService.getActivityLog(userId, limit, offset)

// Get pod stats
await analyticsService.getPodStats(podId)

// Get resource stats
await analyticsService.getResourceStats(userId)

// Get achievement progress
await analyticsService.getAchievementProgress(userId)

// Generate report
await analyticsService.generateReport(userId, startDate, endDate)

// Export analytics
await analyticsService.exportAnalytics(userId, format)

// Update learning goals
await analyticsService.updateLearningGoals(userId, goals)

// Track goal progress
await analyticsService.trackGoalProgress(userId, goalId, progress)
```

## Feed Service ✅

```typescript
// Create post
await feedService.createPost(authorId, content, { type, imageFiles, visibility, podId, tags })

// Toggle like
await feedService.toggleLike(postId, userId)

// Delete post (cascading)
await feedService.deletePost(postId)
```

## Comment Service ✅

```typescript
// Create comment
await commentService.createComment(postId, authorId, content, {})

// Update comment
await commentService.updateComment(commentId, content)

// Delete comment
await commentService.deleteComment(commentId)

// Toggle like
await commentService.toggleLike(commentId, userId)
```

## Chat Service ✅

```typescript
// Send message
await chatService.sendMessage(roomId, senderId, content, { senderName, senderAvatar })

// Get messages
await chatService.getMessages(roomId, limit, offset)
```

## Resource Service ✅

```typescript
// Upload resource
await resourceService.uploadResource(userId, file, { title, description, podId, tags, type })

// Get resources
await resourceService.getResources(podId?, limit, offset)
```

## Calendar Service ✅

```typescript
// Create event
await calendarService.createEvent(userId, title, startTime, endTime, { type, podId })

// Get user events
await calendarService.getUserEvents(userId, startDate?, endDate?)
```

---

**Key Changes:**
- Pod functions now database-only (no Teams API)
- Member counts verified after updates
- Chat rooms auto-created
- Analytics service fully implemented
- All functions return consistent data structures
