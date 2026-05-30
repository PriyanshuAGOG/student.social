# Messaging System 360 Plan

## Vision
Build the best messaging system in the student.social ecosystem: a communication layer that feels as fast and dependable as WhatsApp, as structured and discoverable as Telegram, and as community-aware as Discord/Slack, while staying native to a social learning product.

The system must support private chat, group chat, pod chat, usernames, calls, voice notes, rich media, search, moderation, safety, and future end-to-end encryption without fragmenting into separate one-off features.

## Product Principles
- Every conversation type should use the same underlying room and message model.
- Every send action should be idempotent, retry-safe, and observable.
- Every surface should behave consistently across mobile, desktop, inbox, and deep links.
- Every feature should degrade gracefully when realtime or media access fails.
- Security must be designed in, not bolted on.
- The system should feel social and learning-native, not just a generic chat clone.

## Current State Snapshot
What already exists:
- Appwrite-backed `chat_rooms` and `messages` collections.
- A global chat inbox screen.
- Direct message screen.
- Pod chat screen.
- Polling-based message refresh.
- Basic replies in pod chat and file upload support in the inbox flow.
- Room resolution APIs for direct rooms, pod rooms, and message retrieval.
- Call session control plane scaffolding and Jitsi-backed call join URLs.
- Idempotent send support started with `clientMessageId`.

What is still incomplete or inconsistent:
- No true realtime subscriptions for messages, presence, typing, or delivery status.
- No fully normalized shared UI component set for all chat surfaces.
- No message delivery/read receipt UI across all message types.
- No full voice note recorder/player flow.
- No message search, pinning, starring, forwarding, or thread sidebar.
- No block/mute/report UX from chat surfaces.
- No persistent call history UI in chat.
- No E2EE implementation yet.
- No cross-device device-key management.
- Some messaging features still live as screen-specific logic instead of shared primitives.

## Live Execution Status

Last updated: 2026-05-30

### Done
- Appwrite-backed `chat_rooms` and `messages` collections exist.
- Direct-room resolution works by user ID and username.
- Pod chat room provisioning is API-backed.
- Message send is authenticated, rate-limited, same-origin protected, and idempotent with `clientMessageId`.
- Call sessions are stored in Appwrite and exposed in chat history UIs.
- Call history is visible from inbox, DM, and pod chat surfaces.
- Shared room/message normalization is in place for inbox, DM, and pod chat.
- Message and room updates now use realtime subscriptions with polling fallback.
- Outgoing read/sent status is visible in the main chat surfaces.
- Message receipts are now persisted in a dedicated `message_receipts` collection.
- Full typing and presence indicators are wired into inbox, DM, and pod chat surfaces.
- True optimistic outbox and resend queue for text messages is implemented across inbox, DM, and pod chat.
- Shared message actions are available across inbox, DM, and pod chat: copy, edit, delete, pin, star, and report.
- Attachment previews render inline for image and file messages in the primary chat surfaces.

### In Progress
- Global search across messages, rooms, usernames, and attachments.
- Voice notes.
- Moderation actions from chat surfaces.

### Pending
- E2EE Phase 1 direct-message encryption.
- E2EE device registration and recovery UX.
- Group E2EE.
- Call diagnostics, missed-call UX, and callback flow.
- AI summaries and learning-native differentiators.

## Feature Map

### Must Have
These are the minimum to call the system production-grade.
- Direct messages by user ID and username.
- Pod chat and group chat with consistent room semantics.
- Optimistic send with server ack reconciliation.
- Idempotent send keys to prevent duplicates on retry.
- Read and delivery states.
- Realtime updates for rooms and messages.
- Voice and video call start/join/end flows.
- File and image attachments with type validation.
- Message replies and quoted previews.
- Presence indicator and typing state.
- Conversation list with latest message, unread count, and last activity.
- Reliable deep links into a room or user thread.
- Authenticated API boundaries for every mutation.
- Rate limiting and abuse controls.
- Mobile-first responsive UI.

### Good to Have
These are strong quality multipliers.
- Voice notes with waveform preview and playback speed.
- Search across messages, rooms, usernames, and attachments.
- Pin, star, and bookmark messages.
- Forward message and copy/share actions.
- Emoji reactions and quick-reply chips.
- Scheduled messages and reminders.
- Message edit history.
- Call history with missed-call and callback actions.
- Muting specific chats and notification customization.
- Smart link previews and file previews.
- Shared media gallery per room.
- Draft persistence per room.
- Offline queue with resend indicator.

### Great Differentiators
These make the system feel uniquely student.social.
- Study-room aware chat summaries.
- Pod-level AI assistant context that can answer based on room activity and study materials.
- Conversation checkpoints tied to courses, chapters, deadlines, and sessions.
- Message templates for common academic flows, like study plan check-ins or assignment help requests.
- Room health indicators: activity, unread pressure, response latency, and scheduled sessions.
- Auto-generated recap after long group sessions.
- Learning-mode message formatting for notes, formulas, and quiz-style interactions.
- One-click turn a chat thread into a study session or calendar event.

