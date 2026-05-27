import crypto from 'crypto'
import { z } from 'zod'
import { getSessionCookieSecret } from '@/lib/env'
import { verifyJWT } from '@/lib/auth-security'

export class ApiError extends Error {
  status: number
  code: string
  details?: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

export type AuthContext = { userId: string; role: string; correlationId: string; authenticatedVia: 'jwt' | 'session-cookie' | 'header-fallback' }

const rateMap = new Map<string, { count: number; resetAt: number }>()

export function getCorrelationId(request: Request): string {
  return request.headers.get('x-correlation-id') || crypto.randomUUID()
}

type SessionCookiePayload = {
  sessionId?: string
  userId?: string
  email?: string
  secret?: string
  deviceFingerprint?: string
  expire?: string
}

function getCookieValue(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get('cookie')
  if (!cookieHeader) return null

  for (const entry of cookieHeader.split(';')) {
    const [rawName, ...rawValueParts] = entry.trim().split('=')
    if (rawName !== name) continue
    return decodeURIComponent(rawValueParts.join('='))
  }

  return null
}

function getVerifiedSessionCookie(request: Request): SessionCookiePayload | null {
  const raw = getCookieValue(request, 'peerspark_session')
  if (!raw) return null

  const [encodedPayload, signature] = raw.split('.')
  if (!encodedPayload || !signature) return null

  const expectedSignature = crypto.createHmac('sha256', getSessionCookieSecret()).update(encodedPayload).digest('hex')
  const expectedBuffer = Buffer.from(expectedSignature)
  const actualBuffer = Buffer.from(signature)

  if (expectedBuffer.length !== actualBuffer.length || !crypto.timingSafeEqual(expectedBuffer, actualBuffer)) {
    return null
  }

  try {
    const parsed = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as SessionCookiePayload
    if (!parsed?.userId) return null
    return parsed
  } catch {
    return null
  }
}

function getVerifiedJwtContext(request: Request) {
  const authHeader = request.headers.get('authorization')
  const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null
  const cookieToken = getCookieValue(request, 'peerspark_jwt')
  const token = headerToken || cookieToken
  if (!token) return null

  const decoded = verifyJWT(token)
  if (!decoded?.userId) {
    throw new ApiError(401, 'UNAUTHORIZED', 'Invalid or expired authentication token')
  }

  return decoded
}

export function enforceSameOrigin(request: Request): void {
  const method = request.method.toUpperCase()
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  if (!origin || !host) return
  const originHost = new URL(origin).host
  if (originHost !== host) throw new ApiError(403, 'CSRF_BLOCKED', 'Origin mismatch')
}

export function enforceRateLimit(request: Request, opts: { key?: string; max: number; windowMs: number }) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const key = `${opts.key || request.url}:${ip}`
  const now = Date.now()
  const current = rateMap.get(key)
  if (!current || current.resetAt <= now) {
    rateMap.set(key, { count: 1, resetAt: now + opts.windowMs })
    return
  }
  if (current.count >= opts.max) throw new ApiError(429, 'RATE_LIMITED', 'Too many requests')
  current.count += 1
  rateMap.set(key, current)
}

export function jsonOk(data: unknown, status = 200, correlationId?: string): Response { return new Response(JSON.stringify({ success: true, data }), { status, headers: { 'Content-Type': 'application/json', ...(correlationId ? { 'x-correlation-id': correlationId } : {}) } }) }
export function jsonError(error: unknown, correlationId?: string): Response {
  if (error instanceof ApiError) return new Response(JSON.stringify({ success: false, error: { code: error.code, message: error.message, details: error.details } }), { status: error.status, headers: { 'Content-Type': 'application/json', ...(correlationId ? { 'x-correlation-id': correlationId } : {}) } })
  return new Response(JSON.stringify({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Unexpected server error' } }), { status: 500, headers: { 'Content-Type': 'application/json', ...(correlationId ? { 'x-correlation-id': correlationId } : {}) } })
}

export async function parseJsonBody<T>(request: Request, schema: z.ZodSchema<T>, maxBytes = 1024 * 64): Promise<T> {
  const lenHeader = request.headers.get('content-length')
  if (lenHeader && Number(lenHeader) > maxBytes) throw new ApiError(413, 'PAYLOAD_TOO_LARGE', `Payload exceeds ${maxBytes} bytes`)
  const body = await request.json().catch(() => { throw new ApiError(400, 'INVALID_JSON', 'Request body must be valid JSON') })
  const parsed = schema.safeParse(body)
  if (!parsed.success) throw new ApiError(400, 'INVALID_INPUT', 'Invalid request payload', parsed.error.flatten())
  return parsed.data
}

export function requireUser(request: Request): AuthContext {
  const correlationId = getCorrelationId(request)
  const role = request.headers.get('x-user-role') || 'user'
  const sessionCookie = getVerifiedSessionCookie(request)
  const jwtContext = getVerifiedJwtContext(request)

  if (sessionCookie?.userId) {
    if (jwtContext && jwtContext.userId !== sessionCookie.userId) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Authentication context mismatch')
    }

    return {
      userId: sessionCookie.userId,
      role,
      correlationId,
      authenticatedVia: jwtContext ? 'jwt' : 'session-cookie',
    }
  }

  if (jwtContext?.userId) {
    return {
      userId: jwtContext.userId,
      role,
      correlationId,
      authenticatedVia: 'jwt',
    }
  }

  const fallbackUserId = request.headers.get('x-user-id')
  if (fallbackUserId && process.env.NODE_ENV !== 'production') {
    return {
      userId: fallbackUserId,
      role,
      correlationId,
      authenticatedVia: 'header-fallback',
    }
  }

  throw new ApiError(401, 'UNAUTHORIZED', 'Missing authenticated user context')
}
export function requireRole(ctx: AuthContext, allowedRoles: string[]): void { if (!allowedRoles.includes(ctx.role)) throw new ApiError(403, 'FORBIDDEN', 'Insufficient role permissions') }
export function requireOwnership(ownerId: string, actorId: string): void { if (ownerId !== actorId) throw new ApiError(403, 'FORBIDDEN', 'Resource ownership check failed') }
