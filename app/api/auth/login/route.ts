import { NextResponse } from 'next/server'
import { getAppwriteServerConfig, getSessionCookieSecret } from '@/lib/env'
import { authErrorResponse, authSuccessResponse, AUTH_COOKIE_NAME, signCookiePayload, getClientIP, getUserAgent, makeErrorId, addRateLimitHeaders } from '@/lib/auth-route-utils'
import { checkRateLimit, getRateLimitConfig, isAccountLocked, recordFailedLoginAttempt, clearLoginAttempts, generateJWT, registerDevice, generateDeviceFingerprint } from '@/lib/auth-security'
import { logAuthEvent, logLoginSuccess, logLoginFailed, logAccountLockout, logDeviceRegistration } from '@/lib/auth-audit'
import { z } from 'zod'
import { Client, Users, Query, Account } from 'node-appwrite'
import { sendAppwriteVerificationEmail } from '@/lib/appwrite-verification'

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
    const cookieSecret = getSessionCookieSecret()

    if (!endpoint || !project || !apiKey) {
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

    if (!matchedUser.emailVerification) {
      try {
        await sendAppwriteVerificationEmail({
          endpoint,
          projectId: project,
          apiKey,
          userId: matchedUser.$id,
          redirectUrl: new URL('/verify-email', process.env.NEXT_PUBLIC_APP_URL || 'https://studentssocial.vercel.app').toString(),
        })
      } catch (verificationError) {
        console.warn('[v0] Failed to resend verification email for unverified login:', verificationError)
      }

      const duration = Date.now() - startTime
      logAuthEvent({
        eventType: 'LOGIN_FAILED',
        email,
        ipAddress: clientIP,
        userAgent,
        endpoint: '/api/auth/login',
        method: 'POST',
        statusCode: 403,
        duration,
        severity: 'WARNING',
        errorCode: 'EMAIL_NOT_VERIFIED',
        errorMessage: 'User account exists but email is not verified',
        metadata: { verificationSent: true },
      })
      return authErrorResponse({
        status: 403,
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Your account is registered but your email address has not been verified yet. We sent a new verification email. Please verify your email before signing in.',
        details: { verificationSent: true },
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

    // Attempt to create a real password-authenticated session
    let session: any
    try {
      const authClient = new Client().setEndpoint(endpoint).setProject(project)
      const authAccount = new Account(authClient)
      session = await authAccount.createEmailPasswordSession(email, password)
      console.log('[v0] Session created for user:', matchedUser.$id)
    } catch (error: any) {
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

    // Re-read the session via the admin API to make sure we store the secret
    // when available. Some Appwrite environments may not expose it reliably.
    let sessionSecret = session?.secret || ''
    try {
      const sessionList = await users.listSessions(matchedUser.$id, false)
      const matchingSession = sessionList.sessions?.find((candidate: any) => candidate.$id === session.$id)
      if (matchingSession?.secret) {
        sessionSecret = matchingSession.secret
      }
    } catch (sessionLookupError: any) {
      console.warn('[v0] Failed to re-read session secret after login:', sessionLookupError?.message)
    }

    let verifiedUser: any = null
    if (sessionSecret) {
      const sessionClient = new Client().setEndpoint(endpoint).setProject(project).setSession(sessionSecret)
      const sessionAccount = new Account(sessionClient)
      try {
        verifiedUser = await sessionAccount.get()
      } catch (error: any) {
        console.warn('[v0] Failed to load account after login:', error?.message)
      }
    } else {
      // Fall back to admin-loaded user if session secret is unavailable.
      console.warn('[v0] Session secret unavailable after login; using sessionId validation fallback')
      try {
        verifiedUser = await users.get(matchedUser.$id)
      } catch (error: any) {
        console.warn('[v0] Failed to load user via admin fallback:', error?.message)
      }
    }

    if (verifiedUser && !verifiedUser.emailVerification) {
      try {
        await sendAppwriteVerificationEmail({
          endpoint,
          projectId: project,
          apiKey,
          userId: verifiedUser.$id,
          redirectUrl: new URL('/verify-email', process.env.NEXT_PUBLIC_APP_URL || 'https://studentssocial.vercel.app').toString(),
        })
      } catch (verificationError) {
        console.warn('[v0] Failed to resend verification email during login:', verificationError)
      }

      try {
        await users.deleteSession(verifiedUser.$id, session.$id)
      } catch (logoutError) {
        console.warn('[v0] Failed to clear unverified session after login:', logoutError)
      }

      const duration = Date.now() - startTime
      logAuthEvent({
        eventType: 'LOGIN_FAILED',
        email,
        ipAddress: clientIP,
        userAgent,
        endpoint: '/api/auth/login',
        method: 'POST',
        statusCode: 403,
        duration,
        severity: 'WARNING',
        errorCode: 'EMAIL_NOT_VERIFIED',
        errorMessage: 'User account exists but email is not verified',
        metadata: { verificationSent: true },
      })
      return authErrorResponse({
        status: 403,
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Your account is registered but your email address has not been verified yet. We sent a new verification email. Please verify your email before signing in.',
        details: { verificationSent: true },
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
      secret: sessionSecret,
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
