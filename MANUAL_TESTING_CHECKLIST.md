# PeerSpark Platform - Manual Testing Checklist

Use this checklist to verify all features are working correctly.

## 🔐 Authentication Tests

### Registration Flow
- [ ] Navigate to /register
- [ ] Enter valid details (name, email, strong password)
- [ ] Click "Create Account"
- [ ] Verify success message appears
- [ ] Check email for verification link
- [ ] Click verification link
- [ ] Verify account is activated

### Login Flow
- [ ] Navigate to /login
- [ ] Try logging in with unverified account (should fail)
- [ ] Verify account via email
- [ ] Login with verified credentials (should work)
- [ ] Verify redirect to onboarding (new user) or dashboard
- [ ] Check that user info appears in sidebar

### Password Reset
- [ ] Click "Forgot Password" on login
- [ ] Enter email address
- [ ] Check email for reset link
- [ ] Click reset link
- [ ] Enter new password
- [ ] Verify password is changed
- [ ] Login with new password

## 👤 Profile Tests

### Profile Setup
- [ ] Navigate to /app/profile
- [ ] Update profile name
- [ ] Update bio
- [ ] Upload avatar image
- [ ] Save changes
- [ ] Verify changes are saved
- [ ] Refresh page and verify data persists

### Profile Viewing
- [ ] View own profile
- [ ] Click on another user's name (in posts/pods)
- [ ] View their public profile
- [ ] Check if badges/stats display correctly

## 🎓 Onboarding Tests

### Complete Onboarding Flow
- [ ] Select learning identity
- [ ] Choose at least 3 interests
- [ ] Select learning vibes
- [ ] Set learning goals
- [ ] Choose learning pace
- [ ] Select session types
- [ ] Set availability
- [ ] View pod recommendations
- [ ] Join or skip pods
- [ ] Complete profile
- [ ] Verify redirect to dashboard

## 👥 Pod Tests

### Create Pod
- [ ] Navigate to /app/pods
- [ ] Click "Create Pod"
- [ ] Fill in all required fields:
  - [ ] Name
  - [ ] Description
  - [ ] Category
  - [ ] Difficulty
  - [ ] Tags
- [ ] Set visibility (public/private)
- [ ] Click "Create"
- [ ] Verify pod appears in "My Pods"
- [ ] Open pod detail page

### Join Pod
- [ ] Navigate to /app/pods
- [ ] Browse available pods
- [ ] Click "Join Pod" on any pod
- [ ] Verify success message
- [ ] Verify pod appears in "My Pods"
- [ ] Open pod and verify membership

### Pod Detail Page
- [ ] Open any pod detail page
- [ ] Verify pod information displays
- [ ] Check members list
- [ ] View resources tab
- [ ] View events tab
- [ ] View chat tab
- [ ] Check all tabs load correctly

### Leave Pod
- [ ] Open a pod you're a member of
- [ ] Click settings or leave option
- [ ] Click "Leave Pod"
- [ ] Confirm leaving
- [ ] Verify pod removed from "My Pods"

## 📝 Post Tests

### Create Post
- [ ] Navigate to /app/feed
- [ ] Click "+" floating button
- [ ] Enter post content
- [ ] Select visibility (Public or Pod)
- [ ] Add tags
- [ ] Click "Create Post"
- [ ] Verify post appears in feed
- [ ] Verify timestamp is correct

### Interact with Posts
- [ ] Like a post (heart icon)
- [ ] Verify like count increases
- [ ] Unlike the post
- [ ] Verify like count decreases
- [ ] Bookmark a post
- [ ] View bookmarked posts

### Feed Filters
- [ ] Switch between "All", "Following", "Pods" tabs
- [ ] Verify different content appears
- [ ] Search for posts
- [ ] Filter by tags

## 💬 Messaging Tests

### Pod Chat
- [ ] Open a pod you're a member of
- [ ] Navigate to chat tab
- [ ] Send a text message
- [ ] Verify message appears
- [ ] Send another message
- [ ] Check message history

### Direct Messages
- [ ] Navigate to /app/chat
- [ ] Start a new direct message
- [ ] Select a user
- [ ] Send message
- [ ] Verify message is received
- [ ] Check conversation history

### File Sharing
- [ ] In any chat, click attachment icon
- [ ] Select a file
- [ ] Upload file
- [ ] Verify file appears in chat
- [ ] Click to download/view file

### AI Assistant in Chat
- [ ] In any chat, type "@ai how do I learn DSA?"
- [ ] Send message
- [ ] Wait for AI response
- [ ] Verify AI responds with relevant answer

