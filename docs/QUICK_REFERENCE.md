# 🚀 QUICK REFERENCE CARD

## Getting Started (3 Steps)

```bash
# 1. Run setup
node scripts/setup-appwrite.js

# 2. Test backend
node scripts/test-backend.js

# 3. Start dev
pnpm dev
```

## Common Commands

| Command | Purpose |
|---------|---------|
| `node scripts/setup-appwrite.js` | Create collections & buckets |
| `node scripts/test-backend.js` | Test backend connectivity |
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |

## Error Quick Fixes

| Error | Fix |
|-------|-----|
| "The current user is not authorized" | Read: `APPWRITE_CRITICAL_FIX.md` STEP 2 & 3 |
| "createEmailSession is not a function" | Run: `pnpm add appwrite@latest` |
| "Can't access /app routes" | User not authenticated - login first |
| "File upload fails" | Check bucket permissions in `APPWRITE_CRITICAL_FIX.md` STEP 3 |

## Documentation Map

```
QUICK REFERENCE CARD
│
├─ APPWRITE_CRITICAL_FIX.md
│  └─ For permission errors (START HERE)
│
├─ APPWRITE_DEBUG_GUIDE.md
│  └─ For troubleshooting & debugging
│
├─ BACKEND_SERVICES_GUIDE.md
│  └─ For service/method reference
│
├─ COMPLETE_TESTING_CHECKLIST.md
│  └─ For systematic feature testing
│
└─ BACKEND_FIX_SUMMARY.md
   └─ For complete overview
```

## File Locations

**Authentication:**
- `lib/auth-context.tsx` - Global auth state
- `app/login/page.tsx` - Login page
- `app/register/page.tsx` - Sign up page
- `app/forgot-password/page.tsx` - Password reset

**Protected Routes:**
- `lib/protect-route.tsx` - Route protection
- `app/app/layout.tsx` - Protected layout

**Backend Services:**
- `lib/appwrite.ts` - All service methods (50+)
- `scripts/test-backend.js` - Test script
- `scripts/setup-appwrite.js` - Setup script

**Configuration:**
- `.env.local` - Environment variables

## Testing Workflow

```
1. Run: node scripts/test-backend.js
   ↓ 
2. If all PASS → Skip to step 4
   ↓
3. If any FAIL → Read APPWRITE_CRITICAL_FIX.md
   ↓
4. Start: pnpm dev
   ↓
5. Test http://localhost:3000
```

## Service Methods Quick List

| Service | Methods |
|---------|---------|
| **Auth** | register, login, logout, changePassword, requestPasswordReset |
| **Profile** | getProfile, updateProfile, uploadAvatar, getAllProfiles |
| **Pod** | createPod, joinPod, leavePod, getUserPods, getAllPods, getPodDetails |
| **Chat** | sendMessage, getMessages, subscribeToMessages, uploadAttachment, getUserChatRooms |
| **Feed** | createPost, getFeedPosts, toggleLike, subscribeToFeed |
| **Resource** | uploadResource, getResources, downloadResource |
| **Calendar** | createEvent, getUserEvents, updateEvent, deleteEvent |
| **Notification** | createNotification, getUserNotifications, markAsRead, markAllAsRead, subscribeToNotifications |
| **Jitsi** | generateMeetingUrl, createPodMeeting |

**Total: 50+ methods**

## Feature Checklist

- [ ] Authentication (register, login, logout)
- [ ] Profiles (view, edit, avatar)
- [ ] Pods (create, join, browse)
- [ ] Chat (messages, files, DMs)
- [ ] Feed (posts, likes, comments)
- [ ] Resources (upload, download, organize)
- [ ] Calendar (events, scheduling)
- [ ] Notifications (alerts, badges)
- [ ] Leaderboard (rankings, achievements)
- [ ] Explore (discovery, trending)

## Environment Variables

