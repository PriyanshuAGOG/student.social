# COMPREHENSIVE TESTING GUIDE

## ✅ TASK 1: Update Appwrite Setup Script - COMPLETED

### Changes Made to `scripts/setup-appwrite.js`:

#### 1. **PODS Collection** - Fixed Schema
**Removed:**
- `teamId` (no longer using Appwrite Teams API)

**Added:**
- `image` - Pod cover image URL
- `maxMembers` - Maximum allowed members
- `admins` - Array of admin user IDs
- `inviteCode` - Invite link code
- `inviteExpiry` - When invite expires

**Fixed:**
- `memberCount` now REQUIRED (was optional)

#### 2. **CHAT_ROOMS Collection** - Fixed Schema
**Added:**
- `members` - Required array of member IDs
- `updatedAt` - Last update timestamp
- `unreadCount` - Unread message count

**Fixed:**
- `members` is now REQUIRED (previously only had `participants`)

#### 3. **NOTIFICATIONS Collection** - Enhanced Schema
**Added:**
- `actor` - User ID who performed the action
- `actorName` - Actor's display name
- `actorAvatar` - Actor's avatar URL
- `metadata` - JSON string for additional data
- `postId` - Related post ID
- `commentId` - Related comment ID
- `read` - Alias for isRead
- `createdAt` - Alias for timestamp

**Fixed:**
- `title` is now optional (was required)

#### 4. **COMMENTS Collection** - Enhanced Schema
**Added:**
- `updatedAt` - When comment was last edited
- `authorUsername` - Denormalized username
- `isEdited` - Whether comment was edited

#### 5. **SAVED_POSTS Collection** - NEW
**Purpose:** Track bookmarked posts separately
**Attributes:**
- `userId` - User who saved the post
- `postId` - Post that was saved
- `savedAt` - When the post was saved

#### 6. **Storage Buckets** - Added Pod Images
**Added:**
- `pod_images` - For pod cover photos

---

## ✅ TASK 2: Advanced Pod Features - COMPLETED

### New Functions Added to `lib/appwrite.ts`:

#### 1. **generateInviteLink(podId, userId, expiryDays)**
- Creates shareable invite link for pod
- Only creator/admins can generate
- Configurable expiry (default 7 days)
- Returns: `{ inviteCode, inviteLink, expiresAt }`

**Usage:**
```typescript
const invite = await podService.generateInviteLink(podId, userId, 7)
console.log(invite.inviteLink) // https://peerspark.com/app/pods/join?code=abc123
```

#### 2. **joinWithInviteCode(inviteCode, userId)**
- Joins pod using invite code
- Validates code exists and isn't expired
- Automatically calls joinPod()

**Usage:**
```typescript
await podService.joinWithInviteCode("abc123-xyz", userId)
```

#### 3. **makeAdmin(podId, userId, targetUserId)**
- Promotes member to admin
- Only creator can promote
- Sends notification to promoted user
- Returns: `{ success, admins }`

**Usage:**
```typescript
await podService.makeAdmin(podId, creatorId, memberId)
```

#### 4. **removeAdmin(podId, userId, targetUserId)**
- Removes admin role
- Only creator can demote
- Returns: `{ success, admins }`

**Usage:**
```typescript
await podService.removeAdmin(podId, creatorId, adminId)
```

#### 5. **removeMember(podId, userId, targetUserId)**
- Kicks member from pod (admin/creator only)
- Can't remove creator
- Removes from chat room
- Sends notification to removed user
- Returns: `{ success, memberCount }`

**Usage:**
```typescript
await podService.removeMember(podId, adminId, memberId)
```

---

## 🧪 TASK 3: End-to-End Testing Guide

### Setup Required:

