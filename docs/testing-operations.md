# End-to-End Testing Operations Catalog

Use this catalog to verify every user-facing flow, from the smallest button state to the largest multi-step journey. Each section lists the operations to exercise, expected outcomes, and edge cases to probe.

## Conventions
- `[ ]` unchecked items are test steps; check them off as you execute.
- Always test on desktop (≥1280px) and mobile (≈360px) for layout, focus, and keyboard support.
- Validate both light and dark themes where toggles exist.

## Authentication & Identity
- Login: [ ] valid email/pass succeeds and routes to dashboard; [ ] invalid creds show error; [ ] rate/lockout messaging; [ ] remember-me/session persistence (if present).
- Registration: [ ] required fields enforced; [ ] password strength rules; [ ] duplicate email rejected; [ ] verification email triggered; [ ] redirect to verify screen.
- Email verification: [ ] link/OTP accepted; [ ] expired/invalid token handled; [ ] resend link works.
- Forgot/reset password: [ ] request email with existing account; [ ] non-existent email yields friendly error; [ ] reset token flow; [ ] password confirmation mismatch blocked.
- Logout/session expiry: [ ] session cleared; [ ] protected routes redirect to login; [ ] refresh respects auth state.

## Landing & Informational Pages
- CTA buttons: [ ] Get Started/Sign In/Sign Up route correctly; [ ] anchor links scroll to sections; [ ] external social links open in new tab.
- Static policies: [ ] Terms/Privacy/Cookies/Accessibility load; [ ] internal anchors scroll; [ ] print-friendly layout; [ ] last-updated text visible.

## Onboarding
- Profile setup: [ ] name/avatar/bio required states; [ ] avatar upload size/type constraints; [ ] interests/tags selection persists.
- Preferences: [ ] study goals, pace, availability selection saves; [ ] skipping steps still allows completion; [ ] summary screen reflects choices.

## Theme, Layout, Navigation
- Theme toggle: [ ] switches light/dark; [ ] persists across refresh; [ ] respects system preference on first load.
- Navigation shells: [ ] sidebar links highlight active route; [ ] mobile drawer opens/closes via overlay and ESC; [ ] breadcrumb where present.
- Floating action button: [ ] opens quick-create menu; [ ] disabled state when not authenticated.

## Pods (Communities)
- Pod discovery: [ ] list loads with pagination; [ ] filters (subject/difficulty/public) work; [ ] search returns scoped results.
- Create pod: [ ] validation on name/description/subject/difficulty; [ ] optional image upload; [ ] success creates chat room; [ ] permissions applied.
- Join/leave: [ ] join via list and via invite code; [ ] capacity enforced; [ ] member count updates; [ ] leaving updates membership and chat membership.
- Admin actions: [ ] promote/demote admins; [ ] remove member; [ ] invite link generation with expiry; [ ] revoked links rejected.
- Accountability: [ ] pledges saved to `pod_commitments`; [ ] weekly reset behavior; [ ] check-ins append to feed with author metadata; [ ] RSVP toggles per event update aggregates; [ ] optimistic update rollback on failure.
- Resources within pod: [ ] pod-specific resources list; [ ] upload/download from pod view; [ ] permission errors for non-members.

## Courses & AI
- Course generation: [ ] submit valid YouTube URL + title creates stubs within ~5s; [ ] invalid URL rejected; [ ] duplicate course per pod blocked; [ ] progress polling every 5s until completion/error; [ ] chapters unlock sequentially; [ ] error state preserves partial content.
- Course dashboard: [ ] chapter content displays; [ ] locked chapters gated; [ ] assignments/notes render; [ ] progress indicators update.
- AI chat: [ ] prompt sends; [ ] server error retries capped; [ ] timeout messaging after 45s; [ ] rate-limit message; [ ] history truncation to last 15 messages.

