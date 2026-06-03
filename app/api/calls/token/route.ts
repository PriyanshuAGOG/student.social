import { NextRequest, NextResponse } from 'next/server'
import { databases, DATABASE_ID } from '@/lib/appwrite'
import { generateLiveKitToken } from '@/lib/livekit-service'
import { requireUser, enforceSameOrigin, enforceRateLimit, ApiError } from '@/lib/api-security'

const CALLS_COLLECTION = 'calls'
const PROFILES_COLLECTION = 'profiles'

export async function POST(req: NextRequest) {
  try {
    enforceSameOrigin(req)
    enforceRateLimit(req, { max: 20, windowMs: 60000 })

    const body = await req.json()
    const { callId } = body

    // Authenticate user
    const auth = requireUser(req)
    if (!auth?.userId) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required')
    }

    const userId = auth.userId

    // Validate inputs
    if (!callId || typeof callId !== 'string') {
      throw new ApiError(400, 'INVALID_REQUEST', 'Invalid callId')
    }

    // Get call record
    let callRecord: any
    try {
      callRecord = await databases.getDocument(DATABASE_ID, CALLS_COLLECTION, callId)
    } catch {
      throw new ApiError(404, 'NOT_FOUND', 'Call not found')
    }

    // Verify user is participant in call (caller or receiver)
    if (callRecord.callerId !== userId && callRecord.receiverId !== userId) {
      throw new ApiError(403, 'FORBIDDEN', 'User is not a participant in this call')
    }

    // Get user profile for display info
    let userProfile: any
    try {
      userProfile = await databases.getDocument(DATABASE_ID, PROFILES_COLLECTION, userId)
    } catch {
      userProfile = { name: 'User' }
    }

    // Generate token for user
    const token = await generateLiveKitToken({
      roomName: callRecord.roomName,
      identity: userId,
      displayName: userProfile?.name || 'User',
      metadata: {
        type: callRecord.callerId === userId ? 'caller' : 'receiver',
        displayName: userProfile?.name || 'User',
        avatar: userProfile?.profilePictureUrl || '',
      },
    })

    return NextResponse.json({
      success: true,
      token: token.token,
      url: token.url,
      identity: token.identity,
      roomName: token.roomName,
    })
  } catch (error: any) {
    console.error('[Calls Token API] Error generating token:', error)

    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    )
  }
}
