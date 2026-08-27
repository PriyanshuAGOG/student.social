import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/server/appwrite'
import { ApiError, enforceRateLimit, requireUser } from '@/lib/api-security'

const TOKEN_DURATION_SECONDS = 60 * 60

export async function GET(request: NextRequest) {
  try {
    enforceRateLimit(request, { key: 'realtime:token', max: 12, windowMs: 60_000 })
    const auth = requireUser(request)
    const { users } = createAdminClient()
    const token = await users.createJWT({
      userId: auth.userId,
      duration: TOKEN_DURATION_SECONDS,
    })

    return NextResponse.json({
      success: true,
      jwt: token.jwt,
      userId: auth.userId,
      expiresAt: new Date(Date.now() + TOKEN_DURATION_SECONDS * 1000).toISOString(),
    }, {
      headers: { 'Cache-Control': 'private, no-store, max-age=0' },
    })
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status })
    }
    console.error('[realtime/token] Failed to create realtime identity:', error)
    return NextResponse.json({ success: false, error: 'Live updates are temporarily unavailable' }, { status: 503 })
  }
}
