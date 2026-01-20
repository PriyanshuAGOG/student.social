# PeerSpark Platform Stabilization Changelog

**Date:** January 20, 2026  
**Status:** Phase 1 Complete - Core Fixes Applied

## Summary

This document outlines the changes made to stabilize the PeerSpark platform from demo/prototype quality to enterprise-grade production stability.

---

## Critical Fixes Applied

### 1. Comments Creation - Missing `createdAt` Field (400 Bad Request)

**Problem:** Comments creation was failing with "Missing required attribute createdAt"

**Solution:** Updated `commentService.createComment()` in [lib/appwrite.ts](lib/appwrite.ts) to include both `timestamp` and `createdAt` fields:

```typescript
const now = new Date().toISOString()
// Create comment with both timestamp and createdAt for compatibility
{
  timestamp: now,
  createdAt: now, // Added for schema compatibility
  // ... other fields
}
```

**Schema Update:** Added `createdAt` field to comments schema in [scripts/update-schema.js](scripts/update-schema.js)

---

### 2. Pod Creation - Missing `teamId` Field (400 Bad Request)

**Problem:** Pod creation was failing with "Missing required attribute teamId"

**Solution:** Updated `podService.createPod()` in [lib/appwrite.ts](lib/appwrite.ts) to auto-generate a teamId:

```typescript
// Generate a unique teamId (required by schema, but we're not using Appwrite Teams)
const generatedTeamId = `pod_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
```

**Schema Update:** Made `teamId` optional in [scripts/update-schema.js](scripts/update-schema.js) since it's auto-generated

---

### 3. Profile Creation Workflow (404 in Messaging)

**Problem:** Profile documents were not being created reliably during registration, causing 404 errors in messaging flows.

**Solution:** 
1. Added new `ensureProfileExists()` function in [lib/appwrite.ts](lib/appwrite.ts):
   - Guarantees profile exists by creating if missing
   - Handles race conditions (409 conflict)
   - Uses idempotent create pattern

2. Updated [lib/auth-context.tsx](lib/auth-context.tsx) to use `ensureProfileExists()` instead of `getProfile()`:
   - `checkSession()` now ensures profile exists
   - `refreshUser()` now ensures profile exists

---

### 4. Check-ins and Commitments (401 Unauthorized)

**Problem:** 401 errors were being masked by "local fallback" that created fake documents, causing data divergence.

**Solution:** Removed silent fallback pattern and replaced with proper error handling:

```typescript
// Before: Silent fallback that masks errors
if (err?.code === 401) {
  return { $id: `local-${Date.now()}`, ... } // BAD: Creates fake data
}

// After: Clear error with actionable message
if (err?.code === 401) {
  throw new Error("You don't have permission. Please try logging out and back in.")
}
```

**Schema Update:** Added explicit permissions to `pod_commitments` and `pod_check_ins` collections:
```javascript
permissions: {
  read: ['role:users'],
  write: ['role:users'],
  update: ['role:users'],
  delete: ['role:users'],
}
```

---

### 5. WebSocket/Realtime Instability

**Problem:** 
- "WebSocket already in CLOSING or CLOSED state" errors
- Multiple heartbeat intervals
- Reconnect logic spamming
- Subscriptions not cleaned up on route change

**Solution:** Completely rewrote [lib/websocket-manager.ts](lib/websocket-manager.ts):

New features:
- **Heartbeat monitoring** with proper cleanup
- **Exponential backoff reconnection** (1s → 2s → 4s → ... max 30s)
- **Maximum reconnect attempts** (5) with proper error handling
- **Tab visibility handling** for better connection management
- **Centralized subscription management** with safe cleanup
- **Warning suppression** for expected WebSocket close errors

Usage:
```typescript
import { initializeWebSocketManager, getWebSocketManager } from '@/lib/websocket-manager'

// Initialize on app startup
initializeWebSocketManager()

