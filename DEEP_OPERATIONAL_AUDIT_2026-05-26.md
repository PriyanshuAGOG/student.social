# Deep Operational Audit — 2026-05-26

## Scope

This report is a static code audit of the `student.social` codebase. The request was to scan the entire product surface and classify what is working, partially working, mocked, or broken.

## Method

- Scanned application routes, components, API routes, and the shared Appwrite service layer.
- Traced frontend actions to their actual backend implementation paths.
- Compared UI behavior against service signatures and API contracts.
- Counted placeholder, mock, and demo indicators.

## Constraints

- This is a static audit only.
- `node_modules` is not present in the repository, so build and runtime validation were not possible.
- Environment-backed features such as Appwrite, AI provider calls, email, storage, and external meeting links could not be executed from this environment.

## Execution Tracker

This document is now the live remediation tracker as fixes are applied.

### Completed in current pass

1. **Chat contract cleanup**
   - added `chatService.getOrCreatePodRoom(...)`
   - fixed pod chat to resolve room by `podId` instead of assuming `${podId}_general`
   - unified DM creation toward `type: "direct"`
   - made room listing tolerate both legacy `"dm"` and canonical `"direct"` records
   - files updated:
     - `lib/appwrite.ts`
     - `components/pods/tabs/PodChatTab.tsx`
     - `app/app/chat/page.tsx`

2. **Comments / replies cleanup**
   - added `replyTo` persistence in comment creation
   - added reply-notification creation
   - fixed reply submission to pass parent comment ID
   - fixed nested reply insertion in local tree state
   - fixed comment count updates to use actual tree counts instead of initial props
   - files updated:
     - `lib/appwrite.ts`
     - `components/comments-section.tsx`

3. **Vault contract cleanup**
   - fixed upload call to use the actual `uploadResource(userId, file, metadata)` signature
   - fixed download handling to use returned `{ url }`
   - connected bookmark action to `resourceService.toggleBookmarkResource(...)`
   - fixed “Upload Your First Resource” button to open the file picker
   - fixed recent-resource rendering to use real resource fields
   - files updated:
     - `app/app/vault/page.tsx`

4. **Notification invite cleanup**
   - fixed pod invite acceptance to call `joinPod(podId, userId, email?)` correctly
   - file updated:
     - `app/app/notifications/page.tsx`

5. **Calendar meeting duplication cleanup**
   - changed pod meeting creation to optionally skip creating a second calendar event
   - updated calendar UI flow to persist `meetingUrl` onto the already-created event instead of creating a duplicate
   - files updated:
     - `lib/appwrite.ts`
     - `app/app/calendar/page.tsx`

6. **Course enrollment cleanup**
   - fixed `/api/courses/enroll` to call the course service with the correct database-backed signature
   - added enrollment-status lookup via `GET /api/courses/enroll?userId=...&courseId=...`
   - updated the course detail page to load real enrollment state before rendering the player gate
   - files updated:
     - `app/api/courses/enroll/route.ts`
     - `app/courses/[id]/page.tsx`

7. **Assignment submission cleanup**
   - replaced the client JSON submit flow with real `FormData`
   - removed fake hardcoded `userId` and `assignmentId` placeholders from the client
   - rewrote the submit route so submissions are persisted and immediately receive a server-side grading result
   - files updated:
     - `components/courses/AssignmentPanel.tsx`
     - `app/api/assignments/submit/route.ts`

8. **Follow-flow cleanup**
   - wired the public profile follow button to the actual follow API
   - added real follow-state detection for public profile pages
   - removed the incorrect self-follow desktop action on the owner profile page
   - files updated:
     - `app/app/profile/[username]/page.tsx`
     - `app/app/profile/page.tsx`

