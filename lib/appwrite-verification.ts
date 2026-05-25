import { getAppwriteEndpointCandidates } from '@/lib/env'

export type VerificationEmailResult = {
  endpoint: string
  status: number
  body: unknown
}

export async function sendAppwriteVerificationEmail(options: {
  endpoint: string
  projectId: string
  apiKey: string
  userId: string
  redirectUrl: string
}): Promise<VerificationEmailResult> {
  const candidates = getAppwriteEndpointCandidates(options.endpoint)
  let lastError: unknown

  for (const candidate of candidates) {
    const base = candidate.replace(/\/v1\/?$/i, '')
    const url = `${base}/v1/users/${options.userId}/verification`

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Key': options.apiKey,
          'X-Appwrite-Project': options.projectId,
        },
        body: JSON.stringify({ url: options.redirectUrl }),
      })

      const rawBody = await response.text()
      let parsedBody: unknown = rawBody

      try {
        parsedBody = JSON.parse(rawBody)
      } catch {
        // Keep the raw body when Appwrite returns plain text.
      }

      if (response.ok) {
        return { endpoint: candidate, status: response.status, body: parsedBody }
      }

      const errorMessage = typeof parsedBody === 'object' && parsedBody && 'message' in parsedBody
        ? String((parsedBody as Record<string, unknown>).message)
        : typeof parsedBody === 'string'
          ? parsedBody
          : 'Failed to create verification email'

      const error = new Error(errorMessage)
      ;(error as Error & { status?: number; body?: unknown; endpoint?: string }).status = response.status
      ;(error as Error & { status?: number; body?: unknown; endpoint?: string }).body = parsedBody
      ;(error as Error & { status?: number; body?: unknown; endpoint?: string }).endpoint = candidate

      if (response.status >= 500) {
        lastError = error
        continue
      }

      throw error
    } catch (error) {
      lastError = error
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Failed to send verification email')
}