import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const WINDOW_MS = 60_000
const MAX_REQUESTS_PER_WINDOW = 120
const bucket = new Map<string, { count: number; resetAt: number }>()

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.headers.get('x-real-ip') || 'unknown'
}

function isApiMutation(req: NextRequest): boolean {
  return req.nextUrl.pathname.startsWith('/api/') && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)
}

function checkCsrf(req: NextRequest): string | null {
  const origin = req.headers.get('origin')
  const host = req.headers.get('host')
  if (!origin || !host) return null
  try {
    const originHost = new URL(origin).host
    if (originHost !== host) return 'origin mismatch'
  } catch {
    return 'invalid origin'
  }
  return null
}

function checkRateLimit(req: NextRequest): string | null {
  const key = `${req.nextUrl.pathname}:${getClientIp(req)}`
  const now = Date.now()
  const current = bucket.get(key)
  if (!current || current.resetAt <= now) {
    bucket.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return null
  }
  if (current.count >= MAX_REQUESTS_PER_WINDOW) return 'rate limit exceeded'
  current.count += 1
  bucket.set(key, current)
  return null
}

export function middleware(req: NextRequest) {
  if (!isApiMutation(req)) return NextResponse.next()

  const correlationId = req.headers.get('x-correlation-id') || crypto.randomUUID()

  const csrfError = checkCsrf(req)
  if (csrfError) {
    return NextResponse.json(
      { success: false, error: { code: 'CSRF_BLOCKED', message: 'Request blocked by CSRF protection' } },
      { status: 403, headers: { 'x-correlation-id': correlationId } },
    )
  }

  const rlError = checkRateLimit(req)
  if (rlError) {
    return NextResponse.json(
      { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
      { status: 429, headers: { 'x-correlation-id': correlationId, 'retry-after': '60' } },
    )
  }

  const res = NextResponse.next()
  res.headers.set('x-correlation-id', correlationId)
  return res
}

export const config = {
  matcher: ['/api/:path*'],
}
