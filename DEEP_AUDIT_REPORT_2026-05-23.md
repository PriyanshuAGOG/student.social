# Deep Audit Report — student.social
Date: 2026-05-23 (UTC)

## Scope and methodology
- Static codebase scan across `app/`, `components/`, `lib/`, `types/`, configuration and project manifests.
- API surface inventory for Next.js route handlers.
- Lint and static warnings review.
- Security smell scan for dangerous sinks/secrets/auth boundaries and weak defaults.

> Note: This is a static audit only. A true “every button click” runtime audit also requires E2E automation + manual exploratory testing against a running environment with production-like data.

## High-level architecture observed
- Next.js App Router full-stack app with server routes under `app/api/**/route.ts`.
- Large Appwrite-centric data/service layer (`lib/appwrite.ts` and related variants).
- Feature domains include:
  - Social feed/posts/comments/likes/saves
  - Pods/study groups/classroom/video/chat
  - Courses/enrollment/content generation/youtube ingestion
  - Instructor dashboards/grading/assignments
  - Payments/checkout
  - Certificates
  - Messaging/notifications/calendar
  - AI assistant/chat

## Current baseline quality signals
- Lint status: **0 errors, 715 warnings**.
- Warning profile shows high type-risk and maintenance risk:
  - Widespread `any`
  - Multiple `@ts-nocheck`
  - Unused vars/imports and dead code signals
- This is not “zero-bug” ready; it indicates elevated probability of runtime edge-case failure.

## Critical security and reliability concerns

### 1) Public fallback identifiers and unsafe defaults (High)
Many files provide hardcoded fallback project/database/bucket/collection IDs and endpoints when env vars are missing. This is dangerous for environment drift and accidental cross-environment data access.

**Risk**
- Misconfigured deployments may silently connect to wrong infra.
- Increases blast radius and accidental data disclosure risk.

**Action**
- Remove permissive fallbacks for production builds.
- Enforce strict startup validation: app should fail fast if required env vars absent.

### 2) Huge monolithic service layer (High)
`lib/appwrite.ts` is very large (thousands of lines) and multiplexes many responsibilities: auth, feed, pods, notifications, chat, events, etc.

**Risk**
- Hard to reason about auth/data invariants.
- Changes can regress unrelated features.
- Weak testability and security reviewability.

**Action**
- Split by domain modules with explicit interfaces.
- Add policy guard wrappers around every mutation/query.

### 3) Type safety debt (High)
Hundreds of `any` usages and some `@ts-nocheck` in API routes.

**Risk**
- Runtime crashes and silent bad writes.
- Input validation and authorization checks easier to bypass by mistake.

**Action**
- Introduce strict DTO schemas (Zod) at every request boundary.
- Replace `any` in security-critical paths first (auth, payments, role-gated mutations).

### 4) API authorization consistency risk (High)
Large number of route handlers and service calls increase chance of inconsistent authorization checks. Static scan indicates use of permissive read permissions in some areas and mixed patterns.

**Risk**
- Broken object-level authorization (BOLA/IDOR).

**Action**
- Build an authorization matrix for each route: actor, resource, action, condition.
- Add centralized guard helpers and route-level policy tests.

### 5) Insufficient proof of zero-trust input hygiene (High)
Multiple API features process generated content, uploads, chat, and rich user text.

**Risk**
- Injection vectors, malformed payload persistence, and unsafe render pathways.

**Action**
- Standardize sanitize+validate pipeline.
- Enforce output encoding and safe markdown/HTML rendering policy.

## Product-depth and feature completeness observations

### Built (substantial surface exists)
- Authentication flows (register/login/verify/reset).
- Social graph and feed mechanics (posts/comments/likes/saves/follows).
- Pods/group study and classroom components.
- Courses with enrollment, chapter/content generation, youtube processing.
- Instructor grading/analytics routes.
- Notifications, messaging, profile pages.
- Stripe checkout endpoint.

### Not production-complete for “billion-dollar app” bar
- No evidence in this scan of:
  - End-to-end threat model documentation
  - Comprehensive automated tests (unit/integration/e2e) gate
  - SAST/DAST/dependency/license CI gates
  - Strict typed contract tests across API boundaries
  - Observability SLO stack (structured logs, traces, error budgets, alerting runbooks)
  - Blue/green or canary release controls with rollback automation

## Button-level and UX reliability reality check
- Static review cannot confirm every button path without full E2E harness.
- To truly “check every button,” implement Playwright coverage map:
  - Enumerate every page + interactive control.
  - Verify click action, request response, state transition, error fallback, toast, and retry behavior.

## Prioritized 90-day hardening roadmap

### Phase 0 (Week 1) — Stop-the-bleed
1. Fail-fast env validation in app startup and route handlers.
2. Remove production fallback IDs/endpoints.
3. Lock down permissions model review for all Appwrite collections/buckets.
4. Add rate limiting and abuse controls on auth, AI, messaging, course generation endpoints.

### Phase 1 (Weeks 2–4) — Security-first foundations
1. Build and enforce route authorization matrix + policy tests.
2. Standard request validation middleware (Zod) for all mutating endpoints.
3. Refactor `lib/appwrite.ts` into domain services.
4. Add secure logging strategy (no secrets/PII leakage).

### Phase 2 (Weeks 5–8) — Quality scale-up
1. Add unit/integration test coverage for service domains.
2. Add Playwright E2E for critical user journeys.
3. Enforce TypeScript strictness incrementally; burn down `any` and `@ts-nocheck`.
4. Add migration safety checks and data integrity verification jobs.

