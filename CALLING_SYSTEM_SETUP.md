# Audio/Video Calling System Setup & Implementation Guide

## Overview

This document describes the complete audio/video calling system for PeerSpark, implemented with LiveKit for WebRTC media transport and Appwrite for call signaling and logs.

## Architecture

### Components

1. **LiveKit Service** (`lib/livekit-service.ts`)
   - Server-side token generation
   - Room name generation
   - Token verification

2. **Call API Endpoints** (`app/api/calls/*`)
   - POST `/api/calls/start` - Initiate a call
   - POST `/api/calls/token` - Generate access token
   - POST `/api/calls/respond` - Accept or reject call
   - POST `/api/calls/end` - End an active call
   - GET `/api/calls/active` - Fetch active/ringing calls

3. **Frontend Hooks** (`hooks/use-call.ts`)
   - `useCall()` - Central call state management

4. **UI Components** (`components/call/*`)
   - `CallProvider` - Global call state provider
   - `IncomingCallOverlay` - Incoming call UI
   - `OutgoingCallScreen` - Calling UI
   - `ActiveCallScreen` - Live call UI

5. **Chat Integration**
   - Call buttons in `ChatHeader`
   - System messages in chat history

## Environment Variables Required

Add these to your `.env.local` or Vercel project settings:

```
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
NEXT_PUBLIC_LIVEKIT_URL=https://your-livekit-instance.livekit.io
```

### Getting LiveKit Credentials