9. **Notification inbox consolidation**
   - moved the inbox/read/delete notification API path onto the main notifications collection
   - removed hardcoded `current-user-id` client behavior from notification inbox/preferences components
   - files updated:
     - `app/api/notifications/inbox/route.ts`
     - `app/api/notifications/[id]/read/route.ts`
     - `app/api/notifications/[id]/route.ts`
     - `components/notifications/NotificationInbox.tsx`
     - `components/notifications/NotificationPreferences.tsx`

10. **Feed and saved-post persistence cleanup**
   - wired feed bookmarking to the real `toggleSavePost(...)` backend path
   - replaced the fake “following” feed tab filter with a real follower-ID check
   - wired saved-post unsave to the backend
   - wired saved-post likes to the backend
   - files updated:
     - `app/app/feed/page.tsx`
     - `app/app/saved/page.tsx`

11. **Course player content cleanup**
   - replaced the static lecture placeholder with:
     - YouTube embed playback when the course has a source video
     - transcript/content fallback when no video source is present
   - replaced mock notes generation with chapter-derived summaries, objectives, concepts, formulas, and applications
   - files updated:
     - `components/courses/CoursePlayer.tsx`
     - `components/courses/NotesPanel.tsx`

12. **Instructor/admin route hardening**
   - fixed instructor dashboard to use the real course-service signatures and Appwrite query objects
   - fixed instructor grading queue to use actual submission fields and database calls
   - fixed admin broadcast listing to use valid Appwrite pagination/query syntax
   - files updated:
     - `app/api/instructor/dashboard/route.ts`
     - `app/api/instructor/grading-queue/route.ts`
     - `app/api/admin/broadcasts/route.ts`

13. **Analytics and leaderboard cleanup**
   - replaced static analytics dashboard arrays with live derived data from profiles, posts, pods, and resources
   - replaced static leaderboard arrays with actual profile ranking and pod-member leaderboards
   - files updated:
     - `app/app/analytics/page.tsx`
     - `app/app/leaderboard/page.tsx`

14. **Payments and certificates hardening**
   - removed fake Stripe checkout URLs
   - upgraded checkout creation to use real Stripe sessions when `STRIPE_SECRET_KEY` is configured
   - replaced the certificate placeholder route with real certificate fetch, HTML rendering, PDF download, and verification metadata
   - files updated:
     - `app/api/payments/create-checkout/route.ts`
     - `app/api/certificates/download/route.ts`

15. **Interaction consistency cleanup**
   - wired own-profile post likes and bookmarks to the real feed service
   - wired public-profile post likes to the real feed service
   - added real resource like persistence
   - wired the notification settings card on the notifications page to the preferences API
   - files updated:
     - `app/app/profile/page.tsx`
     - `app/app/profile/[username]/page.tsx`
     - `app/app/vault/page.tsx`
     - `lib/appwrite.ts`
     - `app/app/notifications/page.tsx`

16. **Regression coverage expansion**
   - expanded `tests.contract.mjs` to assert:
     - course enrollment status lookup
     - server-side assignment grading path
     - resource like service support
     - analytics/leaderboard data-backed implementation
     - non-placeholder payments/certificate routes
   - files updated:
     - `tests.contract.mjs`

17. **Analytics scoring hardening**
   - replaced estimated study-pattern math with analytics derived from actual calendar events, completed sessions, posts, pods, and resources
   - added shared scoring utilities for reusable focus, collaboration, and topic-distribution calculations
   - files updated:
     - `lib/engagement-scoring.ts`
     - `app/app/analytics/page.tsx`

18. **Leaderboard scoring hardening**
   - replaced raw sort-by-points behavior with weighted learner scoring across points, hours, streaks, pod participation, badges, and recency
   - made leaderboard period selection affect ranking inputs
   - files updated:
     - `lib/engagement-scoring.ts`
     - `app/app/leaderboard/page.tsx`

19. **Pods information architecture cleanup**
   - merged the legacy `pods` and `explore` surfaces into a single structured pods workspace
   - fixed pod join actions to call the real backend instead of only routing
   - fixed create-pod CTA path by moving creation into the merged pods workspace
   - converted `/app/explore` into a redirect to the merged pods discover tab
   - files updated:
     - `app/app/pods/page.tsx`
     - `app/app/explore/page.tsx`

