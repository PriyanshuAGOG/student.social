/**
 * POST /api/admin/broadcasts
 * Create an admin broadcast
 */

import { NextRequest, NextResponse } from 'next/server'
import { ID } from 'node-appwrite'
import crypto from 'crypto'
import { cookies } from 'next/headers'
import { Client, Account } from 'node-appwrite'
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes'
import { getEnv, getSessionCookieSecret, normalizeAppwriteEndpoint } from '@/lib/env'
import { isAdminUser } from '@/lib/admin-access'

const env = getEnv()
const DATABASE_ID = env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || ''

type SessionCookie = {
  secret?: string
  userId?: string
}

async function getCurrentAdminUser() {
  const cookieStore = await cookies()
  const raw = cookieStore.get('peerspark_session')?.value
  if (!raw) return null

  const [encodedPayload, signature] = raw.split('.')
  if (!encodedPayload || !signature) return null

  const expectedSignature = crypto.createHmac('sha256', getSessionCookieSecret()).update(encodedPayload).digest('hex')
  if (signature !== expectedSignature) return null

  let sessionCookie: SessionCookie | null = null
  try {
    sessionCookie = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as SessionCookie
  } catch {
    return null
  }

  if (!sessionCookie?.secret) return null

  const endpoint = normalizeAppwriteEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
  if (!endpoint || !project) return null

  const sessionClient = new Client().setEndpoint(endpoint).setProject(project).setSession(sessionCookie.secret)
  const sessionAccount = new Account(sessionClient)
  const user = await sessionAccount.get().catch(() => null)
  if (!user) return null

  return isAdminUser(user) ? user : null
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentAdminUser()

    if (!user?.$id) {
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
      createdBy: user.$id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const { databases } = await createAdminClient()

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
    const user = await getCurrentAdminUser()

    if (!user?.$id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20')

    const { databases } = await createAdminClient()

    const response = await databases.listDocuments(
      DATABASE_ID,
      'admin_broadcasts',
      [],
      String(limit)
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
