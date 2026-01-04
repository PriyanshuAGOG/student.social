# DEPLOYMENT CHECKLIST - PHASE 1

**Purpose**: Deploy the 70% complete backend fixes
**Target**: Production deployment with core social features
**Estimated Time**: 2-4 hours for testing + deployment

---

## ✅ PRE-DEPLOYMENT VERIFICATION

### 1. Backend Services Status
- [x] Feed/Post Service - READY
- [x] Comments Service - READY
- [x] Profile/Follow Service - READY
- [x] Chat Service - READY (basic messaging)
- [x] Resource Service - READY
- [ ] Pod Service - NOT READY (needs refactor)
- [ ] Auth Service - NEEDS TESTING
- [ ] Notifications Display - NEEDS UI
- [ ] Calendar Service - NOT READY
- [ ] Analytics Service - NOT READY

### 2. Code Quality Checks
- [ ] No console.error that shouldn't be there
- [ ] All error paths return user-friendly messages
- [ ] Proper TypeScript types throughout
- [ ] No hardcoded values
- [ ] All TODOs are documented

### 3. Environment Variables
- [ ] NEXT_PUBLIC_APPWRITE_ENDPOINT set
- [ ] NEXT_PUBLIC_APPWRITE_PROJECT_ID set
- [ ] All COLLECTION_ID variables set
- [ ] All BUCKET_ID variables set
- [ ] No secrets in repository

---

## 📋 APPWRITE SETUP VERIFICATION

### Collections Exist and Configured
- [ ] PROFILES collection exists
  - Fields: name, bio, avatar, email, followers[], following[], followerCount, followingCount, joinedAt
- [ ] POSTS collection exists
  - Fields: authorId, content, type, visibility, podId, timestamp, imageUrls[], likes, comments, likedBy[], savedBy[], tags[], authorName, authorAvatar, authorUsername
- [ ] COMMENTS collection exists
  - Fields: postId, authorId, content, timestamp, likes, likedBy[], authorName, authorAvatar, authorUsername
- [ ] SAVED_POSTS collection exists
  - Fields: userId, postId, savedAt
- [ ] MESSAGES collection exists
  - Fields: roomId, senderId, content, timestamp, senderName, senderAvatar, readBy[], isEdited
- [ ] CHAT_ROOMS collection exists
  - Fields: type, members[], podId, lastMessage, lastMessageTime, lastMessageSenderId
- [ ] RESOURCES collection exists
  - Fields: uploadedBy, title, description, fileUrl, downloadUrl, fileName, fileSize, fileType, podId, tags[], bookmarkedBy[], downloads, createdAt
- [ ] NOTIFICATIONS collection exists
  - Fields: userId, type, actor, actorName, actorAvatar, message, read, createdAt
- [ ] PODS collection exists
  - Fields: creatorId, name, description, members[], memberCount, image, category, isPrivate, createdAt
- [ ] CALENDAR_EVENTS collection exists
  - Fields: userId, title, startTime, endTime, type, podId, isCompleted, createdAt

### Storage Buckets Created
- [ ] AVATARS bucket exists with proper permissions
- [ ] POST_IMAGES bucket exists with proper permissions
- [ ] POD_IMAGES bucket exists with proper permissions
- [ ] RESOURCES bucket exists with proper permissions
- [ ] ATTACHMENTS bucket exists with proper permissions

### Database Indexes Created
- [ ] Posts: index on visibility, authorId, timestamp
- [ ] Comments: index on postId, timestamp
- [ ] Messages: index on roomId, timestamp
- [ ] Notifications: index on userId, createdAt
- [ ] Profiles: index on email, name

---

## 🧪 LOCAL TESTING CHECKLIST

### Post Operations
- [ ] Create text post
  - [ ] Content saves correctly
  - [ ] Author info denormalized
  - [ ] Timestamp created
- [ ] Create post with 1 image
  - [ ] Image uploads to storage
  - [ ] Image URL stored in post
- [ ] Create post with 4 images
  - [ ] All 4 images upload
  - [ ] All URLs stored
- [ ] Create post with tags
  - [ ] Tags array stores correctly
  - [ ] Max 10 tags enforced
- [ ] Create post with pod visibility
  - [ ] podId stored
  - [ ] visibility set to "pod"
- [ ] Get feed posts
  - [ ] Returns public posts
  - [ ] Returns user's pod posts
  - [ ] Pagination works (limit/offset)
  - [ ] Sorting by timestamp descending
- [ ] Update post
  - [ ] Content updates
  - [ ] Tags update
  - [ ] updatedAt timestamp changes
