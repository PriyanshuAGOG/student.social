import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fromUserId, toUserId, roomId, reason } = body

    if (!fromUserId || !toUserId) {
      return NextResponse.json({ success: false, error: 'fromUserId and toUserId required' }, { status: 400 })
    }

    const { databases } = await createAdminClient()

    const doc = await databases.createDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'peerspark-main-db',
      process.env.NEXT_PUBLIC_CALL_SESSIONS_COLLECTION_ID || 'call_sessions',
      'unique()',
      {
        roomId: roomId || null,
        callerId: fromUserId,
        participantIds: JSON.stringify([fromUserId, toUserId]),
        state: 'ringing',
        provider: 'jitsi',
        providerSessionId: `call-${Date.now()}`,
        joinUrl: `/app/calls/${Date.now()}`,
        startedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
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
          timestamp: new Date().toISOString(),
          actionUrl: `/app/calls/${doc.$id}`,
        }
      )
    } catch (notifErr) {
      console.warn('Failed to create callback notification', notifErr)
    }

    return NextResponse.json({ success: true, session: doc }, { status: 201 })
  } catch (error) {
    console.error('[calls/callback] error:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
