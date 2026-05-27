/**
 * GET /api/notifications/inbox
 * Get user's in-app notification inbox
 */

import { NextRequest, NextResponse } from 'next/server'
import { Query } from 'node-appwrite'
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes'
import { getEnv } from '@/lib/env'
import { ApiError, requireUser } from '@/lib/api-security'

const env = getEnv()
const DATABASE_ID = env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || ''
const NOTIFICATIONS_COLLECTION_ID = env.NEXT_PUBLIC_NOTIFICATIONS_COLLECTION_ID || 'notifications'

export async function GET(req: NextRequest) {
  try {
    const { databases } = await createAdminClient()
    const { userId } = requireUser(req)

    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20')
    const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0')
    const unreadOnly = req.nextUrl.searchParams.get('unreadOnly') === 'true'

    const queries: string[] = [Query.equal('userId', userId)]

    if (unreadOnly) {
      queries.push(Query.equal('isRead', false))
    }

    queries.push(Query.orderDesc('createdAt'))
    queries.push(Query.limit(Math.min(limit, 100)))
    queries.push(Query.offset(Math.max(offset, 0)))

    const response = await databases.listDocuments(DATABASE_ID, NOTIFICATIONS_COLLECTION_ID, queries)

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
