# Student.social Bug-Fixing Tracker

Generated on 2026-05-27 from static code inspection, existing audit reports, and targeted code review.

## How To Use This Tracker
- `Priority`:
  - `P0` = security/auth breakage, data corruption, or blocked core flow.
  - `P1` = major user-facing failure in a primary workflow.
  - `P2` = inconsistent behavior, degraded UX, or secondary flow failure.
  - `P3` = polish, edge-case, or post-stabilization cleanup.
- `Confidence`:
  - `High` = explicitly confirmed by code/audit evidence.
  - `Medium` = strong static signal, still needs runtime validation.
  - `Low` = likely risk inferred from architecture or surrounding inconsistencies.
- `Status`:
  - `Todo`, `Investigate`, `Fixing`, `Fixed-awaiting-runtime`, `Validated`.

## Immediate Queue

| Order | Priority | Area | Issue | User Impact | Confidence | Status |
|---|---|---|---|---|---|---|
| 1 | P0 | Auth | Session/auth state needs real end-to-end validation across login, register, verify-email, refresh, logout | Users can be locked out, looped between auth screens, or appear logged in/out incorrectly | Medium | Fixing |
| 2 | P0 | Auth | Authorization consistency across many route handlers remains a repo-level risk | Broken access control can affect every protected feature | Medium | Fixing |
| 3 | P1 | Chat | Pod chat architecture is only partially stabilized after room-ID/type mismatch fixes | Messaging can still fail in core pod collaboration flows | High | Fixing |
| 4 | P1 | Feed | Feed social actions are improved but still inconsistent by screen and path | Like/save/share/comment behavior may disagree across feed/profile/saved views | High | Fixing |
| 5 | P1 | Pods | Pod detail actions include several cosmetic or weakly wired actions | Users can click controls that do not truly persist or complete | High | Fixing |
| 6 | P1 | Vault | Resource access-control and full upload/download lifecycle still need runtime validation | Uploading/downloading study materials may fail or expose the wrong data | High | Fixing |
| 7 | P1 | Chat | Direct-message and master-chat flows still need consolidation testing | Users can land in fragmented conversations or stale room lists | High | Fixing |
| 8 | P1 | Feed | Threaded comments/replies were patched but not runtime-validated | Comment threads can silently flatten, drift, or miscount | High | Fixing |
| 9 | P1 | Pods | Pod meeting/live session workflows still look production-risky | Users can create duplicate or broken session/calendar states | Medium | Fixing |
| 10 | P2 | Feed | Share/report/post-open behaviors are uneven and likely under-verified | Social engagement actions may no-op or route inconsistently | Medium | Fixing |
| 11 | P2 | Auth | OAuth and email-verification transitions need cross-browser verification | Third-party login can strand users in half-complete onboarding/verification states | Medium | Fixing |
| 12 | P2 | Vault | Search/filter/sort/view modes need behavioral validation against real data | Users may see incorrect resource sets or stale counts | Medium | Fixing |

## Feed Tracker

### Progress note - 2026-05-27 pass 2
- Stabilized comment count behavior in [comments-section.tsx](D:/student.social/components/comments-section.tsx):
  - live visible counts now derive from current comment tree state
  - load, create, and delete paths now push updated counts through `onCommentCountChange`
  - reply insertion no longer relies on stale count math
- Result:
  FEED-02 moved from static-risk-only into active remediation, but browser/runtime validation is still needed.

### Progress note - 2026-05-27 pass 3
- Stabilized secondary feed/profile/saved social paths:
  - feed share links now use the deployed app origin and support native share with clipboard fallback.
  - feed reports now call authenticated [reports route](D:/student.social/app/api/reports/route.ts) instead of only showing a toast.
  - own-profile comments now open the existing feed post route instead of a dead `/app/post/...` path.
  - public-profile message actions now route to the specific direct-message path.
- Added contract coverage in [tests.contract.mjs](D:/student.social/tests.contract.mjs).
- Result:
  FEED-01 and FEED-04 moved into active remediation. Core like/save unification and browser validation still remain.

