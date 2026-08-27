type ApiErrorPayload = {
  code?: string
  details?: { code?: string } & Record<string, unknown>
  error?: string | { code?: string; message?: string }
  message?: string
}

let sessionExpiryDispatched = false

export async function apiJson<T = any>(url: string, init?: RequestInit): Promise<T> {
  if (typeof window === 'undefined') {
    throw new Error('API helpers are only available in the browser')
  }
  const response = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  })
  const payload = await response.json().catch(() => ({})) as ApiErrorPayload & T
  if (!response.ok) {
    if (response.status === 401 && !sessionExpiryDispatched) {
      sessionExpiryDispatched = true
      window.dispatchEvent(new CustomEvent('student-social:session-expired'))
    }
    const nestedMessage = typeof payload.error === 'object' ? payload.error?.message : payload.error
    const error = new Error(nestedMessage || payload.message || `Request failed (${response.status})`) as Error & {
      status?: number
      code?: string
      details?: unknown
    }
    error.status = response.status
    error.code = payload.code || (typeof payload.error === 'object' ? payload.error.code : undefined) || payload.details?.code
    error.details = payload.details || payload
    throw error
  }
  sessionExpiryDispatched = false
  return payload
}