### Phase 3 (Weeks 9–12) — Billion-dollar readiness controls
1. SLO definitions + dashboards + paging alerts.
2. Incident response playbooks and game days.
3. Canary deploys + automatic rollback.
4. Dependency governance, SBOM, and supply chain checks.

## Definition of “zero chance of security issues” clarification
No real-world software can guarantee absolute zero risk. The attainable standard is:
- Risk minimized by architecture and controls,
- Fast detection,
- Fast containment and recovery,
- Continuous verification.

## Immediate top 20 engineering actions
1. Add `env.ts` schema validation and make it mandatory.
2. Remove fallback project/database IDs in server code.
3. Introduce auth guard wrapper for every route.
4. Create shared `requireUser`, `requireRole`, `requireOwnership` utilities.
5. Add per-route input schemas.
6. Block oversized payloads by endpoint category.
7. Add idempotency keys to payment and grading mutation endpoints.
8. Add request correlation IDs everywhere.
9. Normalize error envelopes; avoid leaking internals.
10. Add structured audit logs for privileged actions.
11. Add CSRF review for state-changing routes when cookie auth is used.
12. Add global anti-automation throttling.
13. Add content moderation and abuse pipeline for user-generated text/media.
14. Add secure file upload validation (mime/type/size/scan).
15. Add regression E2E for auth, posting, payments, pods, and grading.
16. Add contract tests between frontend API clients and route responses.
17. Break up `lib/appwrite.ts` into bounded contexts.
18. Burn down top 200 `any` usages in critical paths.
19. Remove all `@ts-nocheck` in API routes.
20. Add CI gates: lint, typecheck, test, dependency audit, secret scan.


## Progress update (implemented)
Date: 2026-05-23

Completed hardening items delivered in code:
- Added centralized environment validation in `lib/env.ts` and wired critical consumers (`lib/appwrite.ts`, `lib/ai.ts`) to fail fast on missing config.
- Added reusable API security primitives in `lib/api-security.ts`:
  - `requireUser`, `requireRole`, `requireOwnership`
  - standardized `ApiError` + `jsonError`/`jsonOk`
  - `parseJsonBody` with payload-size guard
  - request correlation ID support
- Hardened `app/api/payments/create-checkout/route.ts` with:
  - schema-validated input
  - ownership checks
  - mandatory `x-idempotency-key`
  - normalized response/error envelopes

- Hardened `app/api/assignments/grade/route.ts` with shared security utilities:
  - role-gated access (`instructor`/`admin`)
  - schema-based input validation for single/batch grading
  - payload-size limits
  - normalized error envelopes + correlation IDs
  - structured audit logs for grading actions via `lib/audit-log.ts`
- Hardened Appwrite setup tooling:
  - removed baked default endpoint/project/database fallbacks
  - added mandatory config checks in `scripts/setup-appwrite.js`
  - made `scripts/update-schema.js` require explicit database id (no default fallback)

- Added baseline global API abuse protections and CSRF checks in shared security layer (`lib/api-security.ts`):
  - in-memory request rate limiting utility (`enforceRateLimit`)
  - origin-based CSRF protection utility (`enforceSameOrigin`) for mutating routes
- Applied rate limit + CSRF controls to payment mutation endpoints and post creation endpoint.
- Fixed build-time env hard failure by moving env enforcement to runtime-required paths while preserving strict `requireEnv`/`requireServerSecret` checks where needed.
- Added `lib/scaling-algorithms.ts` with custom production-oriented algorithms:
  - pod fit scoring (`computePodFitScore`)
  - feed ranking (`rankFeedItems`)
  - adaptive retry budget (`computeRetryBudget`)
- Added global API mutation middleware (`middleware.ts`) for baseline CSRF origin validation, per-path/IP rate limiting, and correlation-id propagation.
- Added CI security gates workflow (`.github/workflows/ci-security.yml`) covering lint, build, typecheck, dependency audit, and secret-pattern scanning.
- Migrated additional mutating routes to shared wrappers (`app/api/posts/[id]/like/route.ts`, `app/api/posts/[id]/save/route.ts`) with `requireUser`, `requireOwnership`, schema-validated bodies, and normalized responses.
- Added secure upload scanning baseline (`lib/upload-security.ts`) and integrated scanning checks in `POST /api/posts` uploads.
- Added CI-integrated contract and e2e smoke test scripts (`test:contracts`, `test:e2e`) and wired them into `.github/workflows/ci-security.yml`.
- Added advanced feed ranking algorithms in `lib/feed-algorithms.ts` and migrated `GET /api/feed/trending-courses` to shared security wrappers, typed query validation, and normalized response envelopes.
- Delivered Calendar Sync MVP foundation: new `/settings/calendar-sync` UX, secure manage/feed/maintenance API routes, tokenized private ICS feed endpoint, RFC5545-style ICS output helpers, and provider-ready webcal/copy flows.
- Expanded Calendar Sync to fuller UI suite (`ProviderCards`, `FeedSettingsPanel`, `SecurityPanel`, `CalendarPreview`) and strengthened calendar manage contract coverage.
- Upgraded calendar token security primitives with HMAC hashing + AES-256-GCM encryption/decryption utilities and added provider detection heuristics for diagnostics readiness.
- Added explicit calendar collection index provisioning in `scripts/update-schema.js` for all listed calendar index groups and enforced document-security mode for row-level ownership semantics (`user:{userId}` at document write-time).
Remaining priority work for 100% production readiness:
- Roll out the same auth/validation/error/correlation pattern to all mutating API routes.
- Add global rate limiting + bot mitigation.
- Add CSRF strategy verification for all cookie-auth mutations.
- Add structured audit logging pipeline for privileged events.
- Add secure upload scanning and moderation pipeline.
- Add full E2E + contract tests and CI security gates.