## 📚 Resource Tests

### Upload Resource
- [ ] Navigate to /app/vault
- [ ] Click "Upload Resource"
- [ ] Select a file
- [ ] Fill in title and description
- [ ] Choose category
- [ ] Set visibility
- [ ] Click "Upload"
- [ ] Verify resource appears in vault

### Browse Resources
- [ ] View all resources
- [ ] Filter by category
- [ ] Search for specific resource
- [ ] Sort by date/popularity
- [ ] Open resource detail

### Download Resource
- [ ] Click on any resource
- [ ] Click "Download" button
- [ ] Verify file downloads
- [ ] Check download count increases

### Pod Resources
- [ ] Open a pod detail page
- [ ] Navigate to resources tab
- [ ] Upload a pod-specific resource
- [ ] Verify resource appears in pod
- [ ] Verify resource visibility is pod-only

## 📅 Calendar Tests

### Create Event
- [ ] Navigate to /app/calendar
- [ ] Click "Add Event" or click on a date
- [ ] Fill in event details:
  - [ ] Title
  - [ ] Start time
  - [ ] End time
  - [ ] Type (study, meeting, deadline, exam)
- [ ] Assign to pod (optional)
- [ ] Click "Create"
- [ ] Verify event appears on calendar

### View Events
- [ ] Navigate to /app/calendar
- [ ] Switch between month/week/day views
- [ ] Click on an event
- [ ] Verify event details display
- [ ] Check event time is correct

### RSVP to Event
- [ ] Open a pod event
- [ ] Click "Going" or "Not Going"
- [ ] Verify RSVP is saved
- [ ] Check RSVP count updates

### Edit Event
- [ ] Click on your own event
- [ ] Click "Edit"
- [ ] Change event details
- [ ] Save changes
- [ ] Verify changes are reflected

### Delete Event
- [ ] Click on your own event
- [ ] Click "Delete"
- [ ] Confirm deletion
- [ ] Verify event is removed from calendar

## 🤖 AI Assistant Tests

### AI Chat
- [ ] Navigate to /app/ai
- [ ] Type a question about studying
- [ ] Send message
- [ ] Verify AI responds
- [ ] Ask follow-up question
- [ ] Verify conversation context is maintained

### AI Suggestions
- [ ] Ask "How do I prepare for coding interviews?"
- [ ] Verify AI provides structured response
- [ ] Ask "Create a study plan for DSA"
- [ ] Verify AI creates actionable plan

### AI in Dashboard
- [ ] Check if AI suggestions appear on dashboard
- [ ] Click on AI suggestion
- [ ] Verify it opens AI assistant with context

## 🏠 Dashboard Tests

### Daily Study Plan
- [ ] Navigate to /app/home
- [ ] View daily study plan items
- [ ] Check off a completed item
- [ ] Verify item is marked complete
- [ ] Check if new suggestions appear

### Upcoming Sessions
- [ ] View upcoming sessions section
- [ ] Click "Join Session"
- [ ] Verify session details
- [ ] Check session time

### Pod Activity
- [ ] View active pods section
- [ ] Check latest pod updates
- [ ] Click on a pod
- [ ] Verify navigation works

### Streaks & Points
- [ ] Check current streak display
- [ ] Check total points
- [ ] Check level/rank
- [ ] View badges earned

## 🏆 Leaderboard Tests

### View Rankings
- [ ] Navigate to /app/leaderboard
- [ ] View global leaderboard
- [ ] Filter by pod
- [ ] Check your ranking
- [ ] View top performers

### Leaderboard Metrics
- [ ] Check sorting options (points, streak, level)
- [ ] Switch sort order
- [ ] Verify correct ranking

## 📊 Analytics Tests

### Study Analytics
- [ ] Navigate to /app/analytics
- [ ] View study time chart
- [ ] Check daily/weekly/monthly stats
- [ ] View subject breakdown
- [ ] Check progress trends

### Performance Metrics
- [ ] View completion rate
- [ ] Check session attendance
- [ ] View resource usage
- [ ] Check engagement metrics

## 🎥 Video Call Tests

### Start Pod Meeting
- [ ] Open a pod detail page
- [ ] Click "Start Meeting"
- [ ] Verify Jitsi interface loads
- [ ] Test camera on/off
- [ ] Test microphone on/off
- [ ] Test screen sharing
- [ ] Invite another member
- [ ] End meeting

### 1:1 Call
- [ ] Navigate to user profile
- [ ] Click "Start Call"
- [ ] Verify Jitsi loads
- [ ] Test audio/video
- [ ] End call

