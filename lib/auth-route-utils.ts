import crypto from 'crypto'
import type { NextRequest } from 'next/server'

export const AUTH_COOKIE_NAME = 'peerspark_session'
export const JWT_COOKIE_NAME = 'peerspark_jwt'

/**
 * Check if required environment variables are set
 */
export function requireAuthEnv(keys: string[]): { ok: true } | { ok: false; missing: string[] } {
  const missing = keys.filter((k) => !process.env[k])
  return missing.length ? { ok: false, missing } : { ok: true }
}

/**
 * Sign cookie payload with HMAC-SHA256
 */
export function signCookiePayload(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

/**
 * Generate unique error ID for tracking
 */
export function makeErrorId(): string {
  return `auth_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Safely parse JSON response
 */
export async function parseJsonSafe(response: Response): Promise<any> {
  const text = await response.text().catch(() => '')
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return { raw: text }
  }
}

/**
 * Enhanced error response with security headers
 */
export function authErrorResponse(params: {
  status: number
  code: string
  message: string
  errorId?: string
  details?: Record<string, unknown>
  headers?: Record<string, string>
}) {
  const errorId = params.errorId || makeErrorId()
  
  const responseHeaders = {
    'Content-Type': 'application/json',
    'X-Error-ID': errorId,
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    ...(params.headers || {}),
  }

  return new Response(
    JSON.stringify({
      success: false,
      error: params.message,
      code: params.code,
      errorId,
      timestamp: new Date().toISOString(),
      details: params.details ?? {},
    }),
    {
      status: params.status,
      headers: responseHeaders,
    }
  )
}

/**
 * Success response with security headers
 */
export function authSuccessResponse(data: any, status: number = 200, headers?: Record<string, string>) {
  const responseHeaders = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    ...(headers || {}),
  }

  return new Response(JSON.stringify({ success: true, ...data, timestamp: new Date().toISOString() }), {
    status,
    headers: responseHeaders,
  })
}

/**
 * Map Appwrite errors to user-friendly messages
 */
export function mapAppwriteAuthError(status: number, data: any, fallbackCode: string, fallbackMessage: string) {
  const rawType = String(data?.type || '')
  const rawMessage = String(data?.message || fallbackMessage)

  if (status === 429) return { code: 'RATE_LIMITED', message: 'Too many attempts. Please try again shortly.' }
  if (status === 401) return { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' }
  if (rawType.includes('user_email_not_whitelisted')) return { code: 'EMAIL_NOT_ALLOWED', message: rawMessage }
  if (rawType.includes('user_password_mismatch')) return { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' }
  if (rawType.includes('user_already_exists')) return { code: 'USER_EXISTS', message: 'An account with this email already exists.' }
  if (rawType.includes('duplicate_unique')) return { code: 'USER_EXISTS', message: 'An account with this email already exists.' }

  return { code: fallbackCode, message: rawMessage || fallbackMessage }
}

/**
 * Extract client IP from request headers
 */
export function getClientIP(request: Request | NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return request.headers.get('x-real-ip') || 'unknown'
}

/**
 * Get user agent from request
 */
export function getUserAgent(request: Request | NextRequest): string {
  return request.headers.get('user-agent') || 'unknown'
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate password minimum requirements
 */
export function validatePasswordBasic(password: string): { valid: boolean; message?: string } {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' }
  }
  return { valid: true }
}

/**
 * Rate limit headers for response
 */
export function addRateLimitHeaders(
  headers: Record<string, string>,
  remaining: number,
  resetTime: number
): Record<string, string> {
  return {
    ...headers,
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': new Date(resetTime).toISOString(),
    'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString(),
  }
}