1. **Create .env.local file** (if not exists):
```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
APPWRITE_API_KEY=your-api-key
NEXT_PUBLIC_DATABASE_ID=peerspark-main-db
NEXT_PUBLIC_COLLECTIONS_PROFILES=profiles
NEXT_PUBLIC_COLLECTIONS_POSTS=posts
NEXT_PUBLIC_COLLECTIONS_COMMENTS=comments
NEXT_PUBLIC_COLLECTIONS_PODS=pods
NEXT_PUBLIC_COLLECTIONS_MESSAGES=messages
NEXT_PUBLIC_COLLECTIONS_CHAT_ROOMS=chat_rooms
NEXT_PUBLIC_COLLECTIONS_RESOURCES=resources
NEXT_PUBLIC_COLLECTIONS_NOTIFICATIONS=notifications
NEXT_PUBLIC_COLLECTIONS_CALENDAR_EVENTS=calendar_events
NEXT_PUBLIC_COLLECTIONS_SAVED_POSTS=saved_posts
NEXT_PUBLIC_BUCKETS_AVATARS=avatars
NEXT_PUBLIC_BUCKETS_POST_IMAGES=post_images
NEXT_PUBLIC_BUCKETS_POD_IMAGES=pod_images
NEXT_PUBLIC_BUCKETS_RESOURCES=resources
NEXT_PUBLIC_BUCKETS_ATTACHMENTS=attachments
```

2. **Run Appwrite Setup Script:**
```bash
node scripts/setup-appwrite.js
```

**Expected Output:**
```
🚀 Starting PeerSpark Appwrite Setup...

📍 Configuration:
   Endpoint: https://fra.cloud.appwrite.io/v1
   Project: your-project-id
   Database: peerspark-main-db

✅ Database already exists

📋 Creating collections...
   ✅ profiles (35 attributes)
   ✅ posts (17 attributes)
   ✅ messages (9 attributes)
   ✅ pods (20 attributes)
   ✅ resources (18 attributes)
   ✅ notifications (18 attributes)
   ✅ calendar_events (8 attributes)
   ✅ chat_rooms (11 attributes)
   ✅ comments (12 attributes)
   ✅ saved_posts (3 attributes)

📦 Creating storage buckets...
   ✅ avatars
   ✅ resources
   ✅ attachments
   ✅ post_images
   ✅ pod_images

🎉 Setup completed successfully!
```

### Critical Path Testing:

#### Test 1: Authentication Flow ✅
```bash
# Test Steps:
1. Go to /register
2. Create new account
3. Verify email verification sent
4. Log in at /login
5. Verify redirect to /app/feed

# Expected Results:
- ✅ User created in Appwrite Auth
- ✅ Profile created in PROFILES collection
- ✅ Session cookie set
- ✅ Redirect to feed
```

#### Test 2: Pod Creation & Joining ✅
```bash
# Test Steps:
1. Click "Create Pod" button
2. Fill in: Name, Description, Subject
3. Submit pod creation
4. Verify pod appears in list
5. Another user joins the pod
6. Verify member count updates

# Expected Results:
- ✅ Pod created in PODS collection
- ✅ Chat room created in CHAT_ROOMS collection
- ✅ Creator added as member
- ✅ Member count = 1
- ✅ After join, member count = 2
- ✅ New member added to chat room
```

#### Test 3: Pod Member Management ✅
```bash
# Test Steps:
1. Creator generates invite link
2. Copy invite link
3. Share link with another user
4. User clicks link and joins
5. Creator makes user admin
6. Admin removes a member
7. Creator removes admin role

# Expected Results:
- ✅ Invite link generated
- ✅ Join with link works
- ✅ Member becomes admin
- ✅ Admin can remove members
- ✅ Creator can remove admin role
- ✅ Notifications sent
```

#### Test 4: Chat Messaging ✅
```bash
# Test Steps:
1. Join a pod
2. Go to pod detail page
3. Click "Chat" tab
4. Send a message
5. Another user sees message
6. Reply to message
7. Delete message

# Expected Results:
- ✅ Message sent to MESSAGES collection
- ✅ roomId = chat room from pod
- ✅ Messages display in order
- ✅ Real-time updates (if implemented)
- ✅ Delete removes message
```