### FEED-01
- Priority: `P1`
- Status: `Fixing`
- Title: Cross-screen post like/save consistency
- Risk: users see the same post with different like/save state depending on screen.
- User impact: feed, profile, and saved-post surfaces stop feeling trustworthy.
- Evidence:
  - prior audit explicitly called out inconsistent screen-level persistence and only partial cleanup.
  - feed page now calls `feedService.toggleLike(...)` and `feedService.toggleSavePost(...)` in [app/app/feed/page.tsx](D:/student.social/app/app/feed/page.tsx).
  - own/public profile surfaces were patched separately in prior audit, which is usually a sign of contract drift rather than one unified interaction path.
- Likely failure modes:
  - optimistic state diverges from backend truth.
  - saved list and feed card disagree after toggles.
  - refresh restores a different state than the last UI state.
- Fix direction:
  - standardize one post-card interaction contract shared by feed, profile, and saved screens.
  - enforce rollback-on-failure behavior for optimistic updates.
- Progress:
  - post like/save routes now enforce same-origin, rate limits, authenticated user context, and user ownership.
  - post update/delete routes now derive the acting user from verified auth context rather than trusting body/query identity.
  - contract coverage was added in [tests.contract.mjs](D:/student.social/tests.contract.mjs).
- Verify:
  - like, unlike, save, unsave on feed.
  - same post on profile immediately reflects state.
  - saved page updates without stale cache.

### FEED-02
- Priority: `P1`
- Status: `Fixing`
- Title: Threaded comment and reply runtime verification
- Risk: patched reply model may still break under real data or older records.
- User impact: discussions are unreliable in one of the app’s main engagement flows.
- Evidence:
  - prior audit documented broken `replyTo` persistence and tree rendering, then later marked it only partially repaired.
  - comments component now builds a tree from `replyTo` in [components/comments-section.tsx](D:/student.social/components/comments-section.tsx).
  - reply creation is now passed through the UI, but no browser/runtime validation has been done.
- Likely failure modes:
  - replies render as top-level comments.
  - reply counts drift after nested updates.
  - older comments without `replyTo` shape break tree construction.
- Fix direction:
  - test mixed top-level/reply datasets.
  - add focused contract tests around reply serialization and count recomputation.
- Progress:
  - comment creation now enforces authenticated ownership and same-origin/rate-limited mutation.
  - reply creation now validates that the parent comment belongs to the same post and is not deleted before creating the reply.
  - invalid cross-post parent comments now return a validation error instead of corrupting reply counts.
- Verify:
  - add top-level comment.
  - reply to top-level comment.
  - reply to an item after refresh.
  - edit/delete on threaded items.

### FEED-03
- Priority: `P1`
- Status: `Fixing`
- Title: Following feed correctness
- Risk: following tab depends on profile relationship data quality.
- User impact: “Following” can feel empty or wrong even when the user follows people.
- Evidence:
  - prior audit called the following tab broken before a patch.
  - current feed filters with `profile?.following` in [app/app/feed/page.tsx](D:/student.social/app/app/feed/page.tsx).
  - if profile follow arrays are stale or differently shaped, the tab silently degrades.
- Likely failure modes:
  - followed authors missing from following feed.
  - empty feed despite real follows.
  - inconsistent behavior after follow/unfollow.
- Fix direction:
  - verify shape and freshness of `profile.following`.
  - consider fetching relationship truth from backend instead of trusting hydrated profile state alone.
- Progress:
  - follow/unfollow API is now tied to the authenticated user context and dedupes follower/following arrays.
  - public and own profile pages now render numeric relationship counts from arrays or stored count fields.
  - follow API returns authoritative relationship counts so public profile UI does not rely only on local +/- math.
- Verify:
  - follow a user, return to following feed, refresh, and confirm results.

