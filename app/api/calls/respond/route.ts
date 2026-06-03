import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes'
import { generateLiveKitToken } from '@/lib/livekit-service'
import { requireUser, enforceSameOrigin, enforceRateLimit, ApiError } from '@/lib/api-security'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'peerspark-main-db'
const CALLS_COLLECTION_ID = process.env.NEXT_PUBLIC_CALLS_COLLECTION_ID || 'calls'
const PROFILES_COLLECTION_ID = process.env.NEXT_PUBLIC_PROFILES_COLLECTION_ID || 'profiles'

export async function POST(req: NextRequest) {
  try {
    enforceSameOrigin(req)
    enforceRateLimit(req, { max: 10, windowMs: 60000 })

    const body = await req.json()
    const { callId, action } = body

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
    if (!['accept', 'reject'].includes(action)) {
      throw new ApiError(400, 'INVALID_REQUEST', 'Invalid action. Must be "accept" or "reject"')
    }

    const { databases } = createAdminClient()

    // Get call record
    let callRecord: any
    try {
      callRecord = await databases.getDocument(DATABASE_ID, CALLS_COLLECTION_ID, callId)
    } catch {
      throw new ApiError(404, 'NOT_FOUND', 'Call not found')
    }

    // Verify user is receiver
    if (callRecord.receiverId !== userId) {
      throw new ApiError(403, 'FORBIDDEN', 'Only the receiver can respond to this call')
    }

    // Update call status
    const newStatus = action === 'accept' ? 'accepted' : 'rejected'
    const updateData: any = {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    }

    if (action === 'accept') {
      updateData.acceptedAt = new Date().toISOString()
    }

    const updatedCall = await databases.updateDocument(
      DATABASE_ID,
      CALLS_COLLECTION_ID,
      callId,
      updateData
    )

    // If accepting, generate token for receiver
    let responseData: any = {
      success: true,
      call: {
        id: updatedCall['$id'],
        status: updatedCall.status,
        acceptedAt: updatedCall.acceptedAt,
      },
    }

    if (action === 'accept') {
      // Get receiver profile for display info
      let receiverProfile: any
      try {
        receiverProfile = await databases.getDocument(DATABASE_ID, PROFILES_COLLECTION_ID, userId)
      } catch {
        receiverProfile = { name: 'User' }
      }

      // Generate token for receiver
      const token = await generateLiveKitToken({
        roomName: callRecord.roomName,
        identity: userId,
        displayName: receiverProfile?.name || 'User',
        metadata: {
          type: 'receiver',
          displayName: receiverProfile?.name || 'User',
          avatar: receiverProfile?.profilePictureUrl || '',
        },
      })

      responseData.token = token.token
      responseData.url = token.url
      responseData.identity = token.identity
      responseData.roomName = token.roomName
    }

    return NextResponse.json(responseData)
  } catch (error: any) {
    console.error('[Calls Respond API] Error:', error)

    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      )
    }

    return NextResponse.json(
      { error: 'Failed to respond to call' },
      { status: 500 }
    )
  }
}
