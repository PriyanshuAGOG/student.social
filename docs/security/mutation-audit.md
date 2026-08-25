# Mutation security audit

Last audited: 2026-08-21

`pnpm audit:mutations` inventories every exported `POST`, `PUT`, `PATCH`, and `DELETE` handler under `app/api`. The audit currently covers 68 handlers and fails CI if a handler lacks one of the required controls.

## Required controls

- Authentication: a verified user/admin context, or an explicit public authentication contract for login, registration, verification, and password recovery.
- Ownership: actor identity is derived from the verified context and an existing resource, membership, or instructor relationship is checked where applicable.
- Validation: Zod/schema validation, constrained multipart validation, or an explicitly bodyless action.
- CSRF and rate limiting: every API mutation crosses `proxy.ts`, which performs same-origin checks and a durable fixed-window limit before the route executes.

Production fails closed when `UPSTASH_REDIS_REST_URL` or `UPSTASH_REDIS_REST_TOKEN` is absent, or when the durable limiter cannot be reached. Development uses a clearly non-durable in-memory fallback.

## Removed during the audit

- Unused legacy call mutations (`start`, `respond`, `end`, `token`, `callback`, `missed`).
- Unused legacy course-achievement feed mutations.
- Unused Pods course-chat/assignment mutations superseded by Pods2.
- Placeholder 2FA routes that accepted secrets and identities from the browser without durable server-side enrollment.
- Read-only certificate and calendar maintenance operations incorrectly exposed as mutations.

Run the strict audit whenever a route handler is added or changed. This source scan is a guardrail, not a substitute for integration tests of resource permissions.

## Residual client-SDK migration

The legacy `lib/appwrite.ts` facade still contains direct browser-side Appwrite document mutations. They are protected only by Appwrite collection permissions and therefore are not covered by the HTTP mutation audit or the durable proxy limiter. No new code may add to that facade. Each remaining domain must move behind an authenticated route before the mutation audit can be considered complete across the whole application.
