# Authenticated browser regression — 2026-08-22

## Scope

- Browser: Codex in-app Chromium against `http://localhost:3000`
- Session: existing authenticated owner account
- Page coverage: all 64 App Router page templates, including real pod, profile, message, instructor, student, admin, settings, legal, support, and invalid-ID routes
- Responsive coverage: desktop at 1440x900 and mobile at 390x844
- Stateful coverage: durable direct messages, direct voice call, direct video call, LiveKit in-call data chat, calendar-feed creation, pause, and re-enable
- Service coverage: the configured Appwrite, LiveKit, and Upstash services plus the public status probes

## Final verification

| Check | Result |
| --- | --- |
| TypeScript | Passed |
| ESLint | 0 errors; 1,131 existing warnings remain as cleanup debt |
| Contract tests | 33/33 passed |
| Backend reliability tests | 5/5 passed |
| Communications domain tests | 7/7 passed |
| Pods domain tests | 5/5 passed |
| Playwright E2E | 3/3 passed |
| Mutation security audit | 69 mutations checked, 0 gaps |
| Appwrite schema verification | 50 collections, 629 attributes, 35 indexes, 5 buckets |
| LiveKit two-participant verification | E2EE audio/video and realtime data passed; temporary room cleaned |

## Resolved findings

### Notification inbox/schema mismatch

- The inbox now orders by the provisioned `timestamp` attribute, uses the canonical database configuration, and clamps paging input.
- Authenticated `/app/notifications` and `/api/notifications/inbox` load without the former schema error.

### Admin middleware crash and duplicate authorization

- Admin authorization now uses the canonical server-side Appwrite session/role validator.
- The duplicate proxy owner gate and client guard were removed.
- The authenticated owner command center and its live metrics render successfully.

### Calendar Sync demo UI

- The settings surface is connected to the real management API at `/app/settings/calendar-sync`.
- Browser verification created a private feed, saved its name, paused it, and enabled it again.
- The generated ICS endpoint is a download response; external clients require the deployed HTTPS application base URL.

### Legacy pod-course endpoint

- The route now awaits the canonical Appwrite admin client and uses the provisioned query fields.
- Backend reliability coverage prevents regression.

### Redirect-only and disconnected routes

- `/app`, dashboard, courses, explore/search, legacy messages, and calendar-sync aliases now redirect to canonical destinations while preserving relevant query parameters.
- Next 16 async `searchParams` handling is fixed.
- `/app/messages/[userId]` opens the canonical chat surface and resolves the recipient safely.

### Status page

- Synthetic uptime, random hydration data, and fabricated incidents were removed.
- `/status` now reports live Appwrite, LiveKit, and Upstash probes and labels untested integrations honestly.

### Profile ensure request storm

- Existing profile reads no longer consume mutation rate limits.
- Profile creation/update remains protected, concurrent requests are coalesced, and the duplicate fallback write was removed.
- A concurrency probe produced one legitimate create and stable reads without a 429 storm.

### Pod discovery controls and navigation

- `Most active`, `Starting soon`, and `Mentor-led` are real filters.
- Search applies consistently to active and recommended Pods.
- Mobile navigation exposes the primary destinations and a complete More sheet; desktop navigation uses the compact canonical sidebar.

### Calling runtime crash and duplicated call stacks

- The LiveKit control-bar provider crash was fixed.
- Direct, group, pod, and classroom entry points share one global call provider and one call stage.
- Participants who leave are not resurfaced as active, and the last participant leaving can terminate the durable session.
- Caller-only “End for all”, participant “Leave”, device selectors, screen sharing, adaptive streaming, dynacast, retry handling, and E2EE media/data are wired.

### PWA development stream/chunk errors

- Localhost service-worker requests are network-only so stale Next chunks and RSC payloads cannot survive HMR.
- User-specific API responses are never cached in production.
- The service-worker cache version was advanced to invalidate the stale cache.

### Security header disclosure

- `poweredByHeader: false` removes the framework disclosure at the correct Next configuration layer.

## Stateful browser evidence

- Sent a labeled realtime message in an existing conversation; it reached the acknowledged state and survived reload.
- Opened a legacy profile-message deep link, created/reused the canonical DM, displayed the correct recipient and member count, and sent a second acknowledged message.
- Started and joined a real two-member voice call; LiveKit connected with microphone disabled and exposed real browser devices.
- Sent and observed a labeled message through LiveKit's encrypted in-call data channel.
- Ended the voice call for all, then started and joined a real video call with camera/microphone disabled and ended it cleanly.
- Private profile lookup now returns a public projection and does not expose email or Appwrite permission metadata.

## Remaining release work

- Run a controlled multi-account acceptance test where separate browsers accept an incoming direct and group call; this session verified room creation and two simultaneous SDK participants but not a human second-account UI.
- Run a staged load test before claiming 2,000 concurrent users. No production-scale load was generated in this pass because that can incur provider cost and affect the live project.
- Configure the deployed HTTPS `NEXT_PUBLIC_APP_URL` before subscribing external calendar clients.
- Configure and test optional AI and outbound-email providers if those product surfaces will ship.
- Rotate every credential that was pasted into chat and replace placeholder administrative secrets before production.
- Pay down the existing ESLint warning backlog and add authenticated Playwright storage-state scenarios to CI.
