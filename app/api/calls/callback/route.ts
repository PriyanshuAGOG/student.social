import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes'

function buildJoinUrl(sessionId: string): string {
  return `https://meet.jit.si/student-social-${sessionId.replace(/[^a-zA-Z0-9_-]/g, '')}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fromUserId, toUserId, roomId, reason } = body

    if (!fromUserId || !toUserId) {
      return NextResponse.json({ success: false, error: 'fromUserId and toUserId required' }, { status: 400 })
    }

    const { databases } = await createAdminClient()

    const startedAt = new Date().toISOString()
    const providerSessionId = `student-social-callback-${Date.now()}`
    const joinUrl = buildJoinUrl(providerSessionId)

    const doc = await databases.createDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'peerspark-main-db',
      process.env.NEXT_PUBLIC_CALL_SESSIONS_COLLECTION_ID || 'call_sessions',
      'unique()',
      {
        roomId: roomId || null,
        callerId: fromUserId,
        participantIds: [fromUserId, toUserId],
        mediaType: 'voice',
        state: 'ringing',
        provider: 'jitsi',
        providerSessionId,
        joinUrl,
        startedAt,
        createdAt: startedAt,
        lastActivityAt: startedAt,
        ringTimeoutAt: new Date(Date.now() + 60_000).toISOString(),
        metadata: { reason: reason || null },
      }
    )

    // Notify recipient via notifications collection
    try {
      await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'peerspark-main-db',
        process.env.NEXT_PUBLIC_NOTIFICATIONS_COLLECTION_ID || 'notifications',
        'unique()',
        {
          userId: toUserId,
          type: 'callback_request',
          actor: fromUserId,
          message: 'You have a callback request',
          isRead: false,
          timestamp: startedAt,
          actionUrl: joinUrl,
        }
      )
    } catch (notifErr) {
      console.warn('Failed to create callback notification', notifErr)
    }

    return NextResponse.json({ success: true, session: doc, joinUrl }, { status: 201 })
  } catch (error) {
    console.error('[calls/callback] error:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
