# ✅ PEERSPARK BACKEND SETUP & TESTING COMPLETE CHECKLIST

## Phase 1: Environment Setup
- [ ] `.env.local` created with all required variables
- [ ] `APPWRITE_API_KEY` obtained from Appwrite console
- [ ] `NEXT_PUBLIC_APPWRITE_ENDPOINT` is `https://fra.cloud.appwrite.io/v1`
- [ ] `NEXT_PUBLIC_APPWRITE_PROJECT_ID` is `68921a0d00146e65d29b`
- [ ] `NEXT_PUBLIC_APPWRITE_DATABASE_ID` is `peerspark-main-db`

## Phase 2: Appwrite Configuration
- [ ] API Key has ALL scopes enabled:
  - [ ] account.*
  - [ ] avatars.*
  - [ ] databases.*
  - [ ] files.*
  - [ ] messages.*
  - [ ] storage.*
  - [ ] teams.*
  - [ ] users.*

## Phase 3: Database & Collections
- [ ] Database `peerspark-main-db` created
- [ ] All 8 collections created:
  - [ ] profiles
  - [ ] posts
  - [ ] messages
  - [ ] pods
  - [ ] resources
  - [ ] notifications
  - [ ] calendar_events
  - [ ] chat_rooms

## Phase 4: Collection Permissions
For EACH collection, verify permissions in Appwrite Console:

### profiles collection
- [ ] Setting: read("any")
- [ ] Setting: read("user")
- [ ] Setting: create("user")
- [ ] Setting: update("user")
- [ ] Setting: delete("user")

### posts collection
- [ ] Setting: read("any")
- [ ] Setting: read("user")
- [ ] Setting: create("user")
- [ ] Setting: update("user")
- [ ] Setting: delete("user")

### messages collection
- [ ] Setting: read("any")
- [ ] Setting: read("user")
- [ ] Setting: create("user")
- [ ] Setting: update("user")
- [ ] Setting: delete("user")

### pods collection
- [ ] Setting: read("any")
- [ ] Setting: read("user")
- [ ] Setting: create("user")
- [ ] Setting: update("user")
- [ ] Setting: delete("user")

### resources collection
- [ ] Setting: read("any")
- [ ] Setting: read("user")
- [ ] Setting: create("user")
- [ ] Setting: update("user")
- [ ] Setting: delete("user")

### notifications collection
- [ ] Setting: read("any")
- [ ] Setting: read("user")
- [ ] Setting: create("user")
- [ ] Setting: update("user")
- [ ] Setting: delete("user")

### calendar_events collection
- [ ] Setting: read("any")
- [ ] Setting: read("user")
- [ ] Setting: create("user")
- [ ] Setting: update("user")
- [ ] Setting: delete("user")

### chat_rooms collection
- [ ] Setting: read("any")
- [ ] Setting: read("user")
- [ ] Setting: create("user")
- [ ] Setting: update("user")
- [ ] Setting: delete("user")

## Phase 5: Storage Buckets
- [ ] All 4 buckets created:
  - [ ] avatars
  - [ ] resources
  - [ ] attachments
  - [ ] post_images

## Phase 6: Storage Bucket Permissions
For EACH bucket, verify permissions in Appwrite Console:

### avatars bucket
- [ ] Setting: read("any")
- [ ] Setting: read("user")
- [ ] Setting: create("user")
- [ ] Setting: update("user")
- [ ] Setting: delete("user")

### resources bucket
- [ ] Setting: read("any")
- [ ] Setting: read("user")
- [ ] Setting: create("user")
- [ ] Setting: update("user")
- [ ] Setting: delete("user")

### attachments bucket
- [ ] Setting: read("any")
- [ ] Setting: read("user")
- [ ] Setting: create("user")
- [ ] Setting: update("user")
- [ ] Setting: delete("user")

### post_images bucket
- [ ] Setting: read("any")
- [ ] Setting: read("user")
- [ ] Setting: create("user")
- [ ] Setting: update("user")
- [ ] Setting: delete("user")

## Phase 7: Code Setup
- [ ] `lib/appwrite.ts` configured with client initialization
- [ ] `lib/auth-context.tsx` created with AuthProvider
- [ ] `lib/protect-route.tsx` created for protected routes
- [ ] Root `app/layout.tsx` wrapped with AuthProvider
- [ ] App `app/app/layout.tsx` wrapped with ProtectRoute
- [ ] Login page uses real `authService.login()`
- [ ] Register page uses real `authService.register()`
- [ ] Sidebar uses `useAuth()` hook