### FEED-04
- Priority: `P2`
- Status: `Fixing`
- Title: Share/report/post-open interaction completeness
- Risk: secondary actions may still be partially wired or local-only.
- User impact: users lose trust when menu actions do nothing or behave inconsistently.
- Evidence:
  - feed page exposes `handleShare`, `handleReportPost`, and `handlePostClick` in [app/app/feed/page.tsx](D:/student.social/app/app/feed/page.tsx).
  - prior audit specifically said share/public-route consistency still remained.
- Likely failure modes:
  - native share unsupported path not handled well.
  - report action only toasts without persistence.
  - post open path leads nowhere meaningful.
- Fix direction:
  - document desired behavior for each secondary action.
  - back each action with a real route or remove it until implemented.

### FEED-05
- Priority: `P2`
- Status: `Todo`
- Title: Celebration composer and achievements rail validation
- Risk: feed-adjacent engagement features may be present but weakly exercised.
- User impact: confusing if “celebrate” posts or pod achievement items fail silently.
- Evidence:
  - celebration creation uses `feedService.createPost(...)` with metadata in [app/app/feed/page.tsx](D:/student.social/app/app/feed/page.tsx).
  - achievements are partially synthesized from pod progress data.
- Likely failure modes:
  - celebration posts missing fields or wrong visibility.
  - synthetic achievement cards do not map cleanly to normal post interactions.

## Auth Tracker

### Progress note - 2026-05-27 pass 1
- Implemented secure auth-context derivation in [api-security.ts](D:/student.social/lib/api-security.ts):
  verified signed session cookie parsing, JWT cookie/header validation, user-context mismatch rejection, and production-only removal of blind `x-user-id` trust.
- Implemented JWT cookie rotation and cookie-aware token validation in:
  [login route](D:/student.social/app/api/auth/login/route.ts),
  [refresh-token route](D:/student.social/app/api/auth/refresh-token/route.ts),
  [validate-session route](D:/student.social/app/api/auth/validate-session/route.ts),
  [logout route](D:/student.social/app/api/auth/logout/route.ts).
- Result:
  auth contract is materially stronger, but full browser/runtime validation is still required.

### AUTH-01
- Priority: `P0`
- Status: `Fixing`
- Title: End-to-end session lifecycle validation
- Risk: auth is one of the strongest subsystems structurally, but it still has not been fully runtime-validated.
- User impact: complete app lockout, redirect loops, or phantom-auth states.
- Evidence:
  - auth context relies on `/api/auth/session` plus local context synchronization in [lib/auth-context.tsx](D:/student.social/lib/auth-context.tsx).
  - repo docs claim major auth fixes, but the audit still says deployed Appwrite session behavior remains unverified.
- Likely failure modes:
  - login succeeds server-side but client context remains stale.
  - refresh/load race leaves user on wrong screen.
  - logout clears UI but leaves server session alive or vice versa.
- Fix direction:
  - run full browser validation for register, login, reload, logout, expired session, and refresh flows.
  - add explicit session-state regression tests around page refresh and protected-route entry.
- Progress in current pass:
  - `/api/auth/session` now uses timing-safe session-cookie signature checks and rejects expired signed session payloads.
  - contract coverage was added in [tests.contract.mjs](D:/student.social/tests.contract.mjs).

### AUTH-02
- Priority: `P0`
- Status: `Fixing`
- Title: Authorization matrix for mutating routes
- Risk: large route surface with mixed enforcement patterns can hide broken object-level authorization.
- User impact: users may mutate or read data they should not access.
- Evidence:
  - security audit flagged authorization consistency as high risk across the API surface.
  - the repo still has a large mixed set of route handlers and direct service calls.
- Likely failure modes:
  - user can operate on another user’s posts/resources/pod artifacts by ID.
  - some routes trust client-sent IDs too much.
- Fix direction:
  - create actor-resource-action-condition matrix for at least feed, pods, chat, vault, and notifications first.
  - add policy tests for ownership and membership checks.