```env
# Required
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=694ed12f003c942317f4
NEXT_PUBLIC_APPWRITE_DATABASE_ID=peerspark-main-db
APPWRITE_API_KEY=your_api_key_here

# Optional
NEXT_PUBLIC_APP_NAME=PeerSpark
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Collections & Buckets

**Collections (8):**
- profiles
- posts
- messages
- pods
- resources
- notifications
- calendar_events
- chat_rooms

**Buckets (4):**
- avatars
- resources
- attachments
- post_images

## Permission Template

Every collection/bucket needs:
```
✓ read("any")
✓ read("user")
✓ create("user")
✓ update("user")
✓ delete("user")
```

## Helpful Links

| Resource | URL |
|----------|-----|
| Appwrite Docs | https://appwrite.io/docs |
| Next.js Docs | https://nextjs.org/docs |
| React Docs | https://react.dev |
| Appwrite Community | https://appwrite.io/community |
| Appwrite Status | https://status.appwrite.io |

## Testing URLs

| Page | URL |
|------|-----|
| Login | http://localhost:3000/login |
| Register | http://localhost:3000/register |
| Feed | http://localhost:3000/app/feed |
| Pods | http://localhost:3000/app/pods |
| Chat | http://localhost:3000/app/chat |
| Profile | http://localhost:3000/app/profile |
| Settings | http://localhost:3000/app/settings |

## Browser DevTools Tips

```javascript
// In Console (F12):

// Check current user
const { useAuth } = await import('/lib/auth-context.tsx');
// Then use useAuth() in components

// Check if authenticated
const user = await account.get();
console.log(user);

// List active sessions
const sessions = await account.listSessions();
console.log(sessions);

// Test a service method
const posts = await feedService.getFeedPosts(10);
console.log(posts);
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| F12 | Open DevTools |
| Ctrl+Shift+P | Command palette |
| Ctrl+Click | Open link in new tab |
| Ctrl+R | Hard refresh |
| Ctrl+Shift+R | Clear cache & refresh |

## Performance Goals

- Page load: < 2s
- API response: < 500ms
- Feed scroll: 60fps
- Chat load: < 1s
- File upload: 5MB/s

## Security Checklist

- [ ] API key not in frontend code
- [ ] Passwords hashed on backend
- [ ] Session stored in secure cookies
- [ ] CORS properly configured
- [ ] Authenticated routes protected
- [ ] File uploads validated
- [ ] Input sanitized

## Deployment Checklist

- [ ] All tests passing
- [ ] No console errors
- [ ] Environment variables set
- [ ] Database backups configured
- [ ] Error monitoring setup
- [ ] Performance monitoring setup
- [ ] Security audit completed

## Support Decision Tree

```
❌ Got an error?
├─ "unauthorized" → APPWRITE_CRITICAL_FIX.md
├─ "not a function" → Update Appwrite SDK
├─ "not found" → Check collection/bucket IDs
├─ "authentication failed" → Check credentials
└─ Other → APPWRITE_DEBUG_GUIDE.md

❓ How do I...?
├─ Create a post? → BACKEND_SERVICES_GUIDE.md (Feed)
├─ Join a pod? → BACKEND_SERVICES_GUIDE.md (Pod)
├─ Send a message? → BACKEND_SERVICES_GUIDE.md (Chat)
├─ Upload a file? → BACKEND_SERVICES_GUIDE.md (Chat/Resource)
└─ Reset password? → APPWRITE_CRITICAL_FIX.md STEP 4

🧪 Want to test?
├─ Automated test → node scripts/test-backend.js
├─ Manual test → COMPLETE_TESTING_CHECKLIST.md
├─ Feature test → BACKEND_SERVICES_GUIDE.md
└─ Full verification → COMPLETE_TESTING_CHECKLIST.md

📚 Need to learn?
├─ Services → BACKEND_SERVICES_GUIDE.md
├─ Appwrite → Official docs
├─ Next.js → Official docs
├─ React → Official docs
└─ PeerSpark → This project
```

---

**Print this card for quick reference while working!**

Last updated: January 2024
