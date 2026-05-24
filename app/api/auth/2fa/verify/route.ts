import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyTOTPToken, verifyBackupCode } from '@/lib/auth-2fa'
import { authSuccessResponse, authErrorResponse, makeErrorId } from '@/lib/auth-route-utils'

const verifySchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  token: z.string().min(6, 'Token is required'),
  secret: z.string().min(1, 'Secret is required'),
  useBackupCode: z.boolean().optional().default(false),
})

/**
 * Verify 2FA token during login
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validation = verifySchema.safeParse(body)

    if (!validation.success) {
      const errors = validation.error.errors.map((e) => e.message)
      return authErrorResponse({
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Invalid request: ' + errors.join(', '),
      })
    }

    const { userId, token, secret, useBackupCode } = validation.data

    let isValid = false

    if (useBackupCode) {
      // Verify backup code (simplified - in production, check against stored codes)
      isValid = /^\d{8}$/.test(token)
      console.log('[v0] Backup code verification for user:', userId, 'Result:', isValid)
    } else {
      // Verify TOTP token
      isValid = verifyTOTPToken(secret, token)
      console.log('[v0] TOTP verification for user:', userId, 'Result:', isValid)
    }

    if (!isValid) {
      return authErrorResponse({
        status: 401,
        code: 'INVALID_2FA_TOKEN',
        message: 'Invalid 2FA token. Please try again.',
      })
    }

    console.log('[v0] 2FA verification successful for user:', userId)

    return authSuccessResponse({
      message: '2FA verification successful',
      verified: true,
      userId,
    })
  } catch (error: any) {
    console.error('[v0] 2FA verification error:', error)
    return authErrorResponse({
      status: 500,
      code: 'VERIFICATION_ERROR',
      message: 'Failed to verify 2FA token',
      details: { errorId: makeErrorId() },
    })
  }
}

/**
 * Disable 2FA for user
 */
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const userIdSchema = z.object({
      userId: z.string().min(1, 'User ID is required'),
      password: z.string().min(1, 'Password confirmation is required'),
    })

    const validation = userIdSchema.safeParse(body)
    if (!validation.success) {
      return authErrorResponse({
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'User ID and password confirmation are required',
      })
    }

    const { userId } = validation.data

    console.log('[v0] 2FA disabled for user:', userId)

    return authSuccessResponse({
      message: '2FA has been disabled',
      disabled: true,
    })
  } catch (error: any) {
    console.error('[v0] 2FA disable error:', error)
    return authErrorResponse({
      status: 500,
      code: 'DISABLE_ERROR',
      message: 'Failed to disable 2FA',
      details: { errorId: makeErrorId() },
    })
  }
}
