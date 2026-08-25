# Student Social communications platform

## Canonical production architecture

All direct chats, groups, Pods2 rooms, classrooms, and team sessions use the same two planes:

1. **Appwrite signaling and durable state** — room membership, message history, receipts, presence, call invitations, participant state, and notifications.
2. **LiveKit media** — WebRTC voice, video, screen sharing, simulcast, adaptive subscriptions, dynacast, reconnection, and in-call data.

There is no second call provider and no peer-to-peer mesh fallback. A room either receives a durable `call_sessions` document and a valid LiveKit token or it fails closed.

```text
Browser
  |-- HTTPS mutation/read APIs --------> Next.js API routes
  |                                      |-- authenticated Appwrite admin client
  |                                      `-- durable Redis rate limiter
  |-- Appwrite Realtime socket --------> messages / receipts / presence / calls
  `-- E2EE WebRTC ---------------------> LiveKit SFU + TURN
                                             |
                                             `-- Redis-backed LiveKit cluster
```

## Implemented communication guarantees

### Messaging

- Every send carries a client-generated `clientMessageId` and is idempotently deduplicated.
- The browser persists unsent messages in a room-scoped local outbox. A reload converts interrupted sends back to queued work; reconnect retries failed work.
- Appwrite Realtime subscriptions are filtered by `roomId`, and document read permissions are limited to room members.
- Read history is a pure GET. Delivered/read state is written explicitly to `message_receipts` and streamed back to room members.
- Edit, soft delete, reactions, replies, pins, stars, attachments, group rooms, direct rooms, pod rooms, typing state, and online state use authenticated APIs.
- Mutation input is bounded and validated; production message and communication mutations use the durable Redis limiter.

The current durable message body remains server-readable. This is deliberate until the device-key protocol described below exists; encrypting with a server-held shared key and calling it WhatsApp-style E2EE would be misleading.

### Calling

- One `call_sessions` state machine is used for voice and video in every product surface.
- Only room members invited to a non-terminal session can receive a token.
- Only the original caller can end the room for everyone. Participants can leave independently.
- Tokens expire after ten minutes and are scoped to exactly one LiveKit room.
- LiveKit adaptive stream and dynacast are enabled, with eight reconnect attempts and browser audio-unlock handling.
- Media tracks and LiveKit data are encrypted in the browser with LiveKit insertable-stream E2EE before reaching the SFU.
- The current room key is derived server-side with a domain-separated HMAC. This protects against the SFU and media infrastructure, but not a compromised application server.
- Missing call schema, participant state, LiveKit credentials, or key material causes a visible failure; there is no ephemeral history fallback.

## Call state machine

```text
ringing --accept/join--> active --caller end--> ended
   |                         |--participant leave--> active
   |--single decline-------> declined
   |--all group decline----> declined
   `--ring timeout---------> missed (maintenance transition)
```

Terminal calls cannot be rejoined. Accept/decline is restricted to invitees. End-for-everyone is restricted to the caller. Participant documents retain each invitee's joined, declined, or left state.

## Honest E2EE boundary and required device-key phase

LiveKit E2EE encrypts media frames and data channels, but key distribution belongs to this application. The implemented server-derived room key means LiveKit cannot inspect calls; the application server can derive the key.

Server-blind messaging and calls require a separate, reviewed cryptographic subsystem:

1. Per-device Ed25519 identity/signing key and X25519 agreement key generated on device.
2. Signed prekeys and one-time prekeys, with verification and exhaustion handling.
3. X3DH-style asynchronous direct-session establishment followed by a Double Ratchet, or a maintained audited protocol implementation with equivalent properties.
4. Sender keys or MLS for groups, including a new epoch on every membership change.
5. Safety-number/QR verification, multi-device fan-out, device revocation, key backup/recovery UX, and lost-device handling.
6. Ciphertext envelopes with authenticated room/message metadata, replay protection, key version, sender device ID, and padding policy.
7. Push notifications containing no plaintext. Search, moderation, summaries, recording, and transcription must be client-side or explicit opt-in decryption boundaries.

This phase needs independent cryptographic review and interoperability/vector tests. No custom cryptographic protocol should ship based only on application-level QA.

## Capacity target: 2,000 concurrent users

Two thousand signed-in users is different from one 2,000-person call. Capacity testing must model the intended mix. The initial production target is:

- 2,000 concurrent authenticated sockets;
- 500 concurrently active chatters at up to two messages per second in bursts;
- 100 simultaneous small calls, commonly 4–12 people;
- a bounded classroom size selected from measured SFU egress, not an untested marketing number.

Recommended deployment:

- Two or more Next.js instances behind the platform load balancer; no correctness depends on process memory.
- Appwrite sized for Realtime connections and database write IOPS, with the communication indexes from `scripts/update-schema.js` applied.
- Upstash Redis REST configured so every production mutation fails closed if durable limiting is unavailable.
- A minimum two-node LiveKit deployment with Redis, embedded TURN/TLS, host networking, graceful draining, and regional capacity alarms. A single room must fit on one SFU node.
- Simulcast/adaptive subscriptions and dynacast remain enabled. Classroom camera defaults should be conservative; thumbnails subscribe at low layers and off-screen video unsubscribes.
- No server-side recording or transcription for E2EE calls unless participants explicitly choose an explained encryption-boundary change.

Before launch, run staged tests at 100, 500, 1,000, and 2,000 sockets plus the intended media mix. Gate promotion on p95 API latency, message delivery delay, reconnect success, SFU packet loss/jitter, CPU, outbound bandwidth, Redis latency, and Appwrite write latency.

## Failure and recovery behavior

- Appwrite Realtime is the low-latency path; API refresh on reconnect/focus is the recovery path.
- The message outbox survives refresh and deduplicates retries at the server.
- LiveKit reconnects media without changing durable session identity.
- A failed participant-state write marks call creation failed instead of issuing a usable room token.
- A stale/expired/terminal call never yields a guest token.
- Rate-limiter unavailability fails production mutations closed.

## Operational launch gates

- Apply and verify schema/index changes against a non-production Appwrite project.
- Configure `NEXT_PUBLIC_LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, and preferably a dedicated 32+ character `CALL_E2EE_MASTER_KEY`.
- Configure durable Redis credentials.
- Exercise two real accounts in two separate browser contexts through message send/retry/read, incoming voice/video, group call, screen share, device switching, network loss, tab sleep, and rejoin.
- Run WebRTC TURN-only tests on restrictive networks and mobile browsers.
- Run the load model above, dependency/SBOM scan, SAST, DAST against staging, and an independent penetration test.

Primary implementation references: [LiveKit E2EE](https://docs.livekit.io/transport/encryption/), [LiveKit distributed deployments](https://docs.livekit.io/transport/self-hosting/distributed/), [LiveKit Kubernetes](https://docs.livekit.io/transport/self-hosting/kubernetes/), [Appwrite Realtime authentication](https://appwrite.io/docs/apis/realtime/authentication), and [Appwrite Realtime presences](https://appwrite.io/docs/apis/realtime/presences).
