import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { Client, Users } from 'node-appwrite'
import { normalizeAppwriteEndpoint } from '@/lib/env'
import { AUTH_COOKIE_NAME, getClientIP, getUserAgent, makeErrorId } from '@/lib/auth-route-utils'
import { blacklistToken, verifyJWT } from '@/lib/auth-security'
import type { JWTPayload } from '@/lib/auth-security'

/**
 * Secure logout endpoint - invalidates session and clears cookies
 * Implements token blacklisting and comprehensive cleanup
 */
export async function POST(req: Request) {
  const startTime = Date.now()
  const clientIP = getClientIP(req)
  const userAgent = getUserAgent(req)

  try {
    // Extract token from Authorization header
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    let userId: string | undefined

    // Try to blacklist JWT token
    if (token) {
      try {
        const decoded = verifyJWT(token)
        if (decoded?.jti) {
          blacklistToken(decoded.jti)
          userId = decoded.userId
          console.log('[v0] JWT token blacklisted for user:', userId)
        }
      } catch (error) {
        console.log('[v0] Could not verify token:', error)
      }
    }

    // Try to delete Appwrite session
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(AUTH_COOKIE_NAME)?.value
    
    if (sessionCookie) {
      try {
        const [encodedPayload] = sessionCookie.split('.')
        if (encodedPayload) {
          const parsed = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as {
            userId?: string
            sessionId?: string
          }

          if (parsed?.userId && parsed?.sessionId) {
            userId = parsed.userId
            const endpoint = normalizeAppwriteEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
            const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
            const apiKey = process.env.APPWRITE_API_KEY

            if (endpoint && project && apiKey) {
              const users = new Users(new Client().setEndpoint(endpoint).setProject(project).setKey(apiKey))
              await users.deleteSession(parsed.userId, parsed.sessionId).catch((error) => {
                console.log('[v0] Error deleting Appwrite session:', error?.message)
              })
              console.log('[v0] Appwrite session deleted for user:', parsed.userId)
            }
          }
        }
      } catch (error) {
        console.log('[v0] Error parsing session cookie:', error)
        // Continue clearing cookie even if parsing fails
      }
    }

    // Create response with comprehensive cleanup using NextResponse for cookie support
    const response = new NextResponse(
      JSON.stringify({
        success: true,
        message: 'Logout successful',
        userId,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
        },
      }
    )

    // Clear all auth cookies
    response.cookies.delete(AUTH_COOKIE_NAME)
    response.cookies.delete('peerspark_jwt')
    response.cookies.delete('peerspark_session')
    response.cookies.delete('appwrite-session')

    console.log('[v0] User logged out - IP:', clientIP, 'UserId:', userId)

    return response
  } catch (error: any) {
    console.error('[v0] Logout error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: 'An error occurred during logout',
        code: 'LOGOUT_FAILED',
        errorId: makeErrorId(),
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