20. **Messaging UI and routing cleanup**
   - fixed chat deep links so pod IDs resolve to actual pod chat rooms instead of failing room-ID assumptions
   - added room-state refresh handling and last-message sync updates after sending
   - cleaned direct-message presentation and composer ergonomics
   - files updated:
     - `app/app/chat/page.tsx`
     - `app/app/messages/[userId]/page.tsx`

21. **Dashboard removal and nav cleanup**
   - removed dashboard as a destination and redirected `/app/dashboard` to `/app/feed`
   - replaced stale dashboard/explore navigation links with analytics/pods destinations
   - files updated:
     - `app/app/dashboard/page.tsx`
     - `components/app-sidebar.tsx`
     - `components/mobile-header.tsx`
     - `app/app/home/page.tsx`

### Current status after this pass

- Pod chat: moved from **Broken** to **Partial**
- Direct messaging: moved from **Broken-risk** to **Partial**
- Replies: moved from **Broken** to **Partial**
- Vault upload/download: moved from **Broken** to **Partial**
- Notification invite acceptance: fixed one blocking failure, but the overall notification system remains **Broken** because the duplicate-system problem still exists
- Calendar meeting creation: moved from **Partial-to-Broken** to **Partial**
- Course enrollment gate: moved from **Broken** to **Partial**
- Assignment submission: moved from **Broken** to **Partial**
- Follow/unfollow on public profiles: moved from **Partial/Broken-by-screen** to **Partial**
- Notification inbox component path: moved from **Broken/demo-only** to **Partial**
- Feed bookmark persistence: moved from **Broken/local-only** to **Partial**
- Saved-post interactions: moved from **Partial/Broken-by-screen** to **Partial**
- Course lecture/notes experience: moved from **Mocked/Placeholder** to **Partial**
- Instructor/admin route runtime safety: moved from **Broken-risk** to **Partial**
- Analytics page: moved from **Mocked** to **Partial**
- Leaderboard page: moved from **Mocked** to **Partial**
- Analytics scoring: moved from **Partial/heuristic** to **Partial/derived**
- Leaderboard ranking: moved from **Partial/basic-sort** to **Partial/weighted**
- Payments: moved from **Mocked** to **Partial**
- Certificates: moved from **Mocked** to **Partial**
- Profile post actions: moved from **Partial/Broken-by-screen** to **Partial**
- Vault likes: moved from **Broken/local-only** to **Partial**
- Notification settings card: moved from **UI-only** to **Partial**
- Pods workspace IA: moved from **Duplicated/inconsistent** to **Partial/unified**
- Messaging frontend UX: moved from **Partial/rough** to **Partial/polished**
- Dashboard surface: moved from **Redundant** to **Removed/redirected**

### Still not validated

- no runtime build
- no integration test run
- no deployed Appwrite schema verification
- no end-to-end browser verification

### Validation completed

- `node --test tests.contract.mjs` ✅
- `node --test tests.e2e-smoke.mjs` ✅
- `node --test tests.contract.mjs` after course/assignment/follow/notification pass ✅
- `node --test tests.e2e-smoke.mjs` after course/assignment/follow/notification pass ✅
- `node --test tests.contract.mjs` after feed/saved persistence pass ✅
- `node --test tests.e2e-smoke.mjs` after feed/saved persistence pass ✅
- `node --test tests.contract.mjs` after course-player cleanup ✅
- `node --test tests.e2e-smoke.mjs` after course-player cleanup ✅
- `node --test tests.contract.mjs` after instructor/admin hardening ✅
- `node --test tests.e2e-smoke.mjs` after instructor/admin hardening ✅
- `node --test tests.contract.mjs` after analytics/leaderboard/payments/certificates pass ✅
- `node --test tests.e2e-smoke.mjs` after analytics/leaderboard/payments/certificates pass ✅
- `node --test tests.contract.mjs` after interaction cleanup and test expansion ✅
- `node --test tests.e2e-smoke.mjs` after interaction cleanup and test expansion ✅
- `node --test tests.contract.mjs` after analytics scoring, pods merge, messaging UI, and dashboard removal pass âœ…
- `node --test tests.e2e-smoke.mjs` after analytics scoring, pods merge, messaging UI, and dashboard removal pass âœ…
- note: these are repository smoke checks only, not feature-complete end-to-end validation