- Progress in current pass:
  - protected-route helpers now verify signed cookie and JWT state instead of trusting `x-user-id` by default.
  - core message and pod membership routes were moved onto that verified auth context.
  - `/api/auth/send-verification` now requires authenticated ownership before sending a verification email for a user ID.
  - `/api/users/[id]/follow` now requires authenticated ownership and same-origin/rate-limited requests instead of trusting a posted `userId`.
  - post, pod, notification, course-generation, and assignment-grading routes were swept for blind `x-user-id`/`user-id` trust; no `app/api` route now depends on those headers for authorization.

### AUTH-03
- Priority: `P1`
- Status: `Fixing`
- Title: Email verification transition stability
- Risk: the app intentionally blocks unverified users, so any mismatch here is a full-flow blocker.
- User impact: newly registered users can get stuck between login, verify-email, and the main app.
- Evidence:
  - login/register/verify flow is spread across [app/login/page.tsx](D:/student.social/app/login/page.tsx), [app/register/page.tsx](D:/student.social/app/register/page.tsx), [app/verify-email/page.tsx](D:/student.social/app/verify-email/page.tsx), and [lib/auth-context.tsx](D:/student.social/lib/auth-context.tsx).
  - several redirect branches depend on `hasActiveSession`, `isEmailVerified`, and `sessionChecked`.
- Likely failure modes:
  - verified user kept on verify screen.
  - unverified user appears authenticated but cannot enter protected app routes cleanly.
  - resend/refresh timing leaves stale context.
- Progress:
  - verification resend API is now protected by verified caller identity and rate limiting, reducing abuse and cross-account resend bugs.
  - session endpoint now rejects expired signed session cookies during client auth refresh.

### AUTH-04
- Priority: `P2`
- Status: `Todo`
- Title: OAuth handoff verification
- Risk: third-party auth often breaks on redirect/cookie edge cases.
- User impact: Google/GitHub sign-in can fail more often than email/password without obvious recovery.
- Evidence:
  - login and register both expose OAuth entry points.
  - oauth start/return routes exist, but no runtime validation was recorded.
- Fix direction:
  - test new-user OAuth, existing-user OAuth, unverified-email branch, and onboarding branch.

### AUTH-05
- Priority: `P2`
- Status: `Todo`
- Title: Session/profile bootstrap resilience
- Risk: auth success depends on immediate profile bootstrap via `ensureProfileExists(...)`.
- User impact: user may authenticate but see partial app failures if profile creation/read hiccups.
- Evidence:
  - auth context calls `profileService.ensureProfileExists(...)` during session bootstrap in [lib/auth-context.tsx](D:/student.social/lib/auth-context.tsx).
  - failures are warned but not necessarily surfaced clearly to users.
- Likely failure modes:
  - auth works, profile-dependent pages break later.
  - inconsistent first-load behavior for newly created accounts.

## Pods Tracker

### Progress note - 2026-05-27 pass 1
- Hardened pod membership mutations in:
  [join route](D:/student.social/app/api/pods/[id]/join/route.ts) and
  [leave route](D:/student.social/app/api/pods/[id]/leave/route.ts)
  so caller identity must match the authenticated server-side user context.
- Result:
  membership changes are less vulnerable to forged client user IDs, but pod detail actions still need a wider audit.

### POD-01
- Priority: `P1`
- Status: `Fixing`
- Title: Pod detail action audit
- Risk: pod core CRUD is decent, but several detail-page actions still look cosmetic or weakly verified.
- User impact: users click pod actions expecting collaboration features that do not truly persist.
- Evidence:
  - prior audit explicitly said some pod detail actions are still cosmetic.
  - pod detail page exposes many handlers in [app/app/pods/[podId]/page.tsx](D:/student.social/app/app/pods/[podId]/page.tsx): session controls, pledge, check-in, RSVP, vault/chat/calendar opens, cheer, leave.
- Likely failure modes:
  - action toasts without durable backend state.
  - local view updates but other members never see the change.
- Fix direction:
  - audit each handler against a real backend contract and record whether it is persisted, local-only, or navigational.
