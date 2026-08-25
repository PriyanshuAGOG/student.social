import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { checkDurableRateLimit } from '@/lib/server/rate-limit'

const WINDOW_MS = 60_000
const MAX_REQUESTS_PER_WINDOW = 120

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

async function checkRateLimit(req: NextRequest): Promise<'limited' | 'unavailable' | null> {
  const key = `${req.nextUrl.pathname}:${getClientIp(req)}`
  try {
    const result = await checkDurableRateLimit(key, MAX_REQUESTS_PER_WINDOW, WINDOW_MS)
    return result.allowed ? null : 'limited'
  } catch (error) {
    console.error('[rate-limit] Durable limiter unavailable', error)
    return 'unavailable'
  }
}

function getLegacyRouteTarget(req: NextRequest): URL | null {
  const { pathname, searchParams } = req.nextUrl
  const target = req.nextUrl.clone()

  if (pathname === '/app') {
    target.pathname = '/app/feed'
    return target
  }

  if (pathname === '/app/dashboard') {
    target.pathname = '/app/feed'
    return target
  }

  if (pathname === '/app/courses') {
    target.pathname = '/courses'
    return target
  }

  if (pathname === '/settings/calendar-sync') {
    target.pathname = '/app/settings/calendar-sync'
    return target
  }

  const legacyMessageMatch = pathname.match(/^\/app\/messages\/([^/]+)$/)
  if (legacyMessageMatch) {
    let userId = legacyMessageMatch[1]
    try {
      userId = decodeURIComponent(userId)
    } catch {
      // Keep the original segment; URLSearchParams will safely encode it.
    }
    target.pathname = '/app/chat'
    target.search = ''
    target.searchParams.set('user', userId)
    return target
  }

  if (pathname === '/app/explore') {
    const query = searchParams.get('q')?.trim()
    target.pathname = '/app/pods'
    target.search = ''
    target.searchParams.set('tab', 'discover')
    if (query) target.searchParams.set('q', query)
    return target
  }

  return null
}

export async function proxy(req: NextRequest) {
  const correlationId = req.headers.get('x-correlation-id') || crypto.randomUUID()

  const legacyTarget = getLegacyRouteTarget(req)
  if (legacyTarget) {
    return NextResponse.redirect(legacyTarget, { status: 308 })
  }

  // Admin page and API authorization are deliberately owned by the canonical
  // Appwrite session validators in admin-session/admin-server. Duplicating that
  // logic here rejects valid fallback sessions after cookie-key rotation.

  // Create response with security headers
  let res: NextResponse
  
  // API mutations require additional security checks
  if (isApiMutation(req)) {
    const csrfError = checkCsrf(req)
    if (csrfError) {
      return NextResponse.json(
        { success: false, error: { code: 'CSRF_BLOCKED', message: 'Request blocked by CSRF protection' } },
        { status: 403, headers: { 'x-correlation-id': correlationId } },
      )
    }

    const rlError = await checkRateLimit(req)
    if (rlError) {
      if (rlError === 'unavailable') {
        return NextResponse.json(
          { success: false, error: { code: 'RATE_LIMIT_UNAVAILABLE', message: 'Request protection is temporarily unavailable' } },
          { status: 503, headers: { 'x-correlation-id': correlationId, 'retry-after': '5' } },
        )
      }
      return NextResponse.json(
        { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
        { status: 429, headers: { 'x-correlation-id': correlationId, 'retry-after': '60' } },
      )
    }

    res = NextResponse.next()
  } else {
    res = NextResponse.next()
  }

  // ==================== ENTERPRISE SECURITY HEADERS ====================
  
  // Content Security Policy
  const production = process.env.NODE_ENV === 'production'
  const appwriteOrigin = (() => { try { return new URL(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '').origin } catch { return '' } })()
  const liveKitOrigin = (() => { try { return new URL(process.env.NEXT_PUBLIC_LIVEKIT_URL || '').origin } catch { return '' } })()
  const connectSources = ["'self'", appwriteOrigin, liveKitOrigin, ...(production ? [] : ['http:', 'https:', 'ws:', 'wss:'])].filter(Boolean)
  res.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${production ? '' : " 'unsafe-eval'"}`,
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
      "font-src 'self' fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      `connect-src ${connectSources.join(' ')}`,
      "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
      "media-src 'self' blob: https:",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  )

  // Prevent clickjacking
  res.headers.set('X-Frame-Options', 'DENY')

  // Prevent MIME type sniffing
  res.headers.set('X-Content-Type-Options', 'nosniff')

  // Enable XSS protection
  res.headers.set('X-XSS-Protection', '1; mode=block')

  // Referrer policy
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions policy
  res.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(self), camera=(self), display-capture=(self), payment=(), usb=()'
  )

  // HSTS - Force HTTPS
  res.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  )

  // Remove server identification
  res.headers.delete('Server')
  res.headers.set('X-Powered-By', '')

  // Cache control for auth pages
  if (req.nextUrl.pathname.includes('/auth') || req.nextUrl.pathname.includes('/api/auth')) {
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, private')
    res.headers.set('Pragma', 'no-cache')
    res.headers.set('Expires', '0')
  }

  // CORS validation
  const origin = req.headers.get('origin')
  const configuredOrigin = (() => { try { return new URL(process.env.NEXT_PUBLIC_APP_URL || '').origin } catch { return '' } })()
  const allowedOrigins = new Set(['http://localhost:3000', 'http://localhost:3001', 'https://peerspark.app', configuredOrigin].filter(Boolean))
  
  if (origin && allowedOrigins.has(origin)) {
    res.headers.set('Access-Control-Allow-Origin', origin)
    res.headers.set('Access-Control-Allow-Credentials', 'true')
  }

  // Correlation ID for request tracking
  res.headers.set('x-correlation-id', correlationId)
  
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|oauth).*)'],
}
