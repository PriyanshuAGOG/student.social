/**
 * PATCH /api/notifications/[id]/read
 * Mark a notification as read
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/server/appwrite'
import { getEnv } from '@/lib/env'
import { ApiError, enforceRateLimit, enforceSameOrigin, requireUser } from '@/lib/api-security'

const env = getEnv()
const DATABASE_ID = env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || ''
const NOTIFICATIONS_COLLECTION_ID = env.NEXT_PUBLIC_NOTIFICATIONS_COLLECTION_ID || 'notifications'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    enforceSameOrigin(req)
    enforceRateLimit(req, { key: 'notifications:read', max: 60, windowMs: 60 * 1000 })
    const { databases } = await createAdminClient()
    const { userId } = requireUser(req)

    const { id } = await params
    const notificationId = id

    const notification = await databases.getDocument(DATABASE_ID, NOTIFICATIONS_COLLECTION_ID, notificationId)
    if (notification.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const result = await databases.updateDocument(DATABASE_ID, NOTIFICATIONS_COLLECTION_ID, notificationId, {
      isRead: true,
      read: true,
      readAt: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    }

    console.error('[API] Error marking notification as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    )
  }
}