## Repo Signals

- API route files: `62`
- Exported API handlers: `94`
- `@ts-nocheck` occurrences: `32`
- Placeholder / mock / TODO / local-state-only signals: `86`

## Executive Summary

The codebase has real structure, but it is not operationally consistent. The main issue is not that every feature is missing. The issue is that many features are implemented in multiple incompatible ways:

- some screens call `lib/appwrite.ts` directly
- some screens call `app/api/*`
- some APIs are real
- some APIs are demo or placeholder
- some UI actions are local state only and never persist

The strongest areas are:

- auth route structure
- base post CRUD routes
- basic pod CRUD shape
- basic calendar CRUD shape
- AI route structure, assuming environment keys exist

The weakest areas are:

- chat and messaging
- replies and threaded comments
- resource upload and download
- course assignments and enrollment flow
- notifications due to duplicate systems
- analytics / leaderboard / payments / certificates, which are largely demo or mocked

## Status Scale

- **Working**: code path looks coherent and likely works if the backend is configured
- **Partial**: some operations work, but important sub-operations are local-only, mismatched, or incomplete
- **Broken**: code path is internally inconsistent and likely fails or silently does the wrong thing
- **Mocked**: intentionally demo-only or placeholder logic

## Feature Matrix

| Area | Status | Assessment |
|---|---|---|
| Authentication | Partial-to-Working | Strongest subsystem in the codebase |
| Feed / Post creation | Partial | Create/list are real; social actions are inconsistent |
| Post like / save / share | Partial | Save/like wiring is improved on key screens; share/public-route consistency still remains |
| Comments | Partial | Base comments are wired |
| Replies | Partial | Reply persistence path has been patched; runtime validation still pending |
| Profiles | Partial | Read/update is real and key post actions are improved; some social flows still need deeper runtime validation |
| Follow / unfollow | Partial | Backend exists, UI often does not use it |
| Saved posts | Partial | Listing, unsave, and like are patched on the saved screen; broader consistency still remains |
| Pods core | Partial | Create/list/join/leave are mostly real |
| Pod chat | Partial | Room resolution has been patched toward `podId`-based lookup; runtime validation still pending |
| Direct messaging | Partial | DM type mismatch has been reduced, but duplicate implementations still need consolidation |
| AI chat | Partial-to-Working | Good structure, dependent on provider configuration |
| Calendar events | Partial | Core CRUD exists; meeting flow duplicates events |
| Pod meetings | Partial | Duplicate-event creation path has been patched; runtime validation still pending |
| Vault / resources | Partial | Upload/download and likes/bookmarks are improved; broader access-control/runtime validation still remains |
| Courses | Partial | Enrollment gate, lecture rendering, and notes are improved; deeper progress/review flows still remain |
| Assignments | Partial | Client/API mismatch is fixed; grading remains simplified and needs hardening |
| Instructor dashboards | Partial | Core signature/query faults are patched; deeper analytics correctness still needs validation |
| Notifications | Partial | Invite acceptance and inbox path are patched; preferences/data-model consolidation still remains |
| Leaderboard | Partial | Now derived from live profile/pod data; scoring model still needs formalization |
| Analytics | Partial | Now derived from live profile/post/pod/resource data; metrics remain heuristic |
| Payments | Partial | Uses real Stripe checkout only when configured; persistence/webhooks still need full production wiring |
| Certificates | Partial | Real fetch, verification, and PDF/HTML download are added; branding/template hardening still remains |
| Admin tools | Partial | Broadcast listing query faults are patched; broader admin validation still remains |

