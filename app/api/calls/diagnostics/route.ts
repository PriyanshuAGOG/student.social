import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { callSessionId, roomId, metrics = {}, logs = [], reporterId } = body

    if (!callSessionId || !roomId) {
      return NextResponse.json({ success: false, error: 'callSessionId and roomId are required' }, { status: 400 })
    }

    const { databases } = await createAdminClient()

    const doc = await databases.createDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'peerspark-main-db',
      process.env.NEXT_PUBLIC_CALL_DIAGNOSTICS_COLLECTION_ID || 'call_diagnostics',
      'unique()',
      {
        callSessionId,
        roomId,
        metrics,
        logs,
        reporterId: reporterId || null,
        createdAt: new Date().toISOString(),
      }
    )

    return NextResponse.json({ success: true, diagnostic: doc }, { status: 201 })
  } catch (error) {
    console.error('[calls/diagnostics] error:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams
    const sessionId = params.get('callSessionId')
    const { databases } = await createAdminClient()

    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'callSessionId required' }, { status: 400 })
    }

    const results = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'peerspark-main-db',
      process.env.NEXT_PUBLIC_CALL_DIAGNOSTICS_COLLECTION_ID || 'call_diagnostics',
      []
    )

    const filtered = (results.documents || []).filter((d: any) => d.callSessionId === sessionId)
    return NextResponse.json({ success: true, diagnostics: filtered })
  } catch (error) {
    console.error('[calls/diagnostics GET] error:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