## 🔔 Notification Tests

### Receive Notifications
- [ ] Perform an action that triggers notification (e.g., join pod)
- [ ] Navigate to /app/notifications
- [ ] Verify notification appears
- [ ] Check notification content
- [ ] Click notification
- [ ] Verify navigation works

### Mark as Read
- [ ] Click on unread notification
- [ ] Verify it marks as read
- [ ] Click "Mark all as read"
- [ ] Verify all notifications marked

## ⚙️ Settings Tests

### Account Settings
- [ ] Navigate to /app/settings
- [ ] Update display name
- [ ] Update email preferences
- [ ] Change password
- [ ] Save changes
- [ ] Verify changes persist

### Notification Settings
- [ ] Toggle notification preferences
- [ ] Test each notification type
- [ ] Save settings
- [ ] Verify notifications respect settings

### Theme Settings
- [ ] Toggle dark mode
- [ ] Verify theme changes
- [ ] Toggle light mode
- [ ] Verify theme changes
- [ ] Refresh page
- [ ] Verify theme persists

## 📱 Mobile Tests

### Responsive Design
- [ ] Open site on mobile device or resize browser
- [ ] Verify mobile navigation appears
- [ ] Test bottom navigation bar
- [ ] Test hamburger menu
- [ ] Verify all features work on mobile

### Mobile-Specific Features
- [ ] Test swipe gestures (if any)
- [ ] Test mobile keyboard behavior
- [ ] Test file uploads on mobile
- [ ] Test image uploads on mobile

## 🔍 Search Tests

### Search Pods
- [ ] Navigate to /app/pods or /app/explore
- [ ] Use search bar
- [ ] Search for pod by name
- [ ] Verify results appear
- [ ] Filter results

### Search Users
- [ ] Search for users
- [ ] Verify results display
- [ ] Click on user profile
- [ ] Verify profile loads

### Search Resources
- [ ] Navigate to /app/vault
- [ ] Search for resources
- [ ] Filter by category
- [ ] Verify search works

## 🔒 Security Tests

### Authentication
- [ ] Try accessing protected routes without login
- [ ] Verify redirect to login page
- [ ] Login and verify access granted
- [ ] Logout
- [ ] Verify session cleared

### Permissions
- [ ] Try editing someone else's post (should fail)
- [ ] Try deleting someone else's pod (should fail)
- [ ] Try accessing private pods (should fail)
- [ ] Verify only members can see pod content

### Input Validation
- [ ] Try submitting empty forms
- [ ] Verify error messages appear
- [ ] Try invalid email formats
- [ ] Verify validation works
- [ ] Try weak passwords
- [ ] Verify password requirements enforced

## 🐛 Error Handling Tests

### Network Errors
- [ ] Disconnect internet
- [ ] Try performing an action
- [ ] Verify error message appears
- [ ] Reconnect internet
- [ ] Verify app recovers

### Invalid Data
- [ ] Try accessing non-existent pod (/app/pods/invalid)
- [ ] Verify error handling
- [ ] Try invalid routes
- [ ] Verify 404 or redirect

### Edge Cases
- [ ] Try uploading very large file
- [ ] Try posting very long content
- [ ] Try creating pod with special characters
- [ ] Verify proper handling

## ✅ Final Checks

### Overall Functionality
- [ ] All authentication flows work
- [ ] All CRUD operations successful
- [ ] Real-time features functional
- [ ] File uploads/downloads work
- [ ] AI features respond
- [ ] Navigation works throughout
- [ ] No console errors
- [ ] No broken images
- [ ] No broken links
- [ ] Mobile responsive

### Performance
- [ ] Pages load quickly
- [ ] Images load properly
- [ ] No significant lag
- [ ] Smooth transitions
- [ ] Efficient re-renders

### User Experience
- [ ] Intuitive navigation
- [ ] Clear feedback on actions
- [ ] Helpful error messages
- [ ] Consistent design
- [ ] Accessible UI

---

## 📊 Test Results

### Summary
- **Total Tests:** [Fill in]
- **Passed:** [Fill in]
- **Failed:** [Fill in]
- **Skipped:** [Fill in]

### Issues Found
[List any issues discovered during testing]

### Recommendations
[List any improvements or suggestions]

---

**Testing Date:** __________  
**Tester:** __________  
**Environment:** [ ] Local [ ] Staging [ ] Production  
**Browser:** __________  
**OS:** __________

---

*Last Updated: January 1, 2026*
