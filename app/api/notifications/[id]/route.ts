/**
 * DELETE /api/notifications/[id]
 * Delete a notification
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes'
import { getEnv } from '@/lib/env'

const env = getEnv()
const DATABASE_ID = env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || ''
const NOTIFICATIONS_COLLECTION_ID = env.NEXT_PUBLIC_NOTIFICATIONS_COLLECTION_ID || 'notifications'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { databases } = await createAdminClient()
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const notificationId = id

    const notification = await databases.getDocument(DATABASE_ID, NOTIFICATIONS_COLLECTION_ID, notificationId)
    if (notification.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await databases.deleteDocument(DATABASE_ID, NOTIFICATIONS_COLLECTION_ID, notificationId)

    return NextResponse.json({
      success: true,
      message: 'Notification deleted',
    })
  } catch (error: any) {
    console.error('[API] Error deleting notification:', error)
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    )
  }
}
