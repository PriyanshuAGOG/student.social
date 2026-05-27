import { normalizeAppwriteEndpoint } from '@/lib/env'
import { authErrorResponse, authSuccessResponse, JWT_COOKIE_NAME, getClientIP, getUserAgent } from '@/lib/auth-route-utils'
import { verifyJWT, isTokenBlacklisted, verifyDevice } from '@/lib/auth-security'
import { Client, Users } from 'node-appwrite'
import { requireUser } from '@/lib/api-security'

/**
 * Session validation endpoint
 * Verifies JWT token validity, device fingerprint, and user status
 */
export async function GET(req: Request) {
  const clientIP = getClientIP(req)
  const userAgent = getUserAgent(req)

  try {
    // Extract token from Authorization header
    const authHeader = req.headers.get('authorization')
    const cookieHeader = req.headers.get('cookie') || ''
    const cookieToken = cookieHeader
      .split(';')
      .map((entry) => entry.trim())
      .find((entry) => entry.startsWith(`${JWT_COOKIE_NAME}=`))
      ?.split('=')
      .slice(1)
      .join('=')

    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : cookieToken

    let sessionContext: { userId: string; sessionId?: string; expiresAt?: string; isNewDevice: boolean } | null = null

    if (token) {
      // Verify JWT token
      const decoded = verifyJWT(token)
      if (!decoded) {
        return authErrorResponse({
          status: 401,
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token',
        })
      }

      // Check if token is blacklisted
      if (isTokenBlacklisted(decoded.jti)) {
        return authErrorResponse({
          status: 401,
          code: 'BLACKLISTED_TOKEN',
          message: 'Token has been revoked',
        })
      }

      // Verify device fingerprint matches
      const deviceCheck = verifyDevice(decoded.userId, userAgent, clientIP)
      let isNewDevice = false

      if (!deviceCheck.isKnown) {
        // Device not recognized, but don't fail - just flag it
        console.log('[v0] Unknown device for user:', decoded.userId)
        isNewDevice = true
      }

      sessionContext = {
        userId: decoded.userId,
        sessionId: decoded.sessionId,
        expiresAt: new Date(decoded.exp * 1000).toISOString(),
        isNewDevice,
      }
    } else {
      try {
        const auth = requireUser(req)
        sessionContext = {
          userId: auth.userId,
          isNewDevice: false,
        }
      } catch {
        return authErrorResponse({
          status: 401,
          code: 'NO_TOKEN',
          message: 'Authorization cookie or bearer token missing or invalid',
        })
      }
    }

    // Verify user still exists in Appwrite
    const endpoint = normalizeAppwriteEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
    const apiKey = process.env.APPWRITE_API_KEY

    if (!endpoint || !project || !apiKey) {
      return authErrorResponse({
        status: 500,
        code: 'SERVER_CONFIG_ERROR',
        message: 'Server configuration error',
      })
    }

    try {
      const client = new Client().setEndpoint(endpoint).setProject(project).setKey(apiKey)
      const users = new Users(client)
      const user = await users.get(sessionContext.userId)

      return authSuccessResponse(
        {
          userId: user.$id,
          email: user.email,
          name: user.name,
          sessionId: sessionContext.sessionId,
          isNewDevice: sessionContext.isNewDevice,
          expiresAt: sessionContext.expiresAt,
        },
        200
      )
    } catch (error: any) {
      console.error('[v0] Error fetching user:', error)

      if (error?.message?.includes('User not found') || error?.code === 404) {
        return authErrorResponse({
          status: 401,
          code: 'USER_NOT_FOUND',
          message: 'User no longer exists',
        })
      }

      return authErrorResponse({
        status: 500,
        code: 'DATABASE_ERROR',
        message: 'An error occurred while validating session',
      })
    }
  } catch (error: any) {
    console.error('[v0] Session validation error:', error)

    return authErrorResponse({
      status: 500,
      code: 'VALIDATION_ERROR',
      message: 'An error occurred while validating session',
    })
  }
}
