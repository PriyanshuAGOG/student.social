import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { callSessionId, roomId, missedByUserId, reason } = body

    if (!callSessionId || !missedByUserId) {
      return NextResponse.json({ success: false, error: 'callSessionId and missedByUserId are required' }, { status: 400 })
    }

    const { databases } = await createAdminClient()

    const doc = await databases.createDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'peerspark-main-db',
      process.env.NEXT_PUBLIC_MISSED_CALLS_COLLECTION_ID || 'missed_calls',
      'unique()',
      {
        callSessionId,
        roomId: roomId || null,
        missedByUserId,
        reason: reason || null,
        createdAt: new Date().toISOString(),
      }
    )

    // Create a lightweight notification for missed call
    try {
      await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'peerspark-main-db',
        process.env.NEXT_PUBLIC_NOTIFICATIONS_COLLECTION_ID || 'notifications',
        'unique()',
        {
          userId: missedByUserId,
          type: 'missed_call',
          actor: null,
          message: 'You missed a call',
          isRead: false,
          timestamp: new Date().toISOString(),
          actionUrl: `/app/chat?call=${encodeURIComponent(callSessionId)}`,
        }
      )
    } catch (notifErr) {
      console.warn('Failed to create missed call notification', notifErr)
    }

    return NextResponse.json({ success: true, missedCall: doc }, { status: 201 })
  } catch (error) {
    console.error('[calls/missed] error:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams
    const userId = params.get('userId')
    if (!userId) return NextResponse.json({ success: false, error: 'userId required' }, { status: 400 })

    const { databases } = await createAdminClient()
    const results = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'peerspark-main-db',
      process.env.NEXT_PUBLIC_MISSED_CALLS_COLLECTION_ID || 'missed_calls',
      []
    )

    const filtered = (results.documents || []).filter((d: any) => d.missedByUserId === userId)
    return NextResponse.json({ success: true, missedCalls: filtered })
  } catch (error) {
    console.error('[calls/missed GET] error:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