#### Test 5: Post Creation & Engagement ✅
```bash
# Test Steps:
1. Create a text post
2. Like the post
3. Unlike the post
4. Comment on post
5. Like comment
6. Delete comment
7. Save post
8. Delete post

# Expected Results:
- ✅ Post created in POSTS collection
- ✅ Like count increments
- ✅ Like count decrements on unlike
- ✅ Comment created in COMMENTS collection
- ✅ Comment like count updates
- ✅ Comment deleted
- ✅ Post saved to SAVED_POSTS
- ✅ Post deleted with cascading cleanup
```

#### Test 6: Resource Upload & Download ✅
```bash
# Test Steps:
1. Go to /app/vault
2. Click "Upload Resource"
3. Select PDF file
4. Fill in title, description
5. Submit upload
6. View resource in list
7. Click download button
8. Bookmark resource
9. Delete resource

# Expected Results:
- ✅ File uploaded to RESOURCES bucket
- ✅ Resource metadata in RESOURCES collection
- ✅ Resource appears in list
- ✅ Download link works
- ✅ Bookmark saved
- ✅ Delete removes file and metadata
```

#### Test 7: Analytics Tracking ✅
```bash
# Test Steps:
1. Join a pod (auto-tracks activity)
2. Study for 30 minutes (track manually)
3. Go to /app/analytics
4. View study stats
5. Generate report
6. Export as CSV

# Expected Results:
- ✅ Activity logged to NOTIFICATIONS (type: activity_log)
- ✅ Study time tracked
- ✅ Stats display correctly
- ✅ Report generated
- ✅ CSV export works
```

#### Test 8: Notifications ✅
```bash
# Test Steps:
1. Another user comments on your post
2. Click notification bell
3. See notification
4. Click notification
5. Navigate to post
6. Mark as read

# Expected Results:
- ✅ Notification created in NOTIFICATIONS
- ✅ Unread count shows
- ✅ Notification displays
- ✅ Click navigates correctly
- ✅ Mark as read updates
```

---

## 🧪 TASK 4: UI Component Testing

### Frontend Components to Test:

#### 1. **Feed Page** (`app/app/feed/page.tsx`)
**Test:**
- [ ] Create post button opens modal
- [ ] Submit post creates post
- [ ] Like button toggles correctly
- [ ] Like count updates
- [ ] Comment button opens comment section
- [ ] Comments display
- [ ] Save button works
- [ ] Delete post removes post

**Fixed Issues:**
- ✅ createPost() call signature fixed
- ✅ toggleLike() call fixed
- ✅ likedBy reference removed

#### 2. **Pod Detail Page** (`app/app/pods/[podId]/page.tsx`)
**Test:**
- [ ] Join button adds user
- [ ] Member count updates
- [ ] Chat tab loads
- [ ] Messages send
- [ ] Members tab shows list
- [ ] Invite button generates link
- [ ] Admin functions visible (creator only)

**Fixed Issues:**
- ✅ getResources() call fixed

#### 3. **Pod Chat Tab** (`components/pods/tabs/PodChatTab.tsx`)
**Test:**
- [ ] Load chat room
- [ ] Send message works
- [ ] Messages display
- [ ] @AI mention works
- [ ] File upload works
- [ ] Reply works

**Fixed Issues:**
- ✅ sendMessage() call signature fixed

#### 4. **Comments Section** (`components/comments-section.tsx`)
**Test:**
- [ ] Load comments
- [ ] Add comment works
- [ ] Edit comment works
- [ ] Delete comment works
- [ ] Like comment works
- [ ] Reply to comment works

**Fixed Issues:**
- ✅ createComment() call fixed
- ✅ deleteComment() call fixed
- ✅ updateComment() call fixed
- ✅ toggleLike() call fixed

#### 5. **Create Pod Modal**
**Test:**
- [ ] Open modal
- [ ] Fill form
- [ ] Upload image
- [ ] Submit creates pod
- [ ] Redirect to pod page

