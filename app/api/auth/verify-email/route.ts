import { NextResponse, NextRequest } from 'next/server'
import { normalizeAppwriteEndpoint } from '@/lib/env'
import { z } from 'zod'
import { authSuccessResponse, authErrorResponse, getClientIP, getUserAgent, makeErrorId } from '@/lib/auth-route-utils'

const verifySchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  secret: z.string().min(1, 'Verification secret is required'),
})

/**
 * Enterprise-grade email verification endpoint
 * Verifies user email using Appwrite's built-in verification system
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now()
  const clientIP = getClientIP(req)
  const userAgent = getUserAgent(req)

  try {
    let payload: any
    try {
      payload = await req.json()
    } catch (error) {
      console.log('[v0] Failed to parse email verification request body')
      return authErrorResponse({
        status: 400,
        code: 'INVALID_JSON',
        message: 'Invalid request body',
      })
    }

    // Validate input
    const validation = verifySchema.safeParse(payload)
    if (!validation.success) {
      const errors = validation.error.errors.map((e) => e.message)
      return authErrorResponse({
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Missing required fields: ' + errors.join(', '),
      })
    }

    const { userId, secret } = validation.data
    const endpoint = normalizeAppwriteEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT) || 'https://fra.cloud.appwrite.io/v1'
    const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID

    if (!project || !endpoint) {
      console.error('[v0] Email verification: Missing Appwrite configuration')
      return authErrorResponse({
        status: 500,
        code: 'SERVER_CONFIG_ERROR',
        message: 'Authentication service is misconfigured',
        details: { errorId: makeErrorId() },
      })
    }

    console.log('[v0] Verifying email for user:', userId)

    const base = endpoint.replace(/\/v1\/?$/i, '')
    const response = await fetch(`${base}/v1/account/verification`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': project,
      },
      body: JSON.stringify({ userId, secret }),
    })

    // Handle Appwrite errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData?.message || 'Email verification failed'
      const status = response.status

      console.log('[v0] Appwrite email verification failed:', {
        userId,
        status,
        error: errorMessage,
        ip: clientIP,
      })

      // Map specific Appwrite errors
      if (status === 401 || errorMessage.toLowerCase().includes('invalid')) {
        return authErrorResponse({
          status: 400,
          code: 'INVALID_TOKEN',
          message: 'Verification link is invalid or has expired. Please request a new one.',
        })
      }

      if (status === 404) {
        return authErrorResponse({
          status: 404,
          code: 'USER_NOT_FOUND',
          message: 'User not found. Please check your verification link.',
        })
      }

      if (status === 429) {
        return authErrorResponse({
          status: 429,
          code: 'RATE_LIMITED',
          message: 'Too many verification attempts. Please try again later.',
        })
      }

      return authErrorResponse({
        status: status >= 500 ? 500 : 400,
        code: 'VERIFICATION_FAILED',
        message: 'Email verification failed. Please try again or request a new verification link.',
        details: { errorId: makeErrorId() },
      })
    }

    console.log('[v0] Email verified successfully for user:', userId)

    return authSuccessResponse({
      message: 'Email verified successfully. You can now log in.',
      userId,
      verified: true,
    })
  } catch (error: any) {
    console.error('[v0] Unexpected email verification error:', error)
    return authErrorResponse({
      status: 500,
      code: 'VERIFICATION_ERROR',
      message: 'An unexpected error occurred during email verification',
      details: { errorId: makeErrorId() },
    })
  }
}
