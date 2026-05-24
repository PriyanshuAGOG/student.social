/**
 * GET /api/notifications/inbox
 * Get user's in-app notification inbox
 */

import { NextRequest, NextResponse } from 'next/server'
import { databases } from '@/lib/appwrite'
import { Query } from 'appwrite'
import { getEnv } from '@/lib/env'

const env = getEnv()
const DATABASE_ID = env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || ''

export async function GET(req: NextRequest) {
  try {
    // Get user from session (you should implement proper auth)
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20')
    const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0')
    const unreadOnly = req.nextUrl.searchParams.get('unreadOnly') === 'true'

    const queries = [Query.equal('userId', userId)]

    if (unreadOnly) {
      queries.push(Query.equal('isRead', false))
    }

    queries.push(Query.orderDesc('createdAt'))

    const response = await databases.listDocuments(
      DATABASE_ID,
      'in_app_notifications',
      queries,
      limit,
      offset
    )

    return NextResponse.json({
      success: true,
      data: response.documents,
      total: response.total,
      limit,
      offset,
    })
  } catch (error: any) {
    console.error('[API] Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}
