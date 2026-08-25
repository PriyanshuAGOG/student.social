# Canonical architecture

This document is the decision record for new development. Compatibility code may remain temporarily, but it must not receive new features.

## Product domains

| Domain | Canonical implementation | Compatibility only |
| --- | --- | --- |
| Pods | `components/pods2`, `lib/pods`, `/api/pods2` | `components/pods`, `/api/pods` |
| Notifications | `/api/notifications`, `notifications` collection, notification worker for delivery | direct browser database writes and duplicate notification service implementations |
| Calls | LiveKit, `lib/appwrite/calls.ts`, `/api/calls/sessions` | `/api/calls/start`, `/respond`, `/end`, Jitsi helpers |
| Server data | `lib/server/appwrite.ts` and authenticated route handlers | direct `node-appwrite` construction and `lib/appwrite-comprehensive-fixes.ts` |

## Invariants

1. Browser code uses the Appwrite Web SDK only for session-aware reads/realtime that Appwrite permissions protect. Mutations go through route handlers.
2. Route handlers derive actor identity from `requireUser`; actor/user/instructor IDs from request bodies or query strings are never trusted.
3. Mutations enforce same-origin checks, schema validation, resource ownership/role checks, and the global durable limiter in `proxy.ts`.
4. Production requires Upstash REST credentials. The limiter fails closed when its durable store is missing or unavailable.
5. `APPWRITE_*` is the server source of truth. Matching `NEXT_PUBLIC_APPWRITE_*` values exist only where the browser needs them. A mismatch throws when server data access begins.

## Schema ownership

- `pnpm update-schema` owns the base database, including canonical notifications and LiveKit call session collections.
- `pnpm appwrite:setup-pods` owns Pods2-specific collections and buckets.
- `node scripts/setup-notifications-db.js` owns optional push/email/SMS delivery preferences and queues.
- The retired `setup-calls-db.js` and duplicate Pods `.mjs` scripts must not be restored.

## Migration rule

Move a caller to the canonical boundary, cover it with a contract/integration test, then remove its compatibility endpoint. Do not perform data migrations implicitly in request handlers.
