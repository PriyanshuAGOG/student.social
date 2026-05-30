# Messaging Platform Master Plan (WhatsApp/Telegram-Class)

## 1) Product Scope

This plan targets a production-grade communication platform with:
- 1:1 Direct Messaging
- Pod and group messaging
- Username-based discovery and messaging
- Voice notes, attachments, reactions, replies, mentions
- Presence, typing, read/delivery receipts
- Voice and video calling (1:1 and group)
- Push and in-app notifications
- Safety, moderation, abuse controls, and auditability

## 2) Non-Negotiable Quality Bar

- Message durability: no lost acknowledged messages
- Multi-device consistency with idempotent send semantics
- End-to-end latency target (p50):
  - text message send to peer receive: < 250ms
  - typing signal: < 150ms
- Availability target: 99.95% messaging APIs, 99.9% call signaling
- Backpressure and retry-safe clients

## 3) Current Stack Reality (student.social)

Current system already has:
- Appwrite-backed message and room collections
- Pod chat and DM UI screens
- Basic polling-based message refresh
- Jitsi-based pod video sessions

Current gaps to close for true WhatsApp/Telegram quality:
- Inconsistent API-first boundaries for DM and room lifecycle
- Limited direct username-to-DM flow
- Polling instead of authoritative realtime subscriptions for messages
- No dedicated call signaling API for DM calls
- No full reliability protocol (acks, retries, dedupe keys, message states)
- No full E2EE protocol for messages and calls

## 4) Reference Architecture

- Client apps (web/mobile)
  - local message outbox and retry queue
  - optimistic UI + server ack reconciliation
- API layer (Next.js routes)
  - authenticated room resolution
  - idempotent message send and mutation APIs
  - call signaling control plane
- Realtime transport
  - Appwrite realtime for events now
  - upgrade path: dedicated websocket gateway for high fanout and typing/presence bursts
- Storage
  - Appwrite documents for rooms, messages, receipts, call sessions
  - object storage for media and voice notes
- Async workers
  - notification fanout, delivery retries, media post-processing, abuse scanning

## 5) Data Model Targets

Core entities:
- chat_rooms
  - type: direct | pod | group
  - members[], admins[], roomVersion
  - lastMessageAt, lastMessageId
- messages
  - roomId, senderId, clientMessageId
  - contentType: text | image | file | voice | system
  - content, metadata, editedAt, deletedAt
  - deliveryState: sent | delivered | read
- message_receipts
  - messageId, userId, deliveredAt, readAt
- call_sessions
  - roomId, callerId, calleeIds[], state
  - startedAt, endedAt, mediaType, providerSessionId
- call_participants
  - callId, userId, join/leave timestamps, mute/cam state

Indexes and constraints:
- unique(roomId, clientMessageId)
- indexed(roomId, timestamp desc)
- indexed(userId, lastMessageAt desc) for inbox

## 6) Security and Trust Model

- API auth from signed session cookies only
- server-side ownership checks for all message/call mutations
- rate limits per user/IP/action
- attachment scanning and MIME validation
- abuse controls:
  - block/mute/report pipelines
  - link and spam heuristics
- audit logs for admin-level actions and moderation

## 7) E2EE Roadmap

Phase E2EE-1:
- optional encrypted payload support for direct messages
- per-device key registration and pre-key bundles

Phase E2EE-2:
- default E2EE for direct messages and voice notes
- forward secrecy and key rotation

Phase E2EE-3:
- group E2EE with sender keys and membership epoch handling

## 8) Calling Roadmap

- Signaling API in app backend:
  - create call invite
  - accept/decline
  - end call
  - participant state updates
- Media plane:
  - retain Jitsi for fast reliability baseline
  - evaluate migration to managed SFU (LiveKit/100ms) for tighter UX control
- Features:
  - ring timeout and missed-call notifications
  - reconnect and quality adaptation
  - call history and diagnostics

## 9) Delivery Plan

Phase 1 (stabilize core messaging):
- API-first DM room lifecycle
- username to DM flow
- room membership correctness for pod rooms
- reliable conversation listing via server APIs

Phase 2 (realtime reliability):
- websocket/realtime subscriptions for room events
- message state machine and receipts
- optimistic send with idempotency

Phase 3 (rich messaging):
- voice notes, attachments, reactions, edits/deletes
- search, pinned messages, quoted replies

Phase 4 (calls):
- DM call signaling, call history, notifications
- group call control improvements

Phase 5 (E2EE + hardening):
- direct-message E2EE
- device management and key recovery UX

## 10) Testing and SRE

Automated test matrix:
- contract tests for all chat/call endpoints
- end-to-end message flows for DM and pods
- chaos tests: reconnect storms, duplicate sends, partial failures
- load tests for hot rooms and peak fanout

Observability:
- correlation IDs across APIs
- metrics: send latency, drop rate, retry rate, delivery/read lag
- alerting on queue backlog and call setup failures

## 11) Definition of Done for “WhatsApp-Class Core”

- DM and group chat are API-first and reliable under reconnects
- Message states are deterministic across refresh and devices
- Typing/presence/realtime have graceful degradation
- Calls are reliable with user-visible diagnostics and missed-call handling
- Security controls and abuse workflows are enabled by default
