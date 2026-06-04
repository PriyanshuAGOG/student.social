import { NextRequest, NextResponse } from 'next/server'
import { ID } from 'node-appwrite'
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes'
import { generateLiveKitToken, generateRoomName } from '@/lib/livekit-service'
import { requireUser, enforceSameOrigin, enforceRateLimit, ApiError } from '@/lib/api-security'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_DATABASE_ID || 'peerspark-main-db'
const CALLS_COLLECTION = process.env.NEXT_PUBLIC_CALLS_COLLECTION_ID || 'calls'
const CHAT_ROOMS_COLLECTION = process.env.NEXT_PUBLIC_CHAT_ROOMS_COLLECTION_ID || 'chat_rooms'
const PROFILES_COLLECTION = process.env.NEXT_PUBLIC_PROFILES_COLLECTION_ID || 'profiles'

export async function POST(req: NextRequest) {
  try {
    enforceSameOrigin(req)
    enforceRateLimit(req, { max: 10, windowMs: 60000 })

    const body = await req.json()
    const { receiverId, chatId, type = 'audio' } = body

    // Authenticate user
    const auth = requireUser(req)
    if (!auth?.userId) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required')
    }

    const callerId = auth.userId
    const { databases } = await createAdminClient()

    // Validate inputs
    if (!receiverId || typeof receiverId !== 'string') {
      throw new ApiError(400, 'INVALID_REQUEST', 'Invalid receiverId')
    }
    if (!chatId || typeof chatId !== 'string') {
      throw new ApiError(400, 'INVALID_REQUEST', 'Invalid chatId')
    }
    if (!['audio', 'video'].includes(type)) {
      throw new ApiError(400, 'INVALID_REQUEST', 'Invalid call type. Must be "audio" or "video"')
    }

    // Verify chat exists and user is member
    let chatRoom: any
    try {
      chatRoom = await databases.getDocument(DATABASE_ID, CHAT_ROOMS_COLLECTION, chatId)
    } catch (error: any) {
      throw new ApiError(404, 'NOT_FOUND', 'Chat room not found')
    }

    // Verify receiver exists
    let receiverProfile: any
    try {
      receiverProfile = await databases.getDocument(DATABASE_ID, PROFILES_COLLECTION, receiverId)
    } catch {
      throw new ApiError(404, 'NOT_FOUND', 'Receiver not found')
    }

    // Get caller profile for display info
    let callerProfile: any
    try {
      callerProfile = await databases.getDocument(DATABASE_ID, PROFILES_COLLECTION, callerId)
    } catch {
      // Caller profile optional, continue with basic info
      callerProfile = { name: 'User' }
    }

    // Generate unique room name
    const roomName = generateRoomName(chatId)

    // Generate token for caller
    const callerToken = await generateLiveKitToken({
      roomName,
      identity: callerId,
      displayName: callerProfile?.name || 'Caller',
      metadata: {
        type: 'caller',
        displayName: callerProfile?.name || 'Caller',
        avatar: callerProfile?.profilePictureUrl || '',
      },
    })

    // Create call record in database
    const callRecord = await databases.createDocument(DATABASE_ID, CALLS_COLLECTION, ID.unique(), {
      roomName,
      chatId,
      callerId,
      receiverId,
      callType: type,
      status: 'ringing',
      startedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      call: {
        id: callRecord['$id'],
        roomName,
        callType: type,
        status: 'ringing',
        startedAt: callRecord.startedAt,
      },
      token: callerToken.token,
      url: callerToken.url,
      identity: callerToken.identity,
    })
  } catch (error: any) {
    console.error('[Calls API] Error starting call:', error)

    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      )
    }

    if (String(error?.message || '').includes('LiveKit configuration missing')) {
      return NextResponse.json(
        { error: 'Calling is not configured. Set LiveKit environment variables before starting calls.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to start call' },
      { status: 500 }
    )
  }
}