## System Architecture

### Shared Domain Model
All chat experiences should resolve to the same core entities.
- `chat_rooms`
  - type: direct | pod | group | support | system
  - members[]
  - admins[]
  - roomVersion
  - lastMessageAt
  - lastMessageId
  - unread counters or derived unread markers
- `messages`
  - roomId
  - senderId
  - clientMessageId
  - contentType: text | image | file | voice | system | call_event
  - content
  - metadata
  - replyTo
  - threadRootId
  - deliveryState
  - readBy
  - editedAt
  - deletedAt
- `message_receipts`
  - messageId
  - userId
  - deliveredAt
  - readAt
- `call_sessions`
  - roomId
  - callerId
  - participantIds[]
  - state
  - provider
  - providerSessionId
  - joinUrl
  - startedAt
  - endedAt
  - mediaType
- `call_participants`
  - callSessionId
  - roomId
  - userId
  - role
  - state
  - joinedAt
  - leftAt
  - muted
  - videoEnabled
- `message_assets`
  - fileId
  - roomId
  - messageId
  - mimeType
  - size
  - moderationState

### Transport Layers
- API layer: authenticated Next.js routes for room resolution, message mutation, calls, and moderation.
- Realtime layer: Appwrite realtime for message and room events now, with a future dedicated websocket gateway if fanout grows.
- Storage layer: Appwrite documents for durable data, object storage for media and voice notes.
- Async layer: queues or background jobs for notifications, media scan, retry, and recap generation.

### State Machine
Messages should pass through deterministic states.
- `draft`
- `queued`
- `sending`
- `sent`
- `delivered`
- `read`
- `failed`
- `deleted`
- `edited`

Calls should pass through deterministic states.
- `ringing`
- `active`
- `on_hold`
- `declined`
- `ended`
- `missed`
- `busy`

## Security Model

### Auth and Ownership
- Use signed session cookies for all message and call mutations.
- Every mutation must verify the authenticated user against the actor field.
- Never trust userId payloads alone.
- Use same-origin checks on browser-driven mutation routes.
- Add rate limits per action type and per actor.

### Abuse and Trust
- Block, mute, and report from inside the chat UI.
- Detect spammy bursts, link flooding, and repeated unknown usernames.
- Attach moderation states to messages and attachments.
- Keep audit logs for moderator actions and automated abuse actions.
- Support admin takedown and conversation freeze.

### Data Safety
- Validate MIME types and size for uploads.
- Prefer signed URLs and server-mediated upload flows.
- Restrict metadata leaks in shared previews.
- Minimize profile disclosure in username search.

## End-to-End Encryption Roadmap
E2EE should be planned as a real path, not a fake checkbox.

### E2EE Phase 1
- Optional encrypted payloads for direct messages.
- Device registration per account.
- Public key and pre-key bundle storage.
- Server stores ciphertext only for encrypted payloads.
- UI indicator for encrypted vs non-encrypted chats.

### E2EE Phase 2
- Default E2EE for direct messages and voice notes.
- Forward secrecy and periodic key rotation.
- Multi-device key sync and recovery.
- Local message decryption pipeline in the client.

### E2EE Phase 3
- Group E2EE using sender keys and membership epochs.
- Membership changes rotate sender material.
- Join/leave events update encryption epochs.
- Support device revoke and recovery flows.

### E2EE Constraints
- E2EE should start with direct chats first.
- Group E2EE can lag until the device story is stable.
- Voice calls can keep Jitsi transport while payload metadata remains minimized.
- Some features like server-side search and moderation may be limited for encrypted rooms.

## UX Consistency Rules
- One chat visual language across inbox, DM, pod chat, and future support rooms.
- Same room header layout, same bubble rules, same timestamp format, same empty state pattern.
- Same action placement for reply, reaction, more, call, and attachment.
- Same mobile header behavior as desktop header behavior with responsive collapse.
- Same loading and syncing states across every screen.
- Same error presentation language everywhere.
- Show the same recipient identity resolution across profile, username, and direct URL entry points.

## Unique Features To Build
- Study-thread recap generator.
- Room-level assignment and course context cards.
- Message-to-task conversion.
- Shared whiteboard launch from chat.
- Auto “share to pod” from a DM thread.
- Voice-note transcribe and highlight.
- Reaction summary for learning groups.
- Conversation timelines that can be filtered by topic, file, or AI summary.
- Meeting/call notes linked back into the room.
- Smart nudges for unanswered questions in study groups.

## Comparison To Current Implementation