## Phase 8: Backend Service Validation
Run tests:
```bash
node scripts/test-backend.js
```

Verify all tests pass:
- [ ] Database Connection - PASS
- [ ] Collections Exist - PASS
- [ ] Storage Buckets Exist - PASS
- [ ] Collection Permissions - PASS
- [ ] Bucket Permissions - PASS
- [ ] Environment Variables - PASS

## Phase 9: Development Server
```bash
pnpm install
pnpm dev
```
- [ ] Server starts without errors
- [ ] http://localhost:3000 accessible
- [ ] No errors in terminal
- [ ] No errors in browser console

## Phase 10: Authentication Testing

### Sign Up Test
1. [ ] Open http://localhost:3000
2. [ ] Click "Create Account"
3. [ ] Enter email: `test@example.com`
4. [ ] Enter password: `TestPassword123!`
5. [ ] Enter name: `Test User`
6. [ ] Click "Sign Up"
7. [ ] Expected: Redirected to `/app/feed`
8. [ ] Expected: User appears in sidebar
9. [ ] Expected: No "unauthorized" errors

### Login Test
1. [ ] Open http://localhost:3000
2. [ ] Click "Sign In"
3. [ ] Enter email: `test@example.com`
4. [ ] Enter password: `TestPassword123!`
5. [ ] Click "Sign In"
6. [ ] Expected: Redirected to `/app/feed`
7. [ ] Expected: User data shown in sidebar
8. [ ] Expected: Session persists on refresh

### Logout Test
1. [ ] Click user menu in sidebar
2. [ ] Click "Logout"
3. [ ] Expected: Redirected to `/login`
4. [ ] Expected: Session cleared
5. [ ] Expected: Can't access `/app/*` routes

### Password Change Test
1. [ ] Navigate to `/app/settings`
2. [ ] Click "Change Password"
3. [ ] Enter old password: `TestPassword123!`
4. [ ] Enter new password: `NewPassword123!`
5. [ ] Confirm new password: `NewPassword123!`
6. [ ] Click "Change Password"
7. [ ] Expected: Success message
8. [ ] Logout and login with new password

## Phase 11: Post Creation
1. [ ] Navigate to `/app/feed`
2. [ ] Click "Create Post"
3. [ ] Enter content: "Test post from PeerSpark!"
4. [ ] Select type: "Achievement"
5. [ ] Click "Post"
6. [ ] Expected: Post appears in feed
7. [ ] Expected: No "unauthorized" errors
8. [ ] Expected: Author is current user
9. [ ] Expected: Timestamp shows

## Phase 12: Pod Management
1. [ ] Navigate to `/app/pods`
2. [ ] Click "Create Pod"
3. [ ] Enter name: "Math Study Pod"
4. [ ] Enter description: "Learning calculus"
5. [ ] Select subject: "Mathematics"
6. [ ] Select visibility: "Public"
7. [ ] Click "Create"
8. [ ] Expected: Pod created
9. [ ] Expected: You are added as creator
10. [ ] Expected: Can see pod in your pods list

### Join Pod Test
1. [ ] Click "Browse Pods" or go to `/app/explore`
2. [ ] Click on a different pod
3. [ ] Click "Join Pod"
4. [ ] Expected: You are added to members
5. [ ] Expected: Can send messages in pod chat
6. [ ] Click "Leave Pod"
7. [ ] Expected: You are removed from members

## Phase 13: Chat & Messaging
1. [ ] Navigate to `/app/chat`
2. [ ] Select a pod or user
3. [ ] Type message: "Hello team!"
4. [ ] Click "Send"
5. [ ] Expected: Message appears in chat
6. [ ] Expected: Timestamp shows
7. [ ] Expected: Author is you

### File Upload in Chat
1. [ ] Click attachment icon
2. [ ] Select an image or PDF
3. [ ] Expected: File uploaded successfully
4. [ ] Expected: File appears in chat

## Phase 14: Resource Management
1. [ ] Navigate to `/app/vault`
2. [ ] Click "Upload Resource"
3. [ ] Select a PDF or document
4. [ ] Enter title: "Chapter 5 Notes"
5. [ ] Enter description: "Key concepts"
6. [ ] Click "Upload"
7. [ ] Expected: Resource uploaded
8. [ ] Expected: Appears in your vault