// Use for subscriptions
const manager = getWebSocketManager()
manager.addSubscription('chat-room-123', unsubscribeFn, 'chat-channel', callback)
manager.removeSubscription('chat-room-123') // Safe cleanup
```

---

### 6. Course Generation 500 Errors

**Problem:** `/api/pods/generate-course-streaming` was returning 500 errors without useful information.

**Solution:** Updated [app/api/pods/generate-course-streaming/route.ts](app/api/pods/generate-course-streaming/route.ts):

1. **Correlation IDs**: Every request gets a unique ID for tracing
2. **Structured Logging**: JSON-formatted logs with timestamps and context
3. **Better Error Messages**: User-friendly messages without exposing internals
4. **Improved URL Parsing**: Support for youtu.be and embed formats
5. **Request Validation**: Clear 400 responses for invalid inputs

Example log entry:
```json
{
  "timestamp": "2026-01-20T10:30:00.000Z",
  "level": "info",
  "message": "Course generation request received",
  "correlationId": "course-gen-1737364200000-abc123",
  "podId": "pod-xyz",
  "courseTitle": "Introduction to React"
}
```

---

### 7. Accessibility Improvements

**Problem:** Radix dialogs causing "aria-hidden on focused element" warnings and focus management issues.

**Solution:** Created [lib/accessibility-utils.ts](lib/accessibility-utils.ts) with:

- `blurActiveElement()` - Prevent aria-hidden focus issues
- `safeFocus()` - Focus elements safely
- `createFocusTrap()` - Modal focus trapping
- `announceToScreenReader()` - Live region announcements
- `setupKeyboardShortcuts()` - Keyboard shortcut management
- `prefersReducedMotion()` - Motion preference detection

---

## Files Modified

| File | Changes |
|------|---------|
| `lib/appwrite.ts` | Fixed createPod (teamId), createComment (createdAt), added ensureProfileExists(), fixed savePledge/addCheckIn error handling, fixed uploadResource (createdAt), improved downloadResource |
| `lib/auth-context.tsx` | Use ensureProfileExists() for guaranteed profile creation |
| `lib/websocket-manager.ts` | Complete rewrite with heartbeat, reconnection, cleanup |
| `lib/accessibility-utils.ts` | New file with accessibility helpers |
| `app/api/pods/generate-course-streaming/route.ts` | Added correlation IDs, structured logging, better error handling, improved YouTube URL parsing |
| `app/app/chat/page.tsx` | Added accessibility imports, connection status state, screen reader announcements |
| `scripts/update-schema.js` | Fixed comments/pods schemas, added permissions for check-ins/commitments |

---

## Remaining Work

### Must Complete Before Production

1. **Run Schema Update Script**: Execute the updated schema script against your Appwrite instance:
   ```bash
   node scripts/update-schema.js
   ```

2. **Verify Appwrite Permissions**: Ensure all collections have proper read/write permissions for `role:users`

3. **Environment Variables**: Verify all required environment variables are set:
   - `APPWRITE_ENDPOINT`
   - `APPWRITE_PROJECT_ID`
   - `APPWRITE_API_KEY` (server-side)

4. **Test All User Journeys**:
   - [ ] Sign up flow
   - [ ] Login flow  
   - [ ] Profile creation/update
   - [ ] Create post
   - [ ] Create comment
   - [ ] Create pod
   - [ ] Join pod
   - [ ] Chat/messaging
   - [ ] Upload resource
   - [ ] Download resource
   - [ ] Check-in
   - [ ] Pledge/commitment
   - [ ] Generate course

### Recommended Follow-ups

1. **Add E2E Tests**: Use Playwright/Cypress for critical paths
2. **Add Error Monitoring**: Integrate Sentry or similar
3. **Add Request Correlation**: Frontend should send correlation IDs
4. **Performance Audit**: Virtualize long message lists
5. **Offline Support**: If needed, implement proper queue + sync pattern

---

## Testing Checklist

```markdown
### Auth Flow
- [ ] Registration creates user account
- [ ] Registration creates profile document
- [ ] Login works with valid credentials
- [ ] Login creates profile if missing
- [ ] Logout clears session properly

### Posts & Comments
- [ ] Create post succeeds
- [ ] Create comment succeeds (no createdAt error)
- [ ] Like/unlike works
- [ ] Delete post removes comments

### Pods
- [ ] Create pod succeeds (no teamId error)
- [ ] Join pod works
- [ ] Leave pod works
- [ ] Pod chat room created

### Accountability
- [ ] Save pledge works (no 401)
- [ ] Add check-in works (no 401)
- [ ] RSVP toggle works

### Chat
- [ ] Send message works
- [ ] Receive messages works
- [ ] File upload works
- [ ] AI mention (@ai) works
- [ ] No WebSocket spam in console

### Course Generation
- [ ] Generate course returns 201
- [ ] Invalid inputs return 400
- [ ] Chapters are created
- [ ] Progress updates work
```

---

## Contact

For questions about these changes, refer to the inline code comments or the architecture documentation in `/docs`.
