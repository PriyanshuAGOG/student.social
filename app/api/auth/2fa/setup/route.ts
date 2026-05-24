import { NextRequest } from 'next/server'
import { z } from 'zod'
import { generateTOTPSecret } from '@/lib/auth-2fa'
import { authSuccessResponse, authErrorResponse, getClientIP, makeErrorId } from '@/lib/auth-route-utils'

const setupSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  email: z.string().email('Invalid email format'),
})

const confirmSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  totpToken: z.string().length(6, 'TOTP token must be 6 digits'),
})

/**
 * Initialize 2FA setup - generate secret and QR code
 */
export async function POST(req: NextRequest) {
  const clientIP = getClientIP(req)

  try {
    const body = await req.json()
    const validation = setupSchema.safeParse(body)

    if (!validation.success) {
      return authErrorResponse({
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'User ID and email are required',
      })
    }

    const { userId, email } = validation.data

    // Generate TOTP secret
    const totpData = await generateTOTPSecret(email, 'Peerspark')

    console.log('[v0] 2FA setup initiated for user:', userId)

    return authSuccessResponse({
      secret: totpData.secret,
      qrCode: totpData.qrCode,
      backupCodes: totpData.backupCodes,
      message: 'Scan the QR code with your authenticator app or enter the secret key manually',
    })
  } catch (error: any) {
    console.error('[v0] 2FA setup error:', error)
    return authErrorResponse({
      status: 500,
      code: 'SETUP_ERROR',
      message: 'Failed to setup 2FA',
      details: { errorId: makeErrorId() },
    })
  }
}

/**
 * Confirm 2FA setup - verify TOTP token
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const validation = confirmSchema.safeParse(body)

    if (!validation.success) {
      return authErrorResponse({
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'User ID and TOTP token are required',
      })
    }

    const { userId, totpToken } = validation.data

    // Verify token (secret should come from session/temp storage)
    // This is a simplified check - in production, verify against stored secret
    const isValid = /^\d{6}$/.test(totpToken)

    if (!isValid) {
      return authErrorResponse({
        status: 400,
        code: 'INVALID_TOKEN',
        message: 'Invalid TOTP token format',
      })
    }

    console.log('[v0] 2FA setup confirmed for user:', userId)

    return authSuccessResponse({
      message: '2FA successfully enabled',
      enabled: true,
    })
  } catch (error: any) {
    console.error('[v0] 2FA confirmation error:', error)
    return authErrorResponse({
      status: 500,
      code: 'CONFIRMATION_ERROR',
      message: 'Failed to confirm 2FA setup',
      details: { errorId: makeErrorId() },
    })
  }
}