### Already Aligned
- Appwrite is the backend and data store.
- Direct and pod chat screens already exist.
- Message send and room lookup APIs already exist.
- Call session plumbing has started.
- Username-based direct room resolution exists.
- File attachments exist for chat.
- Idempotent messaging is starting to be modeled.

### Partially Aligned
- Room and message data model exists, but not fully normalized.
- Call flow exists as backend shell, but not as a full UX system.
- Polling works, but realtime subscriptions are still missing.
- Replies exist, but not uniformly across all surfaces.
- UI is functional, but not yet one shared design system for messaging.

### Missing Or Weak
- Realtime presence, typing, and delivery receipts.
- Message search and room filters.
- Voice notes and media preview pipeline.
- Pin/star/forward/edit/delete flows.
- Block/mute/report UX.
- E2EE design and device management.
- Unified shared chat components.
- Persistent call history and diagnostics.
- Rich empty states and consistent error states.

## Execution Plan

### Phase 0: Normalize The Foundation
- Consolidate all chat surfaces onto shared room and message primitives.
- Normalize message shape and metadata across DM, pod chat, and inbox.
- Add idempotent send and dedupe semantics everywhere.
- Add shared error and loading states.
- Introduce consistent empty states and header layouts.

### Phase 1: Reliability Core
- Replace polling with realtime subscriptions where possible.
- Add optimistic UI and reconciliation logic.
- Add read and delivery receipts.
- Add presence and typing indicators.
- Add conversation list unread counts and last activity updates.

### Phase 2: Rich Messaging
- Voice notes.
- Attachments with previews.
- Reactions.
- Reply threads and quoted previews.
- Edit and delete message actions.
- Search and pinned messages.
- Forwarding and share actions.

### Phase 3: Calls
- DM and group call invitations.
- Accept, decline, join, leave, end.
- Missed call handling.
- Call history UI.
- Diagnostics for failures and reconnection.
- Jitsi baseline with future SFU upgrade path.

### Phase 4: Safety And Moderation
- Block, mute, report.
- Abuse heuristics.
- Spam throttling.
- Attachment validation and scanning.
- Moderator audit logs.
- Conversation freeze and message takedown.

### Phase 5: E2EE And Advanced Security
- Encrypted direct chats.
- Key registration.
- Multi-device recovery.
- Group E2EE.
- Voice note encryption.
- Security UX and trust indicators.

### Phase 6: Differentiators
- AI recaps and study summaries.
- Task extraction from chat.
- Course-aware room intelligence.
- Smart nudges.
- Embedded study session creation.
- Room-level analytics and health metrics.

## Data And Index Requirements
- Unique `roomId + clientMessageId` for dedupe.
- Indexed `roomId + timestamp` for conversation fetch.
- Indexed `userId + lastMessageAt` for inbox ordering.
- Indexed `callSessionId` for participant and call history lookup.
- Room-level last message fields for cheap inbox rendering.
- Attachment and asset references should be detached from the message content body.

## Testing Strategy

### Contract Tests
- Message send requires auth and same-origin.
- Room membership is enforced on fetch and send.
- Call sessions require auth and room membership.
- Dedupe key logic is preserved.
- Schema includes all required fields and indexes.

### Flow Tests
- Create direct room by user id.
- Create direct room by username.
- Send duplicate retry and confirm only one message persists.
- Join and leave a call session.
- Load pod chat with replies.
- Load inbox and select a conversation.
- Load deep link into a DM screen.

### Resilience Tests
- Retry send under network loss.
- Refresh during send.
- Duplicate call invite creation.
- Reconnect after polling or realtime disconnect.
- Unauthorized access to another room.
- Oversized attachment rejection.

### UX Tests
- Desktop/mobile parity for room layout.
- Empty states for no chats and no messages.
- Syncing badge behavior.
- Error banners for degraded connections.
- Header action consistency across room types.

## Definition Of Done
The messaging system is done when:
- DM, group, and pod chat share the same reliable primitives.
- Send/retry behavior is duplicate-safe.
- Rooms update consistently across devices.
- Calls can be started, joined, left, and recorded in history.
- The UI feels cohesive across all chat entry points.
- The security model is enforced server-side.
- The system is prepared for E2EE rollout.
- The codebase has contract tests that lock the behavior in place.

## Build Order Recommendation
1. Finish shared message and room normalization.
2. Add realtime subscriptions and delivery/read state reconciliation.
3. Add voice notes, reactions, edit/delete, search, and pinned messages.
4. Ship call history and missed-call UX.
5. Implement moderation flows.
6. Begin E2EE direct-message rollout.
7. Add the unique student.social differentiators.

## Practical Notes
- Do not build features as isolated screen hacks.
- Every new feature should use the shared room/message/call primitives.
- Every UI change should be checked in both DM and pod chat views.
- Every new behavior should have a contract test.
- Security and reliability must be treated as product features, not backend chores.
