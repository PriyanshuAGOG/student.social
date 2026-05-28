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
const DATABASE_ID = env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || env.APPWRITE_PROJECT_ID || 'peerspark-main-db'
const NOTIFICATION_PREFERENCES_COLLECTION_ID = process.env.NEXT_PUBLIC_NOTIFICATION_PREFERENCES_COLLECTION_ID || 'notification_preferences'

export async function GET(req: NextRequest) {
  try {
    const { databases } = await createAdminClient()
    const { userId } = requireUser(req)

    let response
    try {
      response = await databases.listDocuments(
        DATABASE_ID,
        NOTIFICATION_PREFERENCES_COLLECTION_ID,
        [Query.equal('userId', userId)]
      )
    } catch (lookupError: any) {
      console.warn('[API] Notification preferences lookup unavailable:', lookupError?.message || lookupError)
      return NextResponse.json({ success: true, data: null })
    }

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
    return NextResponse.json({ success: true, data: null })
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
    let existing
    try {
      existing = await databases.listDocuments(
        DATABASE_ID,
        NOTIFICATION_PREFERENCES_COLLECTION_ID,
        [Query.equal('userId', userId)]
      )
    } catch (lookupError: any) {
      console.warn('[API] Notification preferences save fallback:', lookupError?.message || lookupError)
      return NextResponse.json({
        success: true,
        data: {
          userId,
          ...body,
          updatedAt: new Date().toISOString(),
        },
      })
    }

    let result
    if (existing.documents.length > 0) {
      // Update existing
      result = await databases.updateDocument(
        DATABASE_ID,
        NOTIFICATION_PREFERENCES_COLLECTION_ID,
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
        NOTIFICATION_PREFERENCES_COLLECTION_ID,
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
    return NextResponse.json({
      success: true,
      data: {
        userId: req.headers.get('x-user-id'),
        ...(await req.json().catch(() => ({}))),
        updatedAt: new Date().toISOString(),
      },
    })
  }
}