- Progress:
  - pod create/update/delete routes now derive the actor from verified auth context and reject caller/user mismatches.
  - pod study-session create/update actions now require authenticated ownership, and start/end is limited to the session host.
  - pod course commitments now require authenticated ownership for create/read/update.
  - pod course-generation routes now require authenticated pod membership and store `createdBy` from verified auth context.
  - Added contract coverage in [tests.contract.mjs](D:/student.social/tests.contract.mjs).

### POD-02
- Priority: `P1`
- Status: `Fixing`
- Title: Join/leave/create pod runtime validation
- Risk: these are primary acquisition flows and any failure blocks pod adoption.
- User impact: user cannot enter the collaboration layer of the product.
- Evidence:
  - current status in prior reports is “partial-to-working” rather than fully validated.
  - pods page and join routes were recently reworked.
- Verify:
  - create pod.
  - join existing pod.
  - leave pod.
  - refresh and confirm membership counts and pod list state.

### POD-03
- Priority: `P1`
- Status: `Fixing`
- Title: Pod live-session and meeting workflow
- Risk: meeting/calendar coupling has already needed a repair pass, which is a strong sign this area remains fragile.
- User impact: duplicate sessions, bad event state, or broken meeting entry.
- Evidence:
  - prior audit marked pod meeting workflow as production-risky.
  - calendar duplication was fixed once, but runtime validation is still pending.
- Likely failure modes:
  - duplicate event creation.
  - meeting URL not attached to expected event.
  - invitees land on inconsistent calendar/session state.
- Progress:
  - study-session host identity is now server-derived from auth context.
  - session status transitions now require the authenticated host.

### POD-04
- Priority: `P2`
- Status: `Todo`
- Title: Invite/member management flow validation
- Risk: member growth flows are operationally important and easy to partially wire.
- User impact: invite links, email invites, and member actions can mislead users and pod admins.
- Evidence:
  - invite/member features span page-level pod flows plus [components/pods/tabs/EnhancedMembersTab.tsx](D:/student.social/components/pods/tabs/EnhancedMembersTab.tsx).
  - notification invite acceptance required a separate fix already.

### POD-05
- Priority: `P2`
- Status: `Fixing`
- Title: Accountability features consistency
- Risk: pledge, check-in, RSVP, and reactions are core pod stickiness features but not yet fully validated as a set.
- User impact: a pod can look active while its accountability records are incomplete or stale.
- Evidence:
  - pod service contains pledge/check-in/RSVP/reaction methods in [lib/appwrite.ts](D:/student.social/lib/appwrite.ts).
  - prior reports mention this cluster as improved but not fully proven.
- Progress:
  - pod cheers now persist through `podService.incrementReaction(...)` and display server totals instead of local storage state.
  - pod detail resource loading now uses the explicit `{ podId }` resource filter contract.
  - course commitment create/read/update now requires authenticated ownership.
  - Added contract coverage in [tests.contract.mjs](D:/student.social/tests.contract.mjs).

## Chat Tracker

### Progress note - 2026-05-27 pass 1
- Hardened direct-message and room APIs in:
  [messages send route](D:/student.social/app/api/messages/send/route.ts) and
  [room route](D:/student.social/app/api/messages/room/[roomId]/route.ts)
  with authenticated ownership checks and room-membership enforcement.
- Stabilized shared chat service in [appwrite.ts](D:/student.social/lib/appwrite.ts):
  - direct-room canonicalization across legacy `dm` and canonical `direct`
  - pod-room member synchronization
  - sender membership validation before message creation
  - deduped user room listing
- Stabilized client room normalization in [chat page](D:/student.social/app/app/chat/page.tsx) to reduce duplicate/stale room surfaces.