## Detailed Findings

### 1. Authentication

**Status:** Partial-to-Working

What looks coherent:

- `app/api/auth/login/route.ts`
- `app/api/auth/register/route.ts`
- `lib/auth-context.tsx`
- session revalidation and profile bootstrap flow

What still needs validation:

- real Appwrite session behavior under deployed environment
- email verification paths
- password reset and edge-case flows were not fully traced end-to-end

Assessment:

- Auth is one of the few areas that looks structurally production-minded.
- This is not the first area to fix unless runtime testing proves otherwise.

### 2. Feed and Post Operations

**Status:** Partial

Operations checked:

- create post
- list feed posts
- view post cards
- like post
- save / bookmark post
- share post
- filter tabs

What is real:

- `app/api/posts/route.ts` provides create and list handlers.
- `app/api/posts/[id]/like/route.ts` provides like toggle.
- `app/api/posts/[id]/save/route.ts` provides save toggle.
- `components/create-post-modal.tsx` is wired to post creation via `feedService.createPost(...)`.

What is broken or weak:

- the feed screen uses fake logic for the “following” tab
- bookmark behavior on the main feed is local state only
- share URLs point to a path pattern that was not found as a real page route
- some screens use direct service calls while server routes already exist

Operational verdict:

- post creation likely works
- feed listing likely works
- like/save behavior is inconsistent by screen
- some user-visible states are cosmetic only

### 3. Comments and Replies

**Status:** Comments = Partial, Replies = Broken

What works better:

- top-level comment listing
- top-level comment creation
- edit/delete flows appear wired through `commentService`

Root failure:

- the UI supports reply intent
- the data service used by the UI does not persist `replyTo`
- the comment loader expects `replyTo` to exist for threaded rendering

Impact:

- replies are not actually stored as replies
- threaded discussion is unreliable or absent
- reply counters can drift because the UI updates from initial counts instead of current state

Operational verdict:

- plain comments may work
- threaded comments do not work correctly

### 4. Profiles, Following, and Saved Posts

**Status:** Partial

Profile read/update:

- own profile loading and editing looks wired
- profile lookup by username exists

Critical weaknesses:

- follow buttons are often local-state-only
- post like/save/share on profile views are often local-state-only
- avatar change UI is exposed without a complete upload flow
- `getProfileByUsername` relies on scanning a limited profile set instead of querying at scale

Saved posts:

- saved-post listing exists
- unsave and related interactions are not consistently persisted from the UI

Operational verdict:

- profile read/update likely works
- social actions from profile pages are unreliable

### 5. Pods Core

**Status:** Partial

Operations checked:

- create pod
- list user pods
- list all pods
- join pod
- leave pod
- view pod detail
- basic accountability flows

What looks real:

- `app/api/pods/route.ts`
- `app/api/pods/[id]/join/route.ts`
- `app/api/pods/[id]/leave/route.ts`
- `podService` includes create/join/leave and accountability helpers

Weaknesses:

- some pod detail actions are still cosmetic
- “cheers” is local storage only
- some share actions have no handler

Operational verdict:

- core pod lifecycle is one of the better feature areas
- secondary engagement features are not production-ready

### 6. Pod Chat and Direct Messaging

**Status:** Broken

This is one of the highest-priority failures.

#### Pod Chat

Root mismatch:

- pod creation creates a chat room document using a generated document ID
- pod chat UI assumes room ID equals `${podId}_general`
- chat room lookup later also assumes `${podId}_general`

Impact:

- pod messages are addressed to the wrong room identifier
- load/send flows are not aligned to the room that actually exists

Additional failures:

- reply UI exists, but send logic does not persist `replyTo`
- message subscription is polling-based, not real-time

#### Direct Messaging

