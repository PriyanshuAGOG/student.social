import { normalizeAppwriteEndpoint } from '@/lib/env'
import { authErrorResponse, authSuccessResponse, getClientIP, getUserAgent } from '@/lib/auth-route-utils'
import { verifyJWT, isTokenBlacklisted, verifyDevice } from '@/lib/auth-security'
import { Client, Users } from 'node-appwrite'

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
    if (!authHeader?.startsWith('Bearer ')) {
      return authErrorResponse({
        status: 401,
        code: 'NO_TOKEN',
        message: 'Authorization header missing or invalid',
      })
    }

    const token = authHeader.substring(7)

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
      const user = await users.get(decoded.userId)

      return authSuccessResponse(
        {
          userId: user.$id,
          email: user.email,
          name: user.name,
          sessionId: decoded.sessionId,
          isNewDevice,
          expiresAt: new Date(decoded.exp * 1000).toISOString(),
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