## Feed & Posts
- Create post: [ ] text required; [ ] max length enforced; [ ] image upload types/size; [ ] pod visibility selection; [ ] tags optional; [ ] success updates feed immediately.
- Edit/delete: [ ] owner can edit content/tags; [ ] delete cascades to comments/attachments; [ ] non-owner blocked.
- Likes/saves: [ ] toggle like updates count and state; [ ] bookmark/saved toggle persists; [ ] totals consistent after refresh.
- Pagination: [ ] infinite scroll or pager works; [ ] empty states when no posts.

## Comments
- Add comment/reply: [ ] content required; [ ] nested reply support; [ ] errors surfaced; [ ] counts increment.
- Edit/delete: [ ] owner-only; [ ] edited flag rendered; [ ] delete decrements counts.
- Likes: [ ] toggle like updates count; [ ] duplicates prevented.

## Messaging & Chat
- Room list: [ ] rooms sorted by last message; [ ] unread counts reflect new messages; [ ] presence indicators match online status.
- Send message: [ ] optimistic append; [ ] Appwrite realtime echo handled without duplication; [ ] attachments (if enabled) validate size/type.
- Read receipts: [ ] mark-read updates readBy; [ ] clearing unread badge after opening.
- Direct chats: [ ] creating a chat between two users reuses existing room.

## Resources & Files
- Upload: [ ] allowed types (PDF/Word/Excel/Images/TXT); [ ] size limit (50MB); [ ] progress indicator; [ ] failure rollback.
- Bookmark: [ ] toggle bookmark updates list; [ ] bookmarked tab filters correctly.
- Download/view: [ ] access via signed URL; [ ] non-owners blocked where required; [ ] delete removes storage object and metadata.

## Calendar & Events
- Create event: [ ] start/end validation; [ ] type/pod association optional; [ ] recurring? (if not, ensure blocked); [ ] conflicts messaging if applicable.
- View events: [ ] user-specific list; [ ] date range filtering; [ ] timezone formatting.
- Study plan sync: [ ] tasks mark complete when `isCompleted` true or notes present; [ ] sourceSignals include attendance/notes flags.
- RSVPs: [ ] toggle going/not-going; [ ] aggregate counts match per event; [ ] state persists after refresh.

## Analytics & Achievements
- Activity tracking: [ ] trackStudyTime writes duration; [ ] trackActivity logs action + metadata; [ ] study stats aggregate by date range.
- Goals: [ ] update goals persists; [ ] trackGoalProgress updates percent; [ ] achievements/badges progress computed.
- Reports/exports: [ ] generateReport returns payload; [ ] exportAnalytics supports CSV/JSON selection.

## Notifications
- Triggers: [ ] post like/comment notifications; [ ] follows; [ ] pod invites/admin changes; [ ] resource shares; [ ] reminders.
- Delivery: [ ] list ordered newest first; [ ] mark-as-read updates badge and state; [ ] clicking notification deep-links to target.

## Payments (if enabled)
- Checkout: [ ] creating Stripe session returns URL; [ ] validation on plan/id; [ ] errors handled.
- Webhooks: [ ] signature verification; [ ] subscription status updates; [ ] idempotency on repeated events.

## PWA & Offline
- Install prompt: [ ] prompt shows after engagement; [ ] accept/decline flows tracked; [ ] manifest fields correct.
- Offline: [ ] service worker caches static assets; [ ] graceful fallback pages; [ ] queued actions deferred or blocked with messaging.

## Accessibility & Quality
- Keyboard: [ ] tab order logical; [ ] focus trap in modals/dialogs/drawers; [ ] ESC closes overlays; [ ] skip-to-content (if present).
- ARIA: [ ] labels on form fields; [ ] role attributes on menus/dialogs; [ ] live region for toasts.
- Contrast: [ ] WCAG AA for text/buttons in both themes; [ ] focus outlines visible.

## Failure & Recovery
- Network loss: [ ] requests surface retry guidance; [ ] optimistic UI rolls back on failure; [ ] error toasts actionable.
- Permissions: [ ] unauthorized operations return friendly errors (403/401); [ ] protected routes redirect.

## Regression Smoke Pack (fast pass)
- Login → open pod → join → post → comment → send chat message → upload resource → create event → toggle RSVP → open AI assistant → toggle theme.
