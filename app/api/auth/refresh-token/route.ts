import { NextResponse } from 'next/server'
import { normalizeAppwriteEndpoint } from '@/lib/env'
import { authErrorResponse, JWT_COOKIE_NAME, getClientIP, getUserAgent } from '@/lib/auth-route-utils'
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

    if (!token) {
      return authErrorResponse({
        status: 401,
        code: 'NO_TOKEN',
        message: 'Authorization header missing or invalid',
      })
    }

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

      const response = NextResponse.json({
        success: true,
        data: {
          accessToken: newToken,
          expiresIn: 30 * 60,
          tokenType: 'Bearer',
        },
      }, { status: 200 })

      response.cookies.set({
        name: JWT_COOKIE_NAME,
        value: newToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 30 * 60,
      })

      return response
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
