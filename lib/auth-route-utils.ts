import crypto from 'crypto'

export const AUTH_COOKIE_NAME = 'peerspark_session'

export function requireAuthEnv(keys: string[]): { ok: true } | { ok: false; missing: string[] } {
  const missing = keys.filter((k) => !process.env[k])
  return missing.length ? { ok: false, missing } : { ok: true }
}

export function signCookiePayload(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

export function makeErrorId(): string {
  return `auth_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export async function parseJsonSafe(response: Response): Promise<any> {
  const text = await response.text().catch(() => '')
  if (!text) return null
  try { return JSON.parse(text) } catch { return { raw: text } }
}

export function authErrorResponse(params: {
  status: number
  code: string
  message: string
  errorId?: string
  details?: Record<string, unknown>
}) {
  const errorId = params.errorId || makeErrorId()
  return new Response(JSON.stringify({
    success: false,
    error: params.message,
    code: params.code,
    errorId,
    details: params.details ?? {},
  }), {
    status: params.status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export function mapAppwriteAuthError(status: number, data: any, fallbackCode: string, fallbackMessage: string) {
  const rawType = String(data?.type || '')
  const rawMessage = String(data?.message || fallbackMessage)

  if (status === 429) return { code: 'RATE_LIMITED', message: 'Too many attempts. Please try again shortly.' }
  if (status === 401) return { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' }
  if (rawType.includes('user_email_not_whitelisted')) return { code: 'EMAIL_NOT_ALLOWED', message: rawMessage }
  if (rawType.includes('user_password_mismatch')) return { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' }
  if (rawType.includes('user_already_exists')) return { code: 'USER_EXISTS', message: 'An account with this email already exists.' }

  return { code: fallbackCode, message: rawMessage || fallbackMessage }
}
