# Testing Guide - Premium Luxury Chat & Calling System

## Overview
The application has been fully redesigned with a luxury Apple/Arc-style UI and complete audio/video calling system. This guide walks you through testing all features.

---

## Chat Features Testing

### 1. Chat Page Access
- [ ] Navigate to `/app/chat`
- [ ] Verify three-panel desktop layout loads
- [ ] Check mobile: should collapse to mobile view
- [ ] LeftRail expands/collapses on hover

### 2. Conversation List
- [ ] All conversations load with profile pictures
- [ ] Search filter works in real-time
- [ ] Unread badges show correctly
- [ ] Click conversation to open chat
- [ ] Last message preview shows

### 3. Message Sending
- [ ] Type message and hit Enter
- [ ] Message appears immediately (optimistic update)
- [ ] Delivery indicator shows (check mark)
- [ ] Message appears for other users
- [ ] Emoji reactions work (click emoji icon)

### 4. File Attachments
- [ ] Click attachment button in composer
- [ ] Select file from device
- [ ] Attachment preview shows in message
- [ ] File can be downloaded
- [ ] Image files display inline

### 5. Advanced Chat
- [ ] Type indicator shows when others type
- [ ] Online/offline indicator visible in header
- [ ] Read receipts show when other user opens
- [ ] Reply to message (click menu → Reply)
- [ ] Edit message (click menu → Edit)
- [ ] Delete message with confirmation

### 6. Direct Messages
- [ ] Navigate to `/app/messages/[userId]`
- [ ] Single conversation interface loads
- [ ] Messages sync in real-time
- [ ] Message history loads
- [ ] Back button returns to chat

---

## Calling Features Testing

### 1. Incoming Call
**Setup**: Open chat with another user (can use dev tools to simulate)

- [ ] Call button visible in ChatHeader
- [ ] Click "voice call" or "video call" button
- [ ] Call initiates and shows `OutgoingCallScreen`
- [ ] Status shows "Calling..."
- [ ] Remote user gets `IncomingCallOverlay`
- [ ] Overlay shows caller name and avatar
- [ ] 45-second timeout auto-rejects if not answered

### 2. Accept Call
- [ ] Receiver clicks "Accept" on overlay
- [ ] Both users see `ActiveCallScreen`
- [ ] Audio/video stream initializes
- [ ] Call duration timer starts
- [ ] Participant info displays correctly
- [ ] Mute/unmute button works
- [ ] Camera toggle works (video calls)

### 3. Call Controls
- [ ] Mute audio - icon changes
- [ ] Unmute audio - audio returns
- [ ] Turn off camera - video stream stops
- [ ] Turn on camera - video resumes
- [ ] End call button disconnects both users

### 4. Call Rejection
- [ ] Click "Reject" on incoming call
- [ ] Caller sees "Call rejected" message
- [ ] Both users return to normal chat
- [ ] No error notifications

### 5. Call Timeout
- [ ] Initiate call but don't answer
- [ ] Wait 45 seconds
- [ ] Call auto-cancels
- [ ] Both users see "Call ended" notification

---

## UI/UX Testing

### 1. Design Elements
- [ ] Color scheme is black/white only (luxury minimal)
- [ ] Message bubbles have glass morphism effect
- [ ] Hover effects are smooth (200ms transitions)
- [ ] Icons are consistent and recognizable
- [ ] Typography hierarchy is clear

### 2. Animations
- [ ] Messages slide in smoothly
- [ ] Typing indicator bounces
- [ ] Overlay fades in on incoming call
- [ ] Compose box scales in
- [ ] Online indicator pulses subtly

### 3. Responsiveness
- [ ] Desktop: 3-panel layout at 1440px+
- [ ] Tablet: 2-panel at 1024px+
- [ ] Mobile: Full-screen at 640px-
- [ ] Left rail collapses on mobile
- [ ] Touch targets are 44px minimum

### 4. Accessibility
- [ ] Screen reader reads message content
- [ ] Keyboard navigation works (Tab)
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators visible
- [ ] Alt text on images

