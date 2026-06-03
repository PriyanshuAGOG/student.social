import { AccessToken, TokenVerifier } from 'livekit-server-sdk'

export interface LiveKitToken {
  token: string
  url: string
  identity: string
  roomName: string
}

export interface CallTokenRequest {
  roomName: string
  identity: string
  displayName?: string
  metadata?: Record<string, string>
}

/**
 * Server-side LiveKit token generation
 * This should ONLY be called from API routes, never from frontend
 */
export function generateLiveKitToken(request: CallTokenRequest): LiveKitToken {
  const apiKey = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET
  const url = process.env.NEXT_PUBLIC_LIVEKIT_URL

  if (!apiKey || !apiSecret || !url) {
    throw new Error('LiveKit configuration missing: LIVEKIT_API_KEY, LIVEKIT_API_SECRET, NEXT_PUBLIC_LIVEKIT_URL')
  }

  try {
    const at = new AccessToken(apiKey, apiSecret)
    at.identity = request.identity
    at.name = request.displayName || request.identity
    at.addGrant({
      room: request.roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      canUpdateOwnMetadata: true,
    })

    if (request.metadata) {
      at.metadata = JSON.stringify(request.metadata)
    }

    const token = at.toJwt()
    return {
      token,
      url,
      identity: request.identity,
      roomName: request.roomName,
    }
  } catch (error: any) {
    throw new Error(`Failed to generate LiveKit token: ${error.message}`)
  }
}

/**
 * Verify LiveKit token (optional, for validation)
 */
export function verifyLiveKitToken(token: string): boolean {
  const apiSecret = process.env.LIVEKIT_API_SECRET
  if (!apiSecret) return false

  try {
    const verifier = new TokenVerifier(apiSecret)
    const claims = verifier.verify(token)
    return !!claims
  } catch {
    return false
  }
}

/**
 * Generate unique room name for a call
 */
export function generateRoomName(chatId: string, timestamp: number = Date.now()): string {
  const randomId = Math.random().toString(36).substring(7)
  return `peerspark_${chatId}_${timestamp}_${randomId}`.toLowerCase()
}
