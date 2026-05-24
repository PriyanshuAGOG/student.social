/**
 * PATCH /api/notifications/[id]/read
 * Mark a notification as read
 */

import { NextRequest, NextResponse } from 'next/server'
import { databases } from '@/lib/appwrite'
import { getEnv } from '@/lib/env'

const env = getEnv()
const DATABASE_ID = env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || ''

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const notificationId = id

    const result = await databases.updateDocument(
      DATABASE_ID,
      'in_app_notifications',
      notificationId,
      {
        isRead: true,
        readAt: new Date().toISOString(),
      }
    )

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error: any) {
    console.error('[API] Error marking notification as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    )
  }
}