Root mismatch:

- one chat path creates rooms with type `"dm"`
- another path expects direct rooms with type `"direct"`
- room listing logic queries only one of those types

Impact:

- rooms may be created but not appear in the room list
- users can land in one DM path while the master chat UI cannot find the room
- the codebase contains multiple messaging implementations that do not agree

Operational verdict:

- messaging cannot be considered reliable
- this area needs consolidation before any bug-fixing at the screen level

### 7. AI Chat

**Status:** Partial-to-Working

What looks solid:

- `app/api/ai/chat`
- `lib/ai.ts`
- AI mention handling from the chat page

Dependencies:

- requires `OPENROUTER_API_KEY` or `OPENAI_API_KEY`
- requires outbound network access

Operational verdict:

- the code structure is better than most areas
- runtime behavior cannot be confirmed from this environment

### 8. Calendar and Meetings

**Status:** Partial

What looks real:

- event list/load
- event create/edit/delete structure
- `app/api/calendar/events/route.ts`

Critical bug:

- meeting creation can create a normal event first
- then call `jitsiService.createPodMeeting(...)`
- the meeting helper creates another calendar event

Impact:

- one user action can create duplicate events
- meeting URL persistence is inconsistent across the duplicate entries

Operational verdict:

- base calendar CRUD likely works
- pod meeting workflow is not safe for production

### 9. Vault / Resources

**Status:** Broken

This is a high-severity user-facing failure.

Upload failure:

- the page calls `resourceService.uploadResource(file, metadata)`
- the service signature is `uploadResource(userId, file, metadata)`
- arguments are in the wrong order

Download failure:

- the service returns an object containing a URL
- the page treats the response as if it were a URL string

Additional weaknesses:

- likes and bookmarks are still TODO/local-only
- one upload button uses a handler shaped for file input change events
- “recent” view references fields that do not exist on the transformed resource model

Operational verdict:

- upload is broken
- download is broken
- resource interactions are incomplete

### 10. Courses and Learning Flow

**Status:** Partial

What exists:

- course listing route
- course detail page
- some generator routes for course creation

What is incomplete or broken:

- course enrollment status is hardcoded instead of fetched
- the player contains placeholder video UI
- notes panel uses mock data
- assignment submission UI sends JSON
- assignment API expects form data
- assignment UI also hardcodes fake user and assignment IDs

Operational verdict:

- browsing courses may work
- real learning progression and submission workflows do not

### 11. Instructor Features

**Status:** Broken-risk

Issues:

- route handlers use `@ts-nocheck`
- some calls use service signatures incorrectly
- dashboard and grading queue logic depend on assumptions that do not match the service layer shape

Operational verdict:

- this area should be treated as unstable until the service/API contract is corrected

### 12. Notifications

**Status:** Broken

Root problem:

- there are two incompatible notification systems in the repo
- one uses the main `notificationService`
- another uses `in_app_notifications` routes with `x-user-id` headers

Specific bug:

- pod invite acceptance calls `podService.joinPod(notification.podId)` without the required user context

Additional weakness:

- notification preference UI is not actually wired to persistence from the main page

Operational verdict:

- basic notification read operations may work in one path
- the overall notification product is not coherent

### 13. Leaderboard and Analytics

**Status:** Mocked

Findings:

- leaderboard data is static
- analytics charts and achievements are static
- random/demo values are used

Operational verdict:

- these are presentation demos, not functioning product features

### 14. Payments, Certificates, Admin

**Status:** Payments = Mocked, Certificates = Mocked, Admin = Partial-to-Broken

Payments:

- checkout route returns fake checkout URLs
- payment history is effectively empty/demo

Certificates:

- download route is a placeholder

Admin:

- some structure exists
- query signatures and assumptions look risky in places

Operational verdict:

- none of these areas are production-ready

## Minute Operation Checklist

This section maps user-visible operations more granularly.

### Social / Feed

