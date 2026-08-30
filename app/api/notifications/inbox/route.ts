/**
 * GET /api/notifications/inbox
 * Get user's in-app notification inbox
 */

import { NextRequest, NextResponse } from 'next/server'
import { Query } from 'node-appwrite'
import { createAdminClient } from '@/lib/server/appwrite'
import { ApiError, enforceRateLimit, enforceSameOrigin, requireUser } from '@/lib/api-security'
import { normalizeNotificationDocument } from '@/lib/notifications/normalize'

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

    const data = response.documents.map(normalizeNotificationDocument)

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

async function listOwnedNotifications(userId: string, unreadOnly: boolean) {
  const { databases, config } = createAdminClient()
  const documents: any[] = []
  for (let offset = 0; offset < 500; offset += 100) {
    const queries = [Query.equal('userId', userId), Query.orderDesc('timestamp'), Query.limit(100), Query.offset(offset)]
    if (unreadOnly) queries.splice(1, 0, Query.equal('isRead', false))
    const page = await databases.listDocuments(config.databaseId, NOTIFICATIONS_COLLECTION_ID, queries)
    documents.push(...page.documents)
    if (page.documents.length < 100) break
  }
  return { databases, config, documents }
}

export async function PATCH(req: NextRequest) {
  try {
    enforceSameOrigin(req)
    enforceRateLimit(req, { key: 'notifications:mark-all', max: 10, windowMs: 60_000 })
    const { userId } = requireUser(req)
    const { databases, config, documents } = await listOwnedNotifications(userId, true)
    await Promise.all(documents.map((doc) => databases.updateDocument(config.databaseId, NOTIFICATIONS_COLLECTION_ID, doc.$id, { isRead: true })))
    return NextResponse.json({ success: true, data: { updated: documents.length } })
  } catch (error: any) {
    if (error instanceof ApiError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    console.error('[API] Error marking notifications as read:', error)
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    enforceSameOrigin(req)
    enforceRateLimit(req, { key: 'notifications:clear', max: 10, windowMs: 60_000 })
    const { userId } = requireUser(req)
    const mode = req.nextUrl.searchParams.get('mode') === 'all' ? 'all' : 'read'
    const { databases, config, documents } = await listOwnedNotifications(userId, false)
    const selected = mode === 'all' ? documents : documents.filter((doc) => doc.isRead === true)
    await Promise.all(selected.map((doc) => databases.deleteDocument(config.databaseId, NOTIFICATIONS_COLLECTION_ID, doc.$id)))
    return NextResponse.json({ success: true, data: { deleted: selected.length, mode } })
  } catch (error: any) {
    if (error instanceof ApiError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    console.error('[API] Error clearing notifications:', error)
    return NextResponse.json({ error: 'Failed to clear notifications' }, { status: 500 })
  }
}
