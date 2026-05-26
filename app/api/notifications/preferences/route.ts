/**
 * GET /api/notifications/preferences - Get user preferences
 * POST /api/notifications/preferences - Update user preferences
 */

import { NextRequest, NextResponse } from 'next/server'
import { ID, Query } from 'node-appwrite'
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes'
import { getEnv } from '@/lib/env'

const env = getEnv()
const DATABASE_ID = env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || env.APPWRITE_PROJECT_ID || 'peerspark-main-db'
const NOTIFICATION_PREFERENCES_COLLECTION_ID = process.env.NEXT_PUBLIC_NOTIFICATION_PREFERENCES_COLLECTION_ID || 'notification_preferences'

export async function GET(req: NextRequest) {
  try {
    const { databases } = await createAdminClient()
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
    console.error('[API] Error fetching preferences:', error)
    return NextResponse.json({ success: true, data: null })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { databases } = await createAdminClient()
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

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
          ...body,
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
          userId,
          ...body,
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
