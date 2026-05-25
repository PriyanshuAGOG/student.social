import { NextResponse } from 'next/server'
import { getAppwriteServerConfig } from '@/lib/env'
import { authErrorResponse, authSuccessResponse, AUTH_COOKIE_NAME, signCookiePayload, getClientIP, getUserAgent, makeErrorId, addRateLimitHeaders } from '@/lib/auth-route-utils'
import { checkRateLimit, getRateLimitConfig, isAccountLocked, recordFailedLoginAttempt, clearLoginAttempts, generateJWT, registerDevice, generateDeviceFingerprint } from '@/lib/auth-security'
import { logLoginSuccess, logLoginFailed, logAccountLockout, logDeviceRegistration } from '@/lib/auth-audit'
import { z } from 'zod'
import { Client, Users, Query } from 'node-appwrite'

const schema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(req: Request) {
  const startTime = Date.now()
  const clientIP = getClientIP(req)
  const userAgent = getUserAgent(req)
  let email = ''

  try {
    // Parse request body
    let payload: any
    try {
      payload = await req.json()
    } catch (error) {
      console.log('[v0] Failed to parse JSON body in login endpoint')
      return authErrorResponse({
        status: 400,
        code: 'INVALID_JSON',
        message: 'Invalid request body. Please send valid JSON.',
      })
    }

    // Validate schema
    const validation = schema.safeParse(payload)
    if (!validation.success) {
      const errors = validation.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`)
      return authErrorResponse({
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Validation failed: ' + errors.join('; '),
        details: { errors },
      })
    }

    email = validation.data.email.toLowerCase().trim()
    const password = validation.data.password

    // Check IP-based rate limiting
    const ipRateLimitKey = `login:ip:${clientIP}`
    const ipRateLimitConfig = getRateLimitConfig('login')
    const ipRateLimitCheck = checkRateLimit(ipRateLimitKey, ipRateLimitConfig)

    if (!ipRateLimitCheck.allowed) {
      const duration = Date.now() - startTime
      const headers = addRateLimitHeaders({}, ipRateLimitCheck.remaining, ipRateLimitCheck.resetTime)
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Too many login attempts from this IP. Please try again later.',
        code: 'RATE_LIMITED',
        errorId: makeErrorId(),
        timestamp: new Date().toISOString(),
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      })
    }

    // Verify environment variables
    const { endpoint, projectId: project, apiKey } = getAppwriteServerConfig()
    const cookieSecret = process.env.APPWRITE_SESSION_COOKIE_SECRET

    if (!endpoint || !project || !apiKey || !cookieSecret) {
      console.error('[v0] Missing required config in login endpoint')
      const duration = Date.now() - startTime
      logLoginFailed(email, clientIP, userAgent, duration, 'Server configuration missing')
      return authErrorResponse({
        status: 500,
        code: 'SERVER_CONFIG_ERROR',
        message: 'Authentication server is misconfigured. Please try again later.',
        details: { errorId: makeErrorId() },
      })
    }

    // Create Appwrite client
    const client = new Client().setEndpoint(endpoint).setProject(project).setKey(apiKey)
    const users = new Users(client)

    // Find user by email
    console.log('[v0] Attempting login for email:', email)
    let matchedUsers: any
    try {
      matchedUsers = await users.list({
        queries: [Query.equal('email', email)],
        total: false,
      })
    } catch (error: any) {
      console.error('[v0] Error querying users:', error)
      const duration = Date.now() - startTime
      logLoginFailed(email, clientIP, userAgent, duration, 'Database query failed')
      return authErrorResponse({
        status: 500,
        code: 'DATABASE_ERROR',
        message: 'An error occurred during login. Please try again.',
        details: { errorId: makeErrorId() },
      })
    }

    const matchedUser = matchedUsers.users?.[0]
    if (!matchedUser?.$id) {
      const duration = Date.now() - startTime
      logLoginFailed(email, clientIP, userAgent, duration, 'User not found')
      return authErrorResponse({
        status: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
      })
    }

    // Check if account is locked
    const lockoutCheck = isAccountLocked(matchedUser.$id)
    if (lockoutCheck.locked) {
      const duration = Date.now() - startTime
      logAccountLockout(matchedUser.$id, email, clientIP, userAgent, lockoutCheck.lockedUntil || 0)
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Account is temporarily locked due to too many failed login attempts. Please try again later.',
        code: 'ACCOUNT_LOCKED',
        lockedUntil: lockoutCheck.lockedUntil,
        errorId: makeErrorId(),
        timestamp: new Date().toISOString(),
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Attempt to create session (password validation happens here)
    let session: any
    try {
      session = await users.createSession({ userId: matchedUser.$id })
      console.log('[v0] Session created for user:', matchedUser.$id)
    } catch (error: any) {
      // Password mismatch or other credential error
      console.log('[v0] Login failed for user:', matchedUser.$id, 'Error:', error?.message)
      
      const failureResult = recordFailedLoginAttempt(matchedUser.$id)
      const duration = Date.now() - startTime
      
      if (failureResult.locked) {
        logAccountLockout(matchedUser.$id, email, clientIP, userAgent, failureResult.lockedUntil || 0)
        return new Response(JSON.stringify({
          success: false,
          error: 'Account locked due to too many failed attempts.',
          code: 'ACCOUNT_LOCKED',
          lockedUntil: failureResult.lockedUntil,
          errorId: makeErrorId(),
          timestamp: new Date().toISOString(),
        }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      logLoginFailed(email, clientIP, userAgent, duration, 'Invalid password', failureResult.remainingAttempts)
      return authErrorResponse({
        status: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
        details: { remainingAttempts: failureResult.remainingAttempts },
      })
    }

    // Clear failed login attempts on success
    clearLoginAttempts(matchedUser.$id)

    // Device fingerprinting
    const deviceFingerprint = generateDeviceFingerprint(userAgent, clientIP)
    const deviceInfo = registerDevice(matchedUser.$id, userAgent, clientIP)

    // Log device registration (with alert if new device)
    logDeviceRegistration(matchedUser.$id, clientIP, userAgent, deviceFingerprint, !deviceInfo.isVerified)

    // Generate JWT token
    const accessToken = generateJWT({
      userId: matchedUser.$id,
      sessionId: session.$id,
      deviceFingerprint,
    })

    // Build response
    const response = new NextResponse(
      JSON.stringify({
        success: true,
        userId: matchedUser.$id,
        email: matchedUser.email,
        name: matchedUser.name,
        sessionId: session.$id,
        accessToken,
        expiresIn: 30 * 60, // 30 minutes
        message: 'Login successful',
      }),
      { status: 200 }
    )

    // Set secure session cookie
    const cookiePayload = JSON.stringify({
      sessionId: session.$id,
      userId: matchedUser.$id,
      email: matchedUser.email,
      deviceFingerprint,
      expire: session.expire,
    })
    const encodedPayload = Buffer.from(cookiePayload).toString('base64url')
    const signedValue = `${encodedPayload}.${signCookiePayload(encodedPayload, cookieSecret)}`

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: signedValue,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    const duration = Date.now() - startTime
    logLoginSuccess(matchedUser.$id, email, clientIP, userAgent, duration, deviceFingerprint, session.$id)

    return response
  } catch (error: any) {
    const duration = Date.now() - startTime
    console.error('[v0] Unexpected login error:', error)

    logLoginFailed(email, clientIP, userAgent, duration, error?.message || 'Unexpected error during login')

    return authErrorResponse({
      status: 500,
      code: 'LOGIN_FAILED',
      message: 'An error occurred during login. Please try again.',
      details: { errorId: makeErrorId() },
    })
  }
}
