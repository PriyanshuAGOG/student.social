/**
 * POST /api/admin/broadcasts
 * Create an admin broadcast
 */

import { NextRequest, NextResponse } from 'next/server'
import { databases } from '@/lib/appwrite'
import { ID } from 'appwrite'
import { getEnv } from '@/lib/env'

const env = getEnv()
const DATABASE_ID = env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || ''

export async function POST(req: NextRequest) {
  try {
    // Check admin authorization (implement your auth logic)
    const userId = req.headers.get('x-user-id')
    const isAdmin = req.headers.get('x-is-admin') === 'true'

    if (!userId || !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

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
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const result = await databases.createDocument(
      DATABASE_ID,
      'admin_broadcasts',
      ID.unique(),
      broadcast
    )

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Broadcast created successfully',
    })
  } catch (error: any) {
    console.error('[API] Error creating broadcast:', error)
    return NextResponse.json(
      { error: 'Failed to create broadcast' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    // Check admin authorization
    const isAdmin = req.headers.get('x-is-admin') === 'true'

    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20')
    const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0')

    const response = await databases.listDocuments(
      DATABASE_ID,
      'admin_broadcasts',
      [],
      limit,
      offset
    )

    return NextResponse.json({
      success: true,
      data: response.documents,
      total: response.total,
    })
  } catch (error: any) {
    console.error('[API] Error fetching broadcasts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch broadcasts' },
      { status: 500 }
    )
  }
}