### Download Resource
1. [ ] Find a resource in vault
2. [ ] Click "Download"
3. [ ] Expected: File download starts
4. [ ] Expected: File is correct format

## Phase 15: Profile Management
1. [ ] Click on profile icon in sidebar
2. [ ] Click "Edit Profile"
3. [ ] Update bio: "Computer Science student"
4. [ ] Update interests: ["Math", "Physics"]
5. [ ] Click "Save"
6. [ ] Expected: Profile updated
7. [ ] Expected: Changes reflect on profile page

### Avatar Upload
1. [ ] Click profile icon
2. [ ] Click "Change Avatar"
3. [ ] Select an image
4. [ ] Expected: Image uploaded
5. [ ] Expected: Avatar shows in sidebar and profile

## Phase 16: Calendar & Events
1. [ ] Navigate to `/app/calendar`
2. [ ] Click date to create event
3. [ ] Enter title: "Math Study Session"
4. [ ] Enter time: 10:00 AM - 11:00 AM
5. [ ] Click "Create Event"
6. [ ] Expected: Event appears on calendar
7. [ ] Expected: Can click to edit/delete

## Phase 17: Notifications
1. [ ] Navigate to `/app/notifications`
2. [ ] Create a post
3. [ ] Have another user like your post (or test with test data)
4. [ ] Expected: Notification appears
5. [ ] Expected: Can mark as read
6. [ ] Expected: Badge shows unread count

## Phase 18: Leaderboard
1. [ ] Navigate to `/app/leaderboard`
2. [ ] Expected: Users sorted by points
3. [ ] Expected: Your rank shows
4. [ ] Expected: Current user highlighted

## Phase 19: Explore Page
1. [ ] Navigate to `/app/explore`
2. [ ] Expected: See trending posts
3. [ ] Expected: See recommended pods
4. [ ] Expected: See featured users
5. [ ] Expected: Can interact with content

## Phase 20: Mobile Responsiveness
- [ ] On mobile device or browser (375px width):
  - [ ] Sidebar collapses to hamburger
  - [ ] Navigation works on mobile
  - [ ] All forms are mobile-friendly
  - [ ] Touch interactions work

## Phase 21: Error Handling
Test error cases:

### Invalid Login
- [ ] Try login with wrong password
- [ ] Expected: Error message "Invalid email or password"
- [ ] Expected: Stay on login page
- [ ] Expected: Form clears

### Invalid Registration
- [ ] Try register with existing email
- [ ] Expected: Error message "User already exists"
- [ ] Try register with weak password
- [ ] Expected: Error message about password requirements

### Network Error
- [ ] Disable network in DevTools
- [ ] Try to create post
- [ ] Expected: Error message shown
- [ ] Expected: Can retry when network back

## Phase 22: Cross-Browser Testing
- [ ] Chrome - All features working
- [ ] Firefox - All features working
- [ ] Safari - All features working
- [ ] Edge - All features working

## Phase 23: Performance
- [ ] Feed loads in < 2 seconds
- [ ] Chat loads in < 1 second
- [ ] Posts scroll smoothly
- [ ] No console warnings/errors
- [ ] No network waterfalls

## Phase 24: Security
- [ ] Can't access `/app/*` without login
- [ ] Session stored in secure cookie
- [ ] API key not exposed in frontend code
- [ ] Passwords not stored in localStorage
- [ ] CORS properly configured

## Phase 25: Documentation
- [ ] QUICK_START.md is accurate
- [ ] APPWRITE_CRITICAL_FIX.md covers all steps
- [ ] APPWRITE_DEBUG_GUIDE.md helps troubleshoot
- [ ] BACKEND_SERVICES_GUIDE.md explains all services

## Final Sign-Off

**Date Completed:** ___________
**Tested By:** ___________
**Platform:** ___________

### Overall Status

- [ ] All tests passed
- [ ] All features working
- [ ] No critical errors
- [ ] Ready for production testing
- [ ] Ready for user acceptance testing

### Known Issues (if any)

1. _____________________________
2. _____________________________
3. _____________________________

### Next Steps

1. Invite test users to the platform
2. Conduct user acceptance testing
3. Gather feedback on features
4. Plan for production deployment
5. Set up monitoring and logging

---

**Important:** Keep this checklist updated as you test. If any item fails, refer to:
- APPWRITE_CRITICAL_FIX.md - For permission/setup issues
- APPWRITE_DEBUG_GUIDE.md - For debugging errors
- BACKEND_SERVICES_GUIDE.md - For service-specific issues