---

## Performance Testing

### 1. Load Time
- [ ] Chat page loads in <2 seconds
- [ ] Conversation list renders <500ms
- [ ] Call initiates <1 second
- [ ] No layout shift (CLS < 0.1)

### 2. Network
- [ ] Works on 4G (throttle in DevTools)
- [ ] Graceful degradation on slow network
- [ ] Offline mode shows message
- [ ] Reconnects automatically

### 3. Memory
- [ ] No memory leaks after 10+ messages
- [ ] Scrolling stays smooth
- [ ] No console errors
- [ ] Cleanup happens on unmount

---

## Error Handling Testing

### 1. Network Errors
- [ ] Disconnect internet
- [ ] Try to send message
- [ ] Error toast appears
- [ ] Retry button works
- [ ] Reconnect shows success message

### 2. Call Errors
- [ ] Reject invalid LiveKit token
- [ ] Missing LIVEKIT_API_KEY shows error
- [ ] Graceful fallback to error state
- [ ] User can try again

### 3. Input Validation
- [ ] Empty message blocked
- [ ] File size limit enforced
- [ ] Invalid file types rejected
- [ ] Proper error messages shown

---

## Browser Compatibility

Test in these browsers:
- [ ] Chrome 90+ (Windows/Mac)
- [ ] Firefox 88+ (Windows/Mac)
- [ ] Safari 14+ (Mac/iOS)
- [ ] Edge 90+ (Windows)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## Database Testing

### 1. Message Storage
- [ ] Messages persist after refresh
- [ ] Message history loads on open
- [ ] Reactions saved in metadata
- [ ] File URLs resolve correctly

### 2. Call Records
- [ ] Call record created on start
- [ ] Call status updates correctly
- [ ] Call duration recorded
- [ ] Participant info stored

### 3. Presence
- [ ] Online status updates
- [ ] Typing indicators sync
- [ ] Offline clears after timeout
- [ ] Presence persists briefly

---

## Configuration Checklist

Before full testing:

- [ ] LIVEKIT_API_KEY set in .env
- [ ] LIVEKIT_API_SECRET set in .env
- [ ] NEXT_PUBLIC_LIVEKIT_URL set in .env
- [ ] Appwrite collections exist
- [ ] Database connected
- [ ] Auth working
- [ ] Profiles populated

---

## Known Limitations

1. **Edit Message** - Currently optimistic only (no server sync)
2. **Call Participants** - Limited to 2 per call (can expand with LiveKit)
3. **Message Search** - Basic search only (can add full-text)
4. **Call History** - In-memory only (persists to DB)
5. **Notifications** - Browser notifications not implemented

---

## Performance Metrics to Check

Using DevTools:

- [ ] First Contentful Paint (FCP) < 1.5s
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] Cumulative Layout Shift (CLS) < 0.1
- [ ] Interaction to Next Paint (INP) < 200ms
- [ ] JavaScript bundle < 200KB gzipped
- [ ] CSS bundle < 50KB gzipped

---

## Success Criteria

All features fully functional when:

1. ✓ Chat messages send/receive instantly
2. ✓ Voice calls initiate and connect
3. ✓ Video calls show stream
4. ✓ UI renders without errors
5. ✓ No console errors or warnings
6. ✓ Responsive on all screen sizes
7. ✓ Keyboard navigation works
8. ✓ Animations are smooth (60fps)
9. ✓ Performance metrics acceptable
10. ✓ All error cases handled gracefully

---

## Next Steps After Testing

1. **Deploy to Production** - `vercel deploy`
2. **Configure LiveKit Cloud** - Get enterprise account
3. **Set Up Monitoring** - Add Sentry/PostHog
4. **Performance Optimize** - Profile and tune
5. **Scale Infrastructure** - Setup CDN and caching

---

**Test Environment**: Local dev server (npm run dev)
**Estimated Testing Time**: 30-45 minutes for full coverage
**Last Updated**: June 3, 2026