| Operation | Status | Notes |
|---|---|---|
| Open feed | Partial | likely loads |
| Create text post | Partial-to-Working | strongest feed action |
| Create media post | Partial | backend shape exists, runtime unverified |
| View post | Partial | depends on feed load |
| Like post from feed | Partial | backend exists, UI consistency is weak |
| Unlike post from feed | Partial | same issue |
| Bookmark post from feed | Broken/Local-only | cosmetic on main feed |
| Remove bookmark from feed | Broken/Local-only | cosmetic on main feed |
| Share post | Partial | copies likely-invalid public URL pattern |
| View following feed | Broken | random filter logic |

### Comments

| Operation | Status | Notes |
|---|---|---|
| View comments | Partial | likely works |
| Add top-level comment | Partial | likely works |
| Edit comment | Partial | code path exists |
| Delete comment | Partial | code path exists |
| Reply to comment | Broken | reply parent not persisted |
| View threaded replies | Broken | depends on missing `replyTo` |

### Profiles / Relationships

| Operation | Status | Notes |
|---|---|---|
| View own profile | Partial | likely works |
| Edit profile | Partial | likely works |
| View other profile | Partial | username lookup is not scalable |
| Follow user | Partial/Broken-by-screen | backend exists, some UIs are local-only |
| Unfollow user | Partial/Broken-by-screen | same issue |
| Message user from profile | Partial | routes to generic chat, not precise DM flow |
| Change avatar | Partial/Broken | UI affordance not fully wired |

### Saved / Bookmarks

| Operation | Status | Notes |
|---|---|---|
| View saved posts | Partial | load path exists |
| Save post | Partial | backend exists, not always used |
| Unsave post | Partial/Broken-by-screen | UI inconsistencies |

### Pods

| Operation | Status | Notes |
|---|---|---|
| Create pod | Partial-to-Working | likely works |
| View pod list | Partial-to-Working | likely works |
| View pod detail | Partial | depends on subfeatures |
| Join pod | Partial-to-Working | likely works |
| Leave pod | Partial-to-Working | likely works |
| Cheer in pod | Broken/Local-only | stored in localStorage |
| Share pod | Broken/Unwired | missing handler in places |

### Pod Chat / Messaging

| Operation | Status | Notes |
|---|---|---|
| Open pod chat | Broken | room lookup mismatch |
| Send pod message | Broken | wrong room target |
| Reply in pod chat | Broken | reply metadata not passed |
| Open DM room | Partial/Broken | depends on which flow created it |
| Send DM | Partial/Broken | duplicate room models |
| List all chat rooms | Broken-risk | room type mismatch |

### Calendar / Events

| Operation | Status | Notes |
|---|---|---|
| View events | Partial-to-Working | likely works |
| Create event | Partial-to-Working | likely works |
| Edit event | Partial | likely works |
| Delete event | Partial | likely works |
| Create pod meeting | Broken-risk | duplicates events |
| RSVP flow | Partial | helper layer exists |

### Vault / Resources

| Operation | Status | Notes |
|---|---|---|
| View resources | Partial | likely works |
| Upload resource | Broken | wrong function call signature |
| Download resource | Broken | response object handled incorrectly |
| Like resource | Broken/Local-only | not implemented fully |
| Bookmark resource | Broken/Local-only | not implemented fully |
| View recent resources | Broken-risk | wrong field mapping |

### Courses

| Operation | Status | Notes |
|---|---|---|
| Browse courses | Partial | likely works |
| View course detail | Partial | likely works |
| Detect enrollment | Broken | hardcoded false |
| Watch lesson | Mocked/Partial | placeholder player |
| Take notes | Mocked | notes panel uses mock data |
| Submit assignment | Broken | UI/API mismatch |
| Instructor grading | Broken-risk | service mismatch |

### Notifications