### CHAT-01
- Priority: `P1`
- Status: `Fixing`
- Title: Pod room resolution and message delivery validation
- Risk: pod chat was previously broken by room-ID assumptions and is still only marked partial.
- User impact: users cannot rely on pod chat for real collaboration.
- Evidence:
  - recent fix introduced `getOrCreatePodRoom(...)` and patched routing.
  - prior audit still leaves pod chat at partial.
  - current chat page auto-creates pod rooms from route params in [app/app/chat/page.tsx](D:/student.social/app/app/chat/page.tsx).
- Likely failure modes:
  - route param points to pod ID but selected room list remains stale.
  - messages send to a room that exists but is not visible in the list.
  - duplicate pod rooms appear.

### CHAT-02
- Priority: `P1`
- Status: `Fixing`
- Title: Direct-message room canonicalization
- Risk: legacy `dm` and canonical `direct` types can still create split-brain behavior.
- User impact: users may have duplicate or missing direct threads.
- Evidence:
  - recent cleanup added tolerance for both room types.
  - audit history explicitly called out one DM path using `dm` and another using `direct`.
- Fix direction:
  - migrate/normalize room type at read or write boundary.
  - ensure one canonical direct-room lookup for all entry points.

### CHAT-03
- Priority: `P1`
- Status: `Todo`
- Title: Reply-in-chat behavior
- Risk: message replies are exposed in UI but less proven than base send.
- User impact: users can lose conversation context in threaded discussion.
- Evidence:
  - chat page tracks `replyingTo` and passes `replyTo` metadata in [app/app/chat/page.tsx](D:/student.social/app/app/chat/page.tsx).
  - chat load path fetches `replyToMessage` opportunistically, which can fail if parent records are missing or out of batch.
- Likely failure modes:
  - reply preview shows before send but disappears after refresh.
  - reply target not resolved if parent message is not in current batch.

### CHAT-04
- Priority: `P2`
- Status: `Todo`
- Title: Polling/realtime reliability and stale-room UX
- Risk: the chat page uses polling and room refresh patterns that may feel flaky under real load.
- User impact: delayed messages, stale unread state, noisy reconnect banner behavior.
- Evidence:
  - chat page polls messages every 3 seconds in [app/app/chat/page.tsx](D:/student.social/app/app/chat/page.tsx).
  - connection status is inferred from polling success rather than a fully coherent realtime contract.

### CHAT-05
- Priority: `P2`
- Status: `Todo`
- Title: Attachment and AI-in-chat flows
- Risk: these are additive features layered on top of a not-yet-fully-stable message core.
- User impact: attached files or `@ai` interactions can fail while regular messaging appears to work.
- Evidence:
  - chat page supports file picker and `@ai` message generation in [app/app/chat/page.tsx](D:/student.social/app/app/chat/page.tsx).
  - these paths depend on both messaging and AI route correctness.

## Vault Tracker

### Progress note - 2026-05-27 pass 2
- Fixed major vault UI contract gaps in [vault page](D:/student.social/app/app/vault/page.tsx):
  - `Uploads` tab now renders actual user uploads instead of a permanent empty state
  - search now includes author names
  - sort modes now affect rendered results
  - bookmark/recent subsets now derive from sorted resource collections
  - resource open path now records views through `incrementResourceView(...)` in [appwrite.ts](D:/student.social/lib/appwrite.ts)
- Added contract coverage for these behaviors in [tests.contract.mjs](D:/student.social/tests.contract.mjs).

### Progress note - 2026-05-27 pass 3
- Aligned global vault and pod vault entry points:
  - global vault now reads `?pod=...` and loads pod-scoped resources alongside the user's uploads.
  - uploads from a pod-scoped vault now persist as `visibility: "pod"` with the scoped `podId`.
  - pod detail vault navigation already points to `/app/vault?pod=...`, so the global vault now honors that route.
- Added contract coverage for pod-scoped vault load/upload behavior in [tests.contract.mjs](D:/student.social/tests.contract.mjs).
- Result:
  VAULT-02, VAULT-04, and VAULT-05 moved into active remediation; runtime/Appwrite permission validation still remains.