- [ ] Delete post
  - [ ] Post removed from database
  - [ ] Associated images deleted from storage
  - [ ] Associated comments deleted
  - [ ] Associated saves deleted

### Comment Operations
- [ ] Create comment
  - [ ] Comment saves with postId
  - [ ] Post comment count increments
  - [ ] Notification created for post author (if not self)
  - [ ] Author name denormalized
- [ ] Get comments
  - [ ] Returns comments for post
  - [ ] Ordered chronologically (oldest first)
  - [ ] Pagination works
  - [ ] Total count accurate
- [ ] Like comment
  - [ ] Like count increases
  - [ ] User added to likedBy array
  - [ ] Like count = array length
- [ ] Unlike comment
  - [ ] Like count decreases
  - [ ] User removed from likedBy array
  - [ ] Can't go below 0
- [ ] Update comment
  - [ ] Content updates
  - [ ] updatedAt changes
- [ ] Delete comment
  - [ ] Comment removed
  - [ ] Post comment count decrements
  - [ ] Notification not created for deletion

### Like/Save Operations
- [ ] Toggle like on post
  - [ ] First like: count goes 0→1
  - [ ] Unlike: count goes 1→0
  - [ ] Multiple users can like same post
  - [ ] Like count = likedBy array length
- [ ] Check if user liked post
  - [ ] Returns true if liked
  - [ ] Returns false if not liked
- [ ] Toggle save post
  - [ ] Creates entry in SAVED_POSTS
  - [ ] Second toggle removes entry
  - [ ] Multiple users can save same post
- [ ] Get saved posts
  - [ ] Returns only saved posts for user
  - [ ] Pagination works
  - [ ] Ordered by savedAt desc

### Profile/Follow Operations
- [ ] Get user profile
  - [ ] Returns profile object
  - [ ] Handles missing profile gracefully
- [ ] Update profile
  - [ ] Updates fields correctly
  - [ ] Creates profile if doesn't exist
- [ ] Follow user
  - [ ] Adds to follower's "following" list
  - [ ] Adds to followed user's "followers" list
  - [ ] Count fields update
  - [ ] Notification created
  - [ ] Can't follow self
- [ ] Unfollow user
  - [ ] Removes from both lists
  - [ ] Counts decrement
  - [ ] No notification (expected)
- [ ] Check if following
  - [ ] Returns true/false correctly
  - [ ] Non-existent user returns false
- [ ] Upload avatar
  - [ ] File uploads to storage
  - [ ] URL stored in profile
  - [ ] Profile updates

### Chat Operations
- [ ] Send message
  - [ ] Message saves to database
  - [ ] Content cannot be empty
  - [ ] Content limit enforced (5000 chars)
  - [ ] Sender name denormalized
  - [ ] Room's lastMessage updates
- [ ] Get messages
  - [ ] Returns all messages for room
  - [ ] Pagination works
  - [ ] Ordered chronologically (oldest first)
- [ ] Create direct chat
  - [ ] Creates room if doesn't exist
  - [ ] Returns existing room if already created
  - [ ] Members array has 2 users
  - [ ] Type set to "direct"
- [ ] Get user chat rooms
  - [ ] Returns all user's rooms (pod + direct)
  - [ ] Shows recent messages first
- [ ] Mark as read
  - [ ] Adds user to readBy array
  - [ ] Doesn't duplicate if already read

### Resource Operations
- [ ] Upload PDF
  - [ ] File uploads successfully
  - [ ] File type validation passes
  - [ ] Document created with metadata
  - [ ] File size tracked
- [ ] Upload image
  - [ ] Image uploads successfully
  - [ ] Preview available
- [ ] Upload large file (45MB)
  - [ ] Uploads successfully
- [ ] Try to upload file > 50MB
  - [ ] Rejected with error message
- [ ] Try to upload unsupported type
  - [ ] Rejected with error message
- [ ] Get resources
  - [ ] Returns all resources
  - [ ] Can filter by podId
  - [ ] Pagination works
- [ ] Bookmark resource
  - [ ] First bookmark adds user to array
  - [ ] Second bookmark removes user
  - [ ] Multiple users can bookmark
- [ ] Get bookmarked resources
  - [ ] Returns only bookmarked for user
  - [ ] Pagination works
- [ ] Delete resource
  - [ ] Only owner can delete
  - [ ] File removed from storage
  - [ ] Document removed from database

