import { normalizeAppwriteEndpoint } from '@/lib/env'
import { authErrorResponse, authSuccessResponse, getClientIP, getUserAgent } from '@/lib/auth-route-utils'
import { verifyJWT, generateJWT, isTokenBlacklisted } from '@/lib/auth-security'
import { Client, Users } from 'node-appwrite'

/**
 * Token refresh endpoint
 * Generates new JWT token while maintaining session continuity
 */
export async function POST(req: Request) {
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

    // Verify current JWT token
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

    // Verify user still exists
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

      // Generate new JWT token
      const newToken = generateJWT(
        {
          userId: decoded.userId,
          sessionId: decoded.sessionId,
          deviceFingerprint: decoded.deviceFingerprint,
        },
        30 // 30 minutes expiry
      )

      console.log('[v0] Token refreshed for user:', decoded.userId)

      return authSuccessResponse(
        {
          accessToken: newToken,
          expiresIn: 30 * 60, // 30 minutes
          tokenType: 'Bearer',
        },
        200
      )
    } catch (error: any) {
      console.error('[v0] Error refreshing token:', error)

      if (error?.message?.includes('User not found') || error?.code === 404) {
        return authErrorResponse({
          status: 401,
          code: 'USER_NOT_FOUND',
          message: 'User no longer exists',
        })
      }

      return authErrorResponse({
        status: 500,
        code: 'REFRESH_ERROR',
        message: 'An error occurred while refreshing token',
      })
    }
  } catch (error: any) {
    console.error('[v0] Token refresh error:', error)

    return authErrorResponse({
      status: 500,
      code: 'REFRESH_ERROR',
      message: 'An error occurred while refreshing token',
    })
  }
}