### VAULT-01
- Priority: `P1`
- Status: `Fixing`
- Title: Full upload-to-view-to-download lifecycle validation
- Risk: vault contracts were recently repaired, but this path has not been runtime-validated.
- User impact: users can upload notes/resources and then fail to retrieve or share them.
- Evidence:
  - prior audit repaired upload signature, download handling, and bookmark wiring, then still marked vault partial.
  - vault page now uses real resource service methods in [app/app/vault/page.tsx](D:/student.social/app/app/vault/page.tsx).
- Verify:
  - upload each major file type.
  - view/open uploaded file.
  - download uploaded file.
  - ensure counts and recent lists update.

### VAULT-02
- Priority: `P1`
- Status: `Fixing`
- Title: Resource authorization and visibility correctness
- Risk: resources are sensitive shared content and are especially vulnerable to inconsistent access rules.
- User impact: users may see private material they should not or fail to see material they should.
- Evidence:
  - prior audit explicitly left access-control/runtime validation unresolved for vault/resources.
  - vault merges public resources with user-owned resources at load time in [app/app/vault/page.tsx](D:/student.social/app/app/vault/page.tsx).
- Likely failure modes:
  - pod/private/public visibility leaks.
  - search or merged lists expose records outside intended audience.

### VAULT-03
- Priority: `P1`
- Status: `Todo`
- Title: Bookmark/like consistency across resource views
- Risk: interaction persistence was fixed recently but not comprehensively proven.
- User impact: users cannot trust bookmarks or popularity signals.
- Evidence:
  - vault page now calls `toggleLikeResource(...)` and bookmark actions through service methods.
  - prior stability notes still carried TODO references around vault likes/bookmarks before later fixes.

### VAULT-04
- Priority: `P2`
- Status: `Fixing`
- Title: Search, filter, sort, and tab result accuracy
- Risk: vault usefulness depends on discoverability, not just raw storage.
- User impact: users think resources are missing or duplicated.
- Evidence:
  - vault page supports search, type filters, sort modes, and tabs in [app/app/vault/page.tsx](D:/student.social/app/app/vault/page.tsx).
  - merged source lists plus client filtering increase the chance of subtle result bugs.

### VAULT-05
- Priority: `P2`
- Status: `Fixing`
- Title: Pod vault and global vault contract alignment
- Risk: pod-scoped resource views can diverge from the global resource vault.
- User impact: a resource appears in one context but not the other, or interaction state differs.
- Evidence:
  - pod resource surfacing exists through [components/pods/tabs/VaultTab.tsx](D:/student.social/components/pods/tabs/VaultTab.tsx).
  - global resource handling is implemented separately in [app/app/vault/page.tsx](D:/student.social/app/app/vault/page.tsx).

## Recommended Fix Order

1. `AUTH-01` session lifecycle validation
2. `AUTH-02` authorization matrix for feed/pods/chat/vault mutations
3. `CHAT-01` pod room/message delivery validation
4. `FEED-01` post interaction contract unification
5. `FEED-02` threaded comments/replies validation
6. `POD-01` pod detail action audit
7. `VAULT-01` upload/view/download lifecycle validation
8. `CHAT-02` DM canonicalization
9. `POD-03` meeting/live-session workflow stabilization
10. `VAULT-02` resource visibility/access audit

## Dependency Notes

- Feed, profile, and saved-post fixes should be treated as one interaction contract, not three isolated screens.
- Pod chat and master chat should be treated as one messaging system, not separate products.
- Vault global view and pod vault should share one resource permission and interaction model.
- Auth stabilization should happen before wide browser validation of feed/pods/chat/vault because all four depend on trustworthy session state.

## Suggested Next Execution Pass

The highest-signal next pass is:

1. Run browser/manual validation for `AUTH-01`, `CHAT-01`, `FEED-02`, and `VAULT-01`.
2. Convert failures from those runs into reproduction-based fixes.
3. After that, standardize shared contracts:
   - post interaction contract
   - chat room canonicalization contract
   - resource visibility contract