### Error Cases
- [ ] Empty post rejected
- [ ] Post > 5000 characters rejected
- [ ] Empty comment rejected
- [ ] Comment > 2000 characters rejected
- [ ] Invalid file type rejected
- [ ] Oversized file rejected
- [ ] Non-existent post returns error gracefully
- [ ] Non-existent comment returns error gracefully
- [ ] Non-existent user returns error gracefully

---

## 🚀 DEPLOYMENT STEPS

### 1. Pre-Deployment
```bash
# Verify no uncommitted changes
git status

# Build the project
npm run build
# OR if using pnpm
pnpm build

# Check for build errors
# Review any TypeScript errors
```

### 2. Vercel Deployment
```bash
# If using GitHub integration, push to main
git add .
git commit -m "feat: deploy phase 1 backend fixes (70% complete)"
git push origin main

# Vercel auto-deploys on push to main
# Monitor deployment at vercel.com dashboard
```

### 3. Post-Deployment Testing
- [ ] App loads without 500 errors
- [ ] Can create a post
- [ ] Can add comment to post
- [ ] Can like post
- [ ] Can follow user
- [ ] Can send chat message
- [ ] Can upload resource
- [ ] Console has no critical errors
- [ ] All API calls return data

### 4. Monitoring
- [ ] Set up error tracking (Sentry recommended)
- [ ] Monitor API response times
- [ ] Track failed requests
- [ ] Check Appwrite database logs for errors

---

## ⚠️ KNOWN LIMITATIONS (PHASE 1)

The following features are NOT yet deployed:
- [ ] Pod system (will add in Phase 2)
- [ ] Auth pages (login/register need UI)
- [ ] Notifications display (created but not shown)
- [ ] Calendar system
- [ ] Analytics
- [ ] Advanced features (threading, mentions, etc.)

Users CAN do:
- ✅ Create, read, update, delete posts
- ✅ Comment on posts
- ✅ Like posts and comments
- ✅ Save posts for later
- ✅ Follow other users
- ✅ Send messages in chat
- ✅ Upload and share resources

---

## 🆘 ROLLBACK PLAN

If critical issues found:

1. **Quick rollback** (if within 1 minute):
   ```
   Vercel dashboard > Deployments > Revert to previous
   ```

2. **Manual rollback** (if within 1 hour):
   ```bash
   git revert HEAD
   git push origin main
   # Vercel auto-deploys the revert commit
   ```

3. **Full rollback** (emergency):
   - Contact Vercel support or
   - Temporarily disable the deployment from Vercel dashboard
   - Deploy from a backup branch

---

## 📞 ROLLOUT PHASES

### Phase 1 (NOW) - Core Social Features
- Posts, Comments, Likes, Saves, Follow, Chat, Resources
- Audience: Internal testing + early adopters
- Monitoring: Active
- Rollback plan: Ready

### Phase 2 (Next Week) - Pods System
- Pod creation, joining, member management
- Chat rooms per pod
- Pod-specific posts

### Phase 3 (Later) - Advanced Features  
- Real-time notifications UI
- Calendar integration
- Analytics dashboard
- Search and discovery

---

## ✅ SIGN-OFF CHECKLIST

Before proceeding with deployment:

- [ ] All local tests passed
- [ ] Appwrite is configured and collections exist
- [ ] Environment variables set in Vercel
- [ ] No security issues in code
- [ ] No hardcoded credentials
- [ ] Error messages are user-friendly
- [ ] Loading states implemented
- [ ] Mobile-responsive (basic check)
- [ ] No console errors in Chrome DevTools
- [ ] Team reviewed changes

---

## 📊 SUCCESS METRICS (Post-Deployment)

Track these metrics for Phase 1:
- Page load time: < 3s
- API response time: < 500ms
- Error rate: < 0.1%
- User can complete post creation flow: 100%
- User can complete comment flow: 100%
- No data loss on delete operations: 100%

---

## 🎯 TIMELINE

| Task | Duration | Status |
|------|----------|--------|
| Local testing | 1-2 hours | Ready to start |
| Appwrite setup verification | 0.5 hours | Can skip if already done |
| Vercel deployment | 5-10 minutes | Automated |
| Post-deployment monitoring | 2-4 hours | Active observation |
| **Total** | **2-4 hours** | **Can deploy today** |

---

## 📝 NOTES

1. **Data Migration**: If migrating from old system, create migration script first
2. **Backward Compatibility**: Old posts may have different schema, add defensive checks
3. **Rate Limiting**: Consider adding rate limits to prevent abuse
4. **Caching**: Implement caching layer (Redis) for better performance
5. **Analytics**: Start tracking user behaviors for Phase 2 improvements

