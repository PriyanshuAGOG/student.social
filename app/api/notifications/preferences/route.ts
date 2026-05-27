/**
 * GET /api/notifications/preferences - Get user preferences
 * POST /api/notifications/preferences - Update user preferences
 */

import { NextRequest, NextResponse } from 'next/server'
import { ID, Query } from 'node-appwrite'
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes'
import { getEnv } from '@/lib/env'
import { ApiError, enforceRateLimit, enforceSameOrigin, requireUser } from '@/lib/api-security'

const env = getEnv()
const DATABASE_ID = env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || ''

export async function GET(req: NextRequest) {
  try {
    const { databases } = await createAdminClient()
    const { userId } = requireUser(req)

    const response = await databases.listDocuments(
      DATABASE_ID,
      'notification_preferences',
      [Query.equal('userId', userId)]
    )

    if (response.documents.length === 0) {
      return NextResponse.json({
        success: true,
        data: null,
      })
    }

    return NextResponse.json({
      success: true,
      data: response.documents[0],
    })
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    }

    console.error('[API] Error fetching preferences:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    enforceSameOrigin(req)
    enforceRateLimit(req, { key: 'notifications:preferences', max: 20, windowMs: 60 * 1000 })
    const { databases } = await createAdminClient()
    const { userId } = requireUser(req)

    const body = await req.json()
    const { userId: _ignoredUserId, $id: _ignoredId, ...safeBody } = body || {}

    // Get existing preferences
    const existing = await databases.listDocuments(
      DATABASE_ID,
      'notification_preferences',
      [Query.equal('userId', userId)]
    )

    let result
    if (existing.documents.length > 0) {
      // Update existing
      result = await databases.updateDocument(
        DATABASE_ID,
        'notification_preferences',
        existing.documents[0].$id,
        {
          ...safeBody,
          userId,
          updatedAt: new Date().toISOString(),
        }
      )
    } else {
      // Create new
      result = await databases.createDocument(
        DATABASE_ID,
        'notification_preferences',
        ID.unique(),
        {
          ...safeBody,
          userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      )
    }

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    }

    console.error('[API] Error updating preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}
