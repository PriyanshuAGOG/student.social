/**
 * POST /api/admin/broadcasts
 * Create an admin broadcast
 */

import { NextRequest } from 'next/server'
import { ID, Query } from 'node-appwrite'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes'
import { getEnv } from '@/lib/env'
import { adminJson, requireAdmin, writeAdminAudit } from '@/lib/admin-server'
import { jsonError } from '@/lib/api-security'

const env = getEnv()
const DATABASE_ID = env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || ''

export async function POST(req: NextRequest) {
  const correlationId = req.headers.get('x-correlation-id') || crypto.randomUUID()
  try {
    const admin = await requireAdmin(req, 'notifications.manage')

    const body = await req.json()
    const { title, body: messageBody, category, channels, targetSegment, scheduledFor } = body

    // Validate
    if (!title || !messageBody || !channels || !targetSegment) {
      return NextResponse.json(
        { error: 'Missing required fields: title, body, channels, targetSegment' },
        { status: 400 }
      )
    }

    // Create broadcast document
    const broadcast = {
      title,
      body: messageBody,
      category: category || 'admin',
      channels,
      targetSegment,
      scheduledFor: scheduledFor || new Date().toISOString(),
      status: 'scheduled',
      createdBy: admin.userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const { databases } = await createAdminClient()

      if (!DATABASE_ID) {
        throw new Error('DATABASE_ID environment variable not set')
      }

    const result = await databases.createDocument(
      DATABASE_ID,
      'admin_broadcasts',
      ID.unique(),
      broadcast
    )

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
  } catch (error: any) {
    console.error('[API] Error creating broadcast:', error)
    return jsonError(error, correlationId)
  }
}

export async function GET(req: NextRequest) {
  const correlationId = req.headers.get('x-correlation-id') || crypto.randomUUID()
  try {
    await requireAdmin(req, 'notifications.manage')

    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20')

    const { databases } = await createAdminClient()

    const response = await databases.listDocuments(
      DATABASE_ID,
      'admin_broadcasts',
      [Query.orderDesc('createdAt'), Query.limit(Math.min(limit, 100))]
    )

    return adminJson({ documents: response.documents, total: response.total }, correlationId)
  } catch (error: any) {
    console.error('[API] Error fetching broadcasts:', error)
    return jsonError(error, correlationId)
  }
}
