import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes'
import { requireUser, enforceSameOrigin, enforceRateLimit, ApiError } from '@/lib/api-security'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'peerspark-main-db'
const CALLS_COLLECTION_ID = process.env.NEXT_PUBLIC_CALLS_COLLECTION_ID || 'calls'
const MESSAGES_COLLECTION_ID = process.env.NEXT_PUBLIC_MESSAGES_COLLECTION_ID || 'messages'

export async function POST(req: NextRequest) {
  try {
    enforceSameOrigin(req)
    enforceRateLimit(req, { max: 10, windowMs: 60000 })

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

    const { databases } = createAdminClient()

    // Get call record
    let callRecord: any
    try {
      callRecord = await databases.getDocument(DATABASE_ID, CALLS_COLLECTION_ID, callId)
    } catch {
      throw new ApiError(404, 'NOT_FOUND', 'Call not found')
    }

    // Verify user is participant in call
    if (callRecord.callerId !== userId && callRecord.receiverId !== userId) {
      throw new ApiError(403, 'FORBIDDEN', 'User is not a participant in this call')
    }

    // Calculate duration
    const startedAt = new Date(callRecord.startedAt).getTime()
    const endedAt = new Date().getTime()
    const durationSeconds = Math.round((endedAt - startedAt) / 1000)

    // Update call record
    const updatedCall = await databases.updateDocument(
      DATABASE_ID,
      CALLS_COLLECTION_ID,
      callId,
      {
        status: 'ended',
        endedAt: new Date().toISOString(),
        endedBy: userId,
        durationSeconds: Math.max(durationSeconds, 0),
        updatedAt: new Date().toISOString(),
      }
    )

    // Add system message to chat if message module supports it
    try {
      if (callRecord.chatId && callRecord.status === 'accepted') {
        const systemMessage = await databases.createDocument(
          DATABASE_ID,
          MESSAGES_COLLECTION_ID,
          'unique()',
          {
            chatRoomId: callRecord.chatId,
            senderId: 'system',
            type: 'call',
            text: `${callRecord.callType === 'video' ? 'Video' : 'Voice'} call · ${formatDuration(durationSeconds)}`,
            metadata: {
              callId: callRecord['$id'],
              callType: callRecord.callType,
              status: 'ended',
              durationSeconds,
              callerId: callRecord.callerId,
              receiverId: callRecord.receiverId,
            },
            createdAt: new Date().toISOString(),
          }
        )
      }
    } catch (error) {
      // System message creation optional, don't fail call end
      console.warn('[Calls End API] Failed to create system message:', error)
    }

    return NextResponse.json({
      success: true,
      call: {
        id: updatedCall['$id'],
        status: updatedCall.status,
        durationSeconds: updatedCall.durationSeconds,
        endedAt: updatedCall.endedAt,
      },
    })
  } catch (error: any) {
    console.error('[Calls End API] Error:', error)

    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      )
    }

    return NextResponse.json(
      { error: 'Failed to end call' },
      { status: 500 }
    )
  }
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins === 0) return `${secs}s`
  return `${mins}:${String(secs).padStart(2, '0')}`
}
