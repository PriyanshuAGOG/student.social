# Backend Architecture

PeerSpark uses Next.js API routes backed by Appwrite for identity, data, storage, and realtime events. This document centralizes the backend model, endpoints, and operational expectations.

## Stack Overview
- Runtime: Next.js API routes (Node 18+) with TypeScript
- Backend services: Appwrite (Database, Storage, Account, Functions, Messaging)
- Data access: Centralized helpers in [lib/appwrite.ts](../lib/appwrite.ts)
- Payments/AI integrations: Stripe bindings via `stripe`, OpenRouter/LLM usage inside `app/api/ai` handlers
- Messaging/Realtime: Appwrite realtime subscriptions (chat, posts, pods, resources)

## Appwrite Configuration
- Project identifiers are loaded from environment: `NEXT_PUBLIC_APPWRITE_ENDPOINT`, `NEXT_PUBLIC_APPWRITE_PROJECT_ID` (see `appwrite.ts` bootstrap).
- Database: `peerspark-main-db`
- Collections: `profiles`, `posts`, `comments`, `messages`, `resources`, `notifications`, `pods`, `calendar_events`, `chat_rooms`, `pod_commitments`, `pod_check_ins`, `pod_rsvps`, `pod_meetings`, `pod_whiteboards`, `pod_meeting_participants`, `challenges`.
- Buckets: `avatars`, `resources`, `attachments`, `post_images`.
- Auth flows: Email/password registration with verification, session creation, and token cleanup handled in `authService.register` and `authService.login` within [lib/appwrite.ts](../lib/appwrite.ts).

## Domain Services (lib/appwrite.ts)
- Auth: registration, login, logout, verification, session handling.
- Profiles: create/update profile documents, follow/unfollow, avatar uploads, presence flags.
- Feed & Posts: create/update/delete posts, toggle likes, saves/bookmarks, fetch feeds and user posts.
- Comments: create/update/delete comments, toggle likes, list comments/replies.
- Chat: send messages, fetch room history, mark read receipts, create direct chats, list user rooms.
- Pods: create/join/leave pods, invite codes, member/admin management, member counts, resource loading for pods.
- Resources: upload/download, bookmark, list with optional pod scoping, ownership checks.
- Calendar: create/list user events, RSVP toggles, study plan sync signals.
- Analytics: track study time and activities, goal progress, pod/resource stats, reports/exports.
- Notifications: create/read notifications for social and pod events.
- AI/Course tools: course generation, AI chat, and streaming endpoints are handled in API routes and persist to `pod_courses`-related collections.

## API Route Map (app/api)
- `ai`: chat completion endpoints and model routing.
- `assignments`: course assignment actions.
- `auth`: authentication hooks (login/register/verification helpers for client-side flows).
- `certificates`: certificate generation/download endpoints.
- `courses`: course generation and progress endpoints.
- `feed`: post/feed-related handlers.
- `instructor`: instructor utilities and dashboards.
- `payments`: Stripe payment/session handling.
- `pods`: pod CRUD, invites, accountability (pledges/check-ins/RSVPs), whiteboards, meetings.
- `posts`: individual post/comment interactions.
- `users`: profile lookup and social graph endpoints.

Routes follow the pattern of validating input, calling the corresponding service in `lib/appwrite.ts`, and returning serialized JSON with clear error messages.

## Environment Variables
Set the following in `.env.local` (no secrets committed):

```
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=peerspark-main-db
NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID=profiles
NEXT_PUBLIC_APPWRITE_POSTS_COLLECTION_ID=posts
NEXT_PUBLIC_APPWRITE_COMMENTS_COLLECTION_ID=comments
NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID=messages
NEXT_PUBLIC_APPWRITE_RESOURCES_COLLECTION_ID=resources
NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID=notifications
NEXT_PUBLIC_APPWRITE_PODS_COLLECTION_ID=pods
NEXT_PUBLIC_APPWRITE_CALENDAR_EVENTS_COLLECTION_ID=calendar_events
NEXT_PUBLIC_APPWRITE_CHAT_ROOMS_COLLECTION_ID=chat_rooms
NEXT_PUBLIC_APPWRITE_POD_COMMITMENTS_COLLECTION_ID=pod_commitments
NEXT_PUBLIC_APPWRITE_POD_CHECK_INS_COLLECTION_ID=pod_check_ins
NEXT_PUBLIC_APPWRITE_POD_RSVPS_COLLECTION_ID=pod_rsvps
NEXT_PUBLIC_APPWRITE_POD_MEETINGS_COLLECTION_ID=pod_meetings
NEXT_PUBLIC_APPWRITE_POD_WHITEBOARDS_COLLECTION_ID=pod_whiteboards
NEXT_PUBLIC_APPWRITE_POD_MEETING_PARTICIPANTS_COLLECTION_ID=pod_meeting_participants
NEXT_PUBLIC_APPWRITE_CHALLENGES_COLLECTION_ID=challenges
NEXT_PUBLIC_APPWRITE_AVATARS_BUCKET_ID=avatars
NEXT_PUBLIC_APPWRITE_RESOURCES_BUCKET_ID=resources
NEXT_PUBLIC_APPWRITE_ATTACHMENTS_BUCKET_ID=attachments
NEXT_PUBLIC_APPWRITE_POST_IMAGES_BUCKET_ID=post_images
OPENAI_API_KEY=your_openrouter_or_openai_key
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

## Data & Error Handling
- Validation: Prefer `zod` schemas at the route boundary; return `400` for user errors and `500` for unexpected failures.
- Security: Guard write operations by `userId` ownership; use Appwrite permissions on collections/buckets to restrict access.
- Realtime: Subscribe to relevant channels (chat rooms, posts, pods) for live updates; normalize payloads before storing in state.
- Observability: Log service name, action, and resource identifiers. When retrying (AI chat, course streaming), cap retries and surface user-friendly messages.

## Deployment Notes
- Next.js build uses `pnpm build` with App Router output; ensure Appwrite endpoint/project IDs are set at build time for edge deployments.
- Long-running tasks (course generation) are split into request + background work; do not block API handlers.
- Stripe webhooks must be served from a public URL with the configured webhook secret.
