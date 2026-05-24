/**
 * DELETE /api/notifications/[id]
 * Delete a notification
 */

import { NextRequest, NextResponse } from 'next/server'
import { databases } from '@/lib/appwrite'
import { getEnv } from '@/lib/env'

const env = getEnv()
const DATABASE_ID = env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || ''

export async function DELETE(
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

    await databases.deleteDocument(
      DATABASE_ID,
      'in_app_notifications',
      notificationId
    )

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