1. Go to [livekit.io](https://livekit.io)
2. Sign up for a free or paid account
3. Create a new project
4. Copy API Key and API Secret from Settings
5. Copy the WebRTC URL (e.g., wss://your-project.livekit.io)

## Database Schema

The system uses Appwrite to store call records. Run the setup script to create the schema:

```bash
npm run setup-calls-db
```

This creates a `calls` collection with the following fields:

```typescript
interface Call {
  $id: string              // UUID
  roomName: string         // Unique LiveKit room name
  chatId: string           // Reference to chat room
  callerId: string         // User ID of call initiator
  receiverId: string       // User ID of call recipient
  callType: 'audio' | 'video'
  status: 'ringing' | 'accepted' | 'rejected' | 'missed' | 'ended' | 'failed'
  startedAt: ISO 8601      // When call started
  acceptedAt?: ISO 8601    // When receiver accepted
  endedAt?: ISO 8601       // When call ended
  durationSeconds?: number // Call duration in seconds
  endedBy?: string         // User ID who ended the call
  createdAt: ISO 8601
  updatedAt: ISO 8601
}
```

## Call Flow Diagrams

### Outgoing Call Flow

```
Caller                     API                    Receiver
   |                        |                        |
   |-- POST /start -------->|                        |
   |                    Create call record           |
   |<-- Return token --------|                        |
   |-- Show ringing UI       |                        |
   |                         |-- Poll /active ------>|
   |                         |                   Show overlay
   |                         |<-- Fetch calls -------|
   |                         |                        |
   |                    [45s timeout]                |
   |-- POST /respond accept->|                        |
   |                    Update status                |
   |<-- Return token --------|                        |
   |-- Connect to LiveKit ---|                        |
   |                         |<-- POST accept -------|
   |                         |                    Connect
   |<== WebRTC Stream ==============================>|
   |                                                  |
   |-- POST /end ----------->|                        |
   |                    Record duration              |
   |                    Add chat message             |
   |<-- Close --------------|-- Notify end -------->|
```

### Incoming Call Flow

```
Caller                     DB Polling              Receiver
   |                          |                        |
   |-- Create ringing call ---|                        |
   |                          |-- Detect ringing ----->|
   |                          |                    Show overlay
   |                          |                        |
   |                          |<-- User responds ------|
   |<-- Detect response ------|                        |
   |-- Show active screen  <--|                        |
   |                          |-- Show active UI ----->|
   |-- Connect to LiveKit <========== Connect ======>|
   |<===== WebRTC Stream ============================>|
```

## API Endpoints

### POST /api/calls/start

**Request**
```json
{
  "receiverId": "user-id",
  "chatId": "room-id",
  "type": "audio" or "video"
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "call": {
    "id": "call-uuid",
    "roomName": "peerspark_chatid_timestamp_random",
    "callType": "audio",
    "status": "ringing",
    "startedAt": "2024-06-03T10:30:00Z"
  },
  "token": "jwt-token",
  "url": "wss://livekit.instance.com",
  "identity": "user-id"
}
```

### POST /api/calls/token

**Request**
```json
{
  "callId": "call-uuid"
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "token": "jwt-token",
  "url": "wss://livekit.instance.com",
  "identity": "user-id",
  "roomName": "peerspark_chatid_..."
}
```

### POST /api/calls/respond

**Request**
```json
{
  "callId": "call-uuid",
  "action": "accept" or "reject"
}
```

**Response (200 OK) - Accept**
```json
{
  "success": true,
  "call": {
    "id": "call-uuid",
    "status": "accepted",
    "acceptedAt": "2024-06-03T10:30:05Z"
  },
  "token": "jwt-token",
  "url": "wss://livekit.instance.com",
  "identity": "user-id",
  "roomName": "peerspark_chatid_..."
}
```

**Response (200 OK) - Reject**
```json
{
  "success": true,
  "call": {
    "id": "call-uuid",
    "status": "rejected"
  }
}
```

### POST /api/calls/end

**Request**
```json
{
  "callId": "call-uuid"
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "call": {
    "id": "call-uuid",
    "status": "ended",
    "durationSeconds": 125,
    "endedAt": "2024-06-03T10:32:05Z"
  }
}
```

### GET /api/calls/active

**Response (200 OK)**
```json
{
  "success": true,
  "calls": [
    {
      "$id": "call-uuid",
      "roomName": "peerspark_...",
      "callerId": "user-id",
      "receiverId": "current-user-id",
      "callType": "video",
      "status": "ringing",
      "startedAt": "2024-06-03T10:30:00Z",
      "caller": {
        "id": "user-id",
        "name": "John Doe",
        "avatar": "https://..."
      }
    }
  ],
  "count": 1
}
```

## Frontend Usage

### Using the Call Hook

```typescript
import { useCallContext } from '@/components/call/CallProvider'

export function ChatPage() {
  const callContext = useCallContext()

  const handleStartCall = async () => {
    try {
      await callContext.startCall(receiverId, chatId, 'audio')
    } catch (error) {
      console.error('Failed to start call:', error)
    }
  }

  return (
    <div>
      <button onClick={handleStartCall}>Start Call</button>
      {callContext.activeCall && (
        <div>Active call with {callContext.activeCall.receiverId}</div>
      )}
    </div>
  )
}
```

### Hook API Reference

```typescript
const callContext = useCallContext()

// State
callContext.activeCall      // Current active call object
callContext.incomingCall    // Incoming call (if ringing)
callContext.callState       // 'idle' | 'outgoing_ringing' | 'incoming_ringing' | 'connecting' | 'active' | 'reconnecting' | 'ended'
callContext.isMuted         // Boolean, microphone muted
callContext.isCameraOff     // Boolean, camera off
callContext.callDuration    // Seconds elapsed in active call
callContext.error           // Error message if any

// Methods
callContext.startCall(receiverId, chatId, type)  // Start audio or video call
callContext.acceptCall(callId)                    // Accept incoming call
callContext.rejectCall(callId)                    // Reject incoming call
callContext.endCall(callId)                       // End active call
callContext.cancelCall(callId)                    // Cancel outgoing call
callContext.toggleMute()                          // Mute/unmute microphone
callContext.toggleCamera()                        // Turn camera on/off
callContext.switchAudioOutput(deviceId)           // Change audio output device
```

## Security Considerations

1. **Token Generation** - Only happens server-side, never exposed to frontend
2. **User Validation** - Every endpoint validates authenticated user
3. **Chat Membership** - Caller and receiver must both be members of the chat
4. **Call Participation** - Only participants can join a specific call's LiveKit room
5. **Permission Checks** - Only receiver can accept/reject, only participants can end

## Testing Locally

### Prerequisites
- Two browser windows or tabs
- Same Appwrite instance credentials
- Valid LiveKit credentials

### Test Steps

1. **Start dev server**
   ```bash
   npm run dev
   ```

2. **Log in as User A** in first browser window

3. **Log in as User B** in second browser window

4. **User A creates 1:1 chat with User B**

5. **User A clicks call button** (phone or video icon)
   - Outgoing call screen should appear
   - "Calling..." state with animated dots

6. **User B checks for incoming call overlay**
   - Should see User A's name and avatar
   - Accept/Reject buttons visible

7. **User B clicks Accept**
   - Incoming overlay should close
   - Active call screen should appear for both
   - Call duration timer starts

8. **Test controls**
   - Click mute button - icon changes color
   - Click camera toggle (video calls) - icon changes color
   - Click speaker button
   - Click end call button

9. **End call**
   - Both users return to chat
   - System message shows "Voice call · 00:25" or similar
   - Call logged in database

### Testing Rejection

1. Repeat steps 1-5
2. User B clicks Reject
3. User A sees "call ended" or "declined"
4. No system message added

### Testing Timeout

1. Repeat steps 1-5
2. Wait 45 seconds without accepting
3. Call automatically cancels
4. User A returns to chat

## Troubleshooting

### "LiveKit configuration missing" error
- Check `.env.local` has LIVEKIT_API_KEY and LIVEKIT_API_SECRET
- These should NOT be in NEXT_PUBLIC_ (secret-only)
- NEXT_PUBLIC_LIVEKIT_URL is safe to expose

### "Call not found" error
- Verify callId in request body
- Check Appwrite dashboard that call was created
- Ensure both users are in correct chat room

### WebRTC connection fails
- Verify NEXT_PUBLIC_LIVEKIT_URL is correct
- Check browser console for LiveKit errors
- Ensure firewall allows WebSocket connections
- Try disabling browser extensions that affect network

### "User is not a participant" error
- Verify receiverId exists and is spelled correctly
- Check that both users are members of the chat
- Check call records in Appwrite for correct user IDs

## Future Enhancements

1. **Group Calls** - Extend for 3+ participants
2. **Call Recording** - Store call recordings in Blob storage
3. **Call History** - UI to browse past calls with duration
4. **Screen Sharing** - Share screen during video call
5. **Background Blur** - Apply virtual background
6. **Call Transfer** - Transfer call to another user
7. **Do Not Disturb** - User presence state
8. **Call Notifications** - Push notifications for incoming calls

## Support

For issues or questions:
1. Check LiveKit documentation at livekit.io/docs
2. Review Appwrite docs at appwrite.io
3. Check browser console for detailed errors
4. Verify network connectivity and firewall settings
