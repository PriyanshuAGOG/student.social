/**
 * POST /api/admin/broadcasts
 * Create an admin broadcast
 */

import { NextRequest } from 'next/server'
import { ID, Query } from 'node-appwrite'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/server/appwrite'
import { getEnv } from '@/lib/env'
import { adminJson, withAdminApi, writeAdminAudit } from '@/lib/admin-server'
import { ApiError } from '@/lib/api-security'

const env = getEnv()
const DATABASE_ID = env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || ''

export const POST = withAdminApi('notifications.manage', async ({ request, admin, correlationId }) => {
  const body = await request.json()
  const { title, body: messageBody, category, channels, targetSegment, scheduledFor } = body

  if (!title || !messageBody || !channels || !targetSegment) {
    throw new ApiError(400, 'INVALID_INPUT', 'Missing required fields: title, body, channels, targetSegment')
  }

  if (!DATABASE_ID) {
    throw new ApiError(500, 'ADMIN_CONFIG_MISSING', 'DATABASE_ID environment variable not set')
  }

  const broadcast = {
    title,
    body: messageBody,
    category: category || 'admin',
    channels: Array.isArray(channels) ? channels.join(',') : String(channels),
    targetSegment,
    scheduledFor: scheduledFor || new Date().toISOString(),
    status: 'scheduled',
    createdBy: admin.userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const { databases } = await createAdminClient()
  const result = await databases.createDocument(DATABASE_ID, 'admin_broadcasts', ID.unique(), broadcast)

  await writeAdminAudit({
    actorId: admin.userId,
    actorEmail: admin.email,
    action: 'notifications.broadcast.create',
    targetType: 'admin_broadcast',
    targetId: result.$id,
    reason: `Broadcast to ${targetSegment}`,
    after: result,
    correlationId,
  })

  return adminJson({ broadcast: result, message: 'Broadcast created successfully' }, correlationId)
})

export const GET = withAdminApi('notifications.manage', async ({ request, correlationId }) => {
  if (!DATABASE_ID) {
    throw new ApiError(500, 'ADMIN_CONFIG_MISSING', 'DATABASE_ID environment variable not set')
  }

  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20')
  const { databases } = await createAdminClient()
  const response = await databases.listDocuments(DATABASE_ID, 'admin_broadcasts', [Query.orderDesc('createdAt'), Query.limit(Math.min(limit, 100))])

  return adminJson({ documents: response.documents, total: response.total }, correlationId)
})
