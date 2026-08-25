import crypto from 'crypto'
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

export interface CallEncryptionMaterial {
  algorithm: 'livekit-e2ee-v1'
  key: string
  keyVersion: number
}

/**
 * Derives a room-scoped key with domain separation. This prevents the LiveKit
 * SFU from reading media/data, but is not server-blind E2EE because this server
 * performs the derivation. A Signal/MLS device-key layer can replace this
 * provider without changing the media room contract.
 */
export function deriveCallEncryptionMaterial(roomName: string): CallEncryptionMaterial {
  const masterKey = process.env.CALL_E2EE_MASTER_KEY || process.env.LIVEKIT_API_SECRET
  if (!masterKey || masterKey.length < 32) {
    throw new Error('Call E2EE configuration missing: CALL_E2EE_MASTER_KEY (or a 32+ character LIVEKIT_API_SECRET)')
  }

  return {
    algorithm: 'livekit-e2ee-v1',
    key: crypto.createHmac('sha256', masterKey).update(`student-social:call:e2ee:v1:${roomName}`).digest('base64url'),
    keyVersion: 1,
  }
}

/**
 * Server-side LiveKit token generation
 * This should ONLY be called from API routes, never from frontend
 */
export async function generateLiveKitToken(request: CallTokenRequest): Promise<LiveKitToken> {
  const apiKey = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET
  const url = process.env.NEXT_PUBLIC_LIVEKIT_URL

  if (!apiKey || !apiSecret || !url) {
    throw new Error('LiveKit configuration missing: LIVEKIT_API_KEY, LIVEKIT_API_SECRET, NEXT_PUBLIC_LIVEKIT_URL')
  }

  try {
    const at = new AccessToken(apiKey, apiSecret, {
      identity: request.identity,
      name: request.displayName || request.identity,
      ttl: '10m',
    })
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

    const token = await at.toJwt()
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
  const apiKey = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET
  if (!apiKey || !apiSecret) return false

  try {
    const verifier = new TokenVerifier(apiKey, apiSecret)
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
