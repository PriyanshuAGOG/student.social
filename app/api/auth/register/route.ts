import { NextResponse } from 'next/server'
import { normalizeAppwriteEndpoint } from '@/lib/env'
import { authErrorResponse, authSuccessResponse, requireAuthEnv, getClientIP, getUserAgent, validateEmail, validatePasswordBasic, addRateLimitHeaders, makeErrorId } from '@/lib/auth-route-utils'
import { checkRateLimit, getRateLimitConfig } from '@/lib/auth-security'
import { validatePasswordStrength, checkPasswordBreach, validateEmail as validateEmailSecurity, hashPassword, addToPasswordHistory } from '@/lib/password-security'
import { logRegistrationSuccess, logRegistrationFailed } from '@/lib/auth-audit'
import { z } from 'zod'
import { Client, Users, ID } from 'node-appwrite'

const schema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
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
      console.log('[v0] Failed to parse JSON body in register endpoint')
      return authErrorResponse({
        status: 400,
        code: 'INVALID_JSON',
        message: 'Invalid request body. Please send valid JSON.',
        details: { clientIP },
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
    const name = validation.data.name.trim()

    // Check rate limiting
    const rateLimitKey = `register:${clientIP}`
    const rateLimitConfig = getRateLimitConfig('register')
    const rateLimitCheck = checkRateLimit(rateLimitKey, rateLimitConfig)

    if (!rateLimitCheck.allowed) {
      const duration = Date.now() - startTime
      logRegistrationFailed(email, clientIP, userAgent, duration, 'RATE_LIMITED', 'Too many registration attempts', {
        remaining: rateLimitCheck.remaining,
        resetTime: rateLimitCheck.resetTime,
      })

      const errorResponse = authErrorResponse({
        status: 429,
        code: 'RATE_LIMITED',
        message: 'Too many registration attempts. Please try again later.',
        details: { retryAfter: Math.ceil((rateLimitCheck.resetTime - Date.now()) / 1000) },
      })

      return new Response(errorResponse.body, {
        status: errorResponse.status,
        headers: addRateLimitHeaders(Object.fromEntries(errorResponse.headers.entries()), rateLimitCheck.remaining, rateLimitCheck.resetTime),
      })
    }

    // Additional email validation
    const emailValidation = validateEmailSecurity(email)
    if (!emailValidation.valid) {
      const duration = Date.now() - startTime
      logRegistrationFailed(email, clientIP, userAgent, duration, 'INVALID_EMAIL', emailValidation.reason || 'Invalid email')
      return authErrorResponse({
        status: 400,
        code: 'INVALID_EMAIL',
        message: emailValidation.reason || 'Email address is not valid',
      })
    }

    // Validate password strength
    const passwordStrength = validatePasswordStrength(password)
    if (!passwordStrength.isStrong) {
      const duration = Date.now() - startTime
      logRegistrationFailed(email, clientIP, userAgent, duration, 'WEAK_PASSWORD', 'Password does not meet security requirements', { feedback: passwordStrength.feedback })
      return authErrorResponse({
        status: 400,
        code: 'WEAK_PASSWORD',
        message: 'Password does not meet security requirements',
        details: { feedback: passwordStrength.feedback },
      })
    }

    // Check password breach
    const breachCheck = await checkPasswordBreach(password)
    if (breachCheck.breached) {
      const duration = Date.now() - startTime
      logRegistrationFailed(email, clientIP, userAgent, duration, 'PASSWORD_BREACHED', 'This password has been found in data breaches', { count: breachCheck.count })
      return authErrorResponse({
        status: 400,
        code: 'PASSWORD_BREACHED',
        message: 'This password has been found in data breaches. Please choose a different password.',
      })
    }

    // Verify environment variables
    const envCheck = requireAuthEnv(['NEXT_PUBLIC_APPWRITE_ENDPOINT', 'NEXT_PUBLIC_APPWRITE_PROJECT_ID', 'APPWRITE_API_KEY'])
    if (!envCheck.ok) {
      console.error('[v0] Missing auth environment variables in register endpoint', envCheck.missing)
      const duration = Date.now() - startTime
      logRegistrationFailed(email, clientIP, userAgent, duration, 'SERVER_CONFIG_ERROR', 'Authentication server is misconfigured', { missing: envCheck.missing })
      return authErrorResponse({
        status: 500,
        code: 'AUTH_ENV_MISSING',
        message: 'Authentication server is misconfigured. Please try again later.',
        details: { errorId: makeErrorId() },
      })
    }

    // Get Appwrite configuration
    const endpoint = normalizeAppwriteEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
    const apiKey = process.env.APPWRITE_API_KEY

    if (!endpoint || !project || !apiKey) {
      console.error('[v0] Invalid Appwrite configuration in register endpoint')
      const duration = Date.now() - startTime
      logRegistrationFailed(email, clientIP, userAgent, duration, 'INVALID_CONFIG', 'Authentication server misconfiguration')
      return authErrorResponse({
        status: 500,
        code: 'INVALID_CONFIG',
        message: 'Authentication server is misconfigured.',
        details: { errorId: makeErrorId() },
      })
    }

    // Create Appwrite client
    const client = new Client().setEndpoint(endpoint).setProject(project).setKey(apiKey)
    const users = new Users(client)

    // Create user
    console.log('[v0] Attempting to create user:', email)
    const user = await users.create(ID.unique(), email, undefined, password, name)

    // Hash password for our audit trail
    const passwordHash = await hashPassword(password)
    await addToPasswordHistory(user.$id, passwordHash)

    const duration = Date.now() - startTime
    logRegistrationSuccess(user.$id, email, clientIP, userAgent, duration)

    console.log('[v0] User created successfully:', user.$id)

    return authSuccessResponse(
      {
        userId: user.$id,
        email: user.email,
        name: user.name,
        message: 'Registration successful. Please verify your email.',
      },
      201
    )
  } catch (error: any) {
    const duration = Date.now() - startTime
    console.error('[v0] Registration error:', error)

    // Handle specific Appwrite errors
    if (error?.code === 'user_already_exists' || error?.message?.includes('already exists')) {
      logRegistrationFailed(email, clientIP, userAgent, duration, 'USER_EXISTS', 'Email already registered')
      return authErrorResponse({
        status: 400,
        code: 'USER_EXISTS',
        message: 'An account with this email already exists.',
      })
    }

    if (error?.code === 'user_email_not_whitelisted') {
      logRegistrationFailed(email, clientIP, userAgent, duration, 'EMAIL_NOT_ALLOWED', 'Email not whitelisted')
      return authErrorResponse({
        status: 400,
        code: 'EMAIL_NOT_ALLOWED',
        message: 'This email address is not allowed for registration.',
      })
    }

    // Generic error
    logRegistrationFailed(email, clientIP, userAgent, duration, 'REGISTRATION_FAILED', error?.message || 'Unknown error during registration', {
      errorDetails: error?.message || error?.toString(),
    })

    return authErrorResponse({
      status: 400,
      code: 'REGISTRATION_FAILED',
      message: 'Registration failed. Please try again.',
      details: { errorId: makeErrorId() },
    })
  }
}