| Operation | Status | Notes |
|---|---|---|
| View notifications | Partial | one service path exists |
| Mark notification read | Partial | likely works in one system |
| Mark all read | Partial | likely works in one system |
| Accept pod invite | Broken | missing user args in join call |
| Save notification preferences | Broken/Unwired | UI not connected |

### AI / Assistant

| Operation | Status | Notes |
|---|---|---|
| Open AI chat page | Partial | UI exists |
| Send AI prompt | Partial-to-Working | depends on env/network |
| Mention AI in chat | Partial | route path exists, chat path itself is weaker |

### Business / Enterprise Surfaces

| Operation | Status | Notes |
|---|---|---|
| Checkout payment | Mocked | fake session URL |
| Download certificate | Mocked | placeholder route |
| View analytics | Mocked | static dashboard |
| View leaderboard | Mocked | static leaderboard |
| Run admin broadcast flows | Partial/Broken-risk | structure exists, runtime confidence low |

## Root-Cause Patterns

These patterns explain most failures:

1. **Duplicate implementations**
   - same feature exists in UI-local logic, service logic, and API routes
   - those implementations do not share one contract

2. **Frontend/service signature mismatch**
   - function parameters do not match how callers invoke them

3. **Data-model mismatch**
   - chat room IDs, room types, reply fields, and transformed models are inconsistent

4. **Demo logic mixed into product logic**
   - mock arrays, placeholders, random values, and TODO behavior are present in live screens

5. **Insufficient type safety**
   - widespread `@ts-nocheck` hides integration failures

6. **Missing operational test coverage**
   - current tests do not verify real user flows

## Production Readiness Assessment

Current production readiness is low. The codebase is closer to a broad prototype than a hardened product. The main blocker is not missing infrastructure. The main blocker is contract inconsistency between UI, API routes, and the shared service layer.

## Priority Fix Order

### P0 — Must Fix First

1. Consolidate chat architecture
   - one room type model
   - one room ID strategy
   - one message send/list path
   - one reply model

2. Fix comments/replies model
   - persist `replyTo`
   - load threads from the same contract used by writes

3. Fix resource upload/download
   - correct function signatures
   - correct return handling
   - remove broken “recent” field assumptions

4. Remove local-only social actions from live screens
   - bookmarks
   - follows
   - profile post actions
   - pod cheers if intended to persist

5. Merge notification systems
   - choose one data model and delete or quarantine the other

### P1 — Fix Next

1. Repair course enrollment and assignment submission
2. Fix calendar meeting duplication
3. Replace random/demo feed filtering
4. Correct instructor service/API contract usage
5. Remove placeholder business flows from production entry points

### P2 — Hardening

1. Remove `@ts-nocheck` from feature-critical files
2. Add end-to-end flow tests for:
   - auth
   - post create/like/save/comment/reply
   - pod create/join/chat
   - DM send/list
   - calendar create/meeting
   - resource upload/download
   - course enrollment/submission
3. Add contract tests between UI callers and service functions
4. Add proper observability and audit logging across all write paths

## Recommended Execution Plan

### Phase 1 — Contract Cleanup

- choose one authoritative backend access pattern per feature:
  - either UI -> API routes
  - or UI -> service layer
- do not keep both unless the service layer is used only inside API routes

### Phase 2 — Critical Social Flows

- posts
- comments/replies
- follows
- bookmarks
- notifications

### Phase 3 — Collaboration Flows

- pods
- pod chat
- direct messaging
- calendar meetings
- vault/resources

### Phase 4 — Learning and Monetization

- courses
- assignments
- instructor tooling
- payments
- certificates

## Final Assessment

Not everything is broken, but the product is not operationally trustworthy in its current state. The main live risk is inconsistent behavior: the UI often appears complete while the underlying action is local-only, mismatched, or routed through the wrong backend contract.

The correct approach is not to patch screens one-by-one in isolation. The correct approach is to standardize the data and service contracts first, starting with chat, comments, resources, and notifications. Once those contract layers are stable, the rest of the product can be made production-ready in a controlled way.
