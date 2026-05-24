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
  const correlationId = req.headers.get('x-correlation-id') || crypto.randomUUID()
  
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

    const rlError = checkRateLimit(req)
    if (rlError) {
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
  res.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' *.google.com *.googletagmanager.com",
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
      "font-src 'self' fonts.gstatic.com",
      "img-src 'self' data: https: *.google.com",
      "connect-src 'self' https: wss:",
      "frame-src 'self'",
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
    'geolocation=(), microphone=(), camera=(), payment=(), usb=()'
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
  const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001', 'https://peerspark.app']
  
  if (origin && allowedOrigins.some(allowed => origin.includes(allowed))) {
    res.headers.set('Access-Control-Allow-Origin', origin)
    res.headers.set('Access-Control-Allow-Credentials', 'true')
  }

  // Correlation ID for request tracking
  res.headers.set('x-correlation-id', correlationId)
  
  return res
}

export const config = {
  matcher: ['/api/:path*'],
}
