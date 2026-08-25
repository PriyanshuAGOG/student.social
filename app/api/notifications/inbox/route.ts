/**
 * GET /api/notifications/inbox
 * Get user's in-app notification inbox
 */

import { NextRequest, NextResponse } from 'next/server'
import { Query } from 'node-appwrite'
import { createAdminClient } from '@/lib/server/appwrite'
import { ApiError, requireUser } from '@/lib/api-security'

const NOTIFICATIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_NOTIFICATIONS_COLLECTION_ID || 'notifications'

export async function GET(req: NextRequest) {
  try {
    const { databases, config } = await createAdminClient()
    const { userId } = requireUser(req)

    const requestedLimit = Number.parseInt(req.nextUrl.searchParams.get('limit') || '20', 10)
    const requestedOffset = Number.parseInt(req.nextUrl.searchParams.get('offset') || '0', 10)
    const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : 20
    const offset = Number.isFinite(requestedOffset) ? Math.max(requestedOffset, 0) : 0
    const unreadOnly = req.nextUrl.searchParams.get('unreadOnly') === 'true'

    const queries: string[] = [Query.equal('userId', userId)]

    if (unreadOnly) {
      queries.push(Query.equal('isRead', false))
    }

    // `timestamp` is the canonical notification time field and is covered by
    // idx_notifications_user_time. `createdAt` is not part of this schema.
    queries.push(Query.orderDesc('timestamp'))
    queries.push(Query.limit(limit))
    queries.push(Query.offset(offset))

    const response = await databases.listDocuments(config.databaseId, NOTIFICATIONS_COLLECTION_ID, queries)

    const data = response.documents.map((doc: any) => ({
      $id: doc.$id,
      title: doc.title || doc.type || 'Notification',
      body: doc.message || '',
      category: doc.category || doc.type || 'system',
      priority: doc.priority || 'normal',
      icon: doc.icon,
      imageUrl: doc.imageUrl,
      ctaLabel: doc.actionText,
      ctaUrl: doc.actionUrl,
      isRead: doc.isRead ?? doc.read ?? false,
      readAt: doc.readAt,
      expiresAt: doc.expiresAt,
      createdAt: doc.createdAt || doc.timestamp || doc.$createdAt,
    }))

    return NextResponse.json({
      success: true,
      data,
      total: response.total,
      limit,
      offset,
    })
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    }

    console.error('[API] Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}