#### 6. **Vault Page** (`app/app/vault/page.tsx`)
**Test:**
- [ ] Upload button works
- [ ] File upload submits
- [ ] Resources display
- [ ] Download button works
- [ ] Bookmark button works
- [ ] Search works
- [ ] Filter works

#### 7. **Analytics Page** (`app/app/analytics/page.tsx`)
**Test:**
- [ ] Load analytics data
- [ ] Stats display
- [ ] Charts render (if implemented)
- [ ] Export button works
- [ ] Filter by date works

---

## 📋 Testing Checklist

### Setup Phase:
- [ ] .env.local file created
- [ ] Appwrite project created
- [ ] API key generated
- [ ] Run setup-appwrite.js script
- [ ] Verify all collections created
- [ ] Verify all buckets created
- [ ] Add domain to Appwrite Platforms

### Core Features:
- [ ] Register new account
- [ ] Login works
- [ ] Logout works
- [ ] Create pod
- [ ] Join pod (verify count updates)
- [ ] Leave pod
- [ ] Send chat message
- [ ] Create post
- [ ] Like post
- [ ] Comment on post
- [ ] Upload resource
- [ ] Download resource

### Advanced Features:
- [ ] Generate invite link
- [ ] Join with invite link
- [ ] Make member admin
- [ ] Remove member (admin)
- [ ] Remove admin role
- [ ] Track analytics
- [ ] View analytics dashboard
- [ ] Export analytics

### Error Handling:
- [ ] Invalid login credentials
- [ ] Missing required fields
- [ ] File size too large
- [ ] Expired invite code
- [ ] Unauthorized actions
- [ ] Network errors

---

## 🐛 Known Issues & Workarounds

### Issue 1: Member Count Not Updating (FIXED ✅)
**Status:** RESOLVED
**Fix:** Added verification step in joinPod()

### Issue 2: Chat Rooms Not Created (FIXED ✅)
**Status:** RESOLVED
**Fix:** Auto-create chat room in createPod()

### Issue 3: Missing Appwrite API Key
**Status:** CONFIGURATION REQUIRED
**Fix:** Add APPWRITE_API_KEY to .env.local

### Issue 4: CORS Errors
**Status:** CONFIGURATION REQUIRED
**Fix:** Add domain to Appwrite Platforms (Settings → Platforms)

---

## ✅ SUCCESS CRITERIA

All tests pass when:
1. ✅ Appwrite setup script runs without errors
2. ✅ All 10 collections created
3. ✅ All 5 buckets created
4. ✅ Users can register and login
5. ✅ Pods can be created and joined
6. ✅ Member counts update correctly
7. ✅ Chat messages send successfully
8. ✅ Posts, likes, and comments work
9. ✅ Resources upload and download
10. ✅ Analytics track activities
11. ✅ Invite links work
12. ✅ Admin functions work
13. ✅ No TypeScript compilation errors
14. ✅ No console errors in browser
15. ✅ No 404 or 500 errors

---

## 📞 Troubleshooting

### Script Fails: "Missing APPWRITE_API_KEY"
**Solution:**
1. Go to Appwrite Console
2. Settings → API Keys
3. Create new key with all scopes
4. Add to .env.local: `APPWRITE_API_KEY=your-key`

### Script Fails: "Collection already exists"
**Solution:** Script handles this gracefully, will skip existing collections

### Login Fails: "Invalid credentials"
**Solution:** Check email verification, or disable verification requirement in Appwrite

### Member Count Not Updating
**Solution:** Already fixed! Ensure you're using latest lib/appwrite.ts

### Chat Room Not Created
**Solution:** Already fixed! createPod() now auto-creates chat room

---

**TESTING STATUS:** Ready to test once .env.local configured!
**ESTIMATED TIME:** 2-3 hours for comprehensive testing
**PRIORITY:** High - Must test before production deployment
