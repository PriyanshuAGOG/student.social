import { NextResponse } from 'next/server'
import { getAppwriteServerConfig } from '@/lib/env'
import { authErrorResponse, authSuccessResponse, getClientIP, getUserAgent, addRateLimitHeaders, makeErrorId } from '@/lib/auth-route-utils'
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
        message: 'Password must contain: at least 8 characters, uppercase letter, lowercase letter, number, and special character',
        details: { requirements: passwordStrength.feedback },
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
    const { endpoint, projectId, apiKey } = getAppwriteServerConfig()
    if (!endpoint || !projectId || !apiKey) {
      console.error('[v0] Missing auth environment variables in register endpoint', {
        endpoint: Boolean(endpoint),
        projectId: Boolean(projectId),
        apiKey: Boolean(apiKey),
      })
      const duration = Date.now() - startTime
      logRegistrationFailed(email, clientIP, userAgent, duration, 'SERVER_CONFIG_ERROR', 'Authentication server is misconfigured', {
        endpoint: Boolean(endpoint),
        projectId: Boolean(projectId),
        apiKey: Boolean(apiKey),
      })
      return authErrorResponse({
        status: 500,
        code: 'AUTH_ENV_MISSING',
        message: 'Authentication server is misconfigured. Please try again later.',
        details: { errorId: makeErrorId() },
      })
    }

    // Create Appwrite client
    const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey)
    const users = new Users(client)

    // Create user with comprehensive error handling
    console.log('[v0] Attempting to create user in Appwrite:', email)
    let user: any
    try {
      user = await users.create({
        userId: ID.unique(),
        email,
        password,
        name,
      })
    } catch (appwriteError: any) {
      const duration = Date.now() - startTime
      const errorCode = String(appwriteError?.code ?? appwriteError?.type ?? 'UNKNOWN')
      const errorType = String(appwriteError?.type ?? '')
      const errorMessage = appwriteError?.message || appwriteError?.toString() || 'User creation failed'
      const errorStatus = Number(appwriteError?.status ?? appwriteError?.statusCode ?? appwriteError?.code ?? 400)

      console.error('[v0] Appwrite user creation error:', {
        code: errorCode,
        type: errorType,
        message: errorMessage,
        status: errorStatus,
        response: appwriteError?.response,
      })

      // 409 Conflict - User already exists
      if (errorStatus === 409 || errorCode === '409' || errorMessage.toLowerCase().includes('already exists') || errorMessage.toLowerCase().includes('duplicate')) {
        logRegistrationFailed(
          email,
          clientIP,
          userAgent,
          duration,
          'USER_EXISTS',
          'Email already registered'
        )
        return authErrorResponse({
          status: 409,
          code: 'USER_EXISTS',
          message:
            'This email address is already registered. Please sign in instead or use the password reset if you forgot your credentials.',
        })
      }

      // Invalid email format
      if (
        errorType.includes('invalid_email') ||
        errorMessage.toLowerCase().includes('invalid email') ||
        (errorMessage.toLowerCase().includes('email') && errorMessage.toLowerCase().includes('invalid'))
      ) {
        logRegistrationFailed(email, clientIP, userAgent, duration, 'INVALID_EMAIL', 'Invalid email format in Appwrite')
        return authErrorResponse({
          status: 400,
          code: 'INVALID_EMAIL',
          message: 'The email address format is not valid. Please check and try again.',
        })
      }

      // Weak password or password policy violation
      if (
        errorType.includes('password') ||
        errorMessage.toLowerCase().includes('password') ||
        errorMessage.toLowerCase().includes('weak')
      ) {
        logRegistrationFailed(email, clientIP, userAgent, duration, 'WEAK_PASSWORD', 'Appwrite password policy rejection')
        return authErrorResponse({
          status: 400,
          code: 'WEAK_PASSWORD',
          message:
            'Password does not meet security requirements. Must contain uppercase, lowercase, number, and special character (minimum 8 characters).',
        })
      }

      // Email not whitelisted (if whitelist is enabled)
      if (errorType.includes('email_not_whitelisted') || errorMessage.toLowerCase().includes('whitelist')) {
        logRegistrationFailed(email, clientIP, userAgent, duration, 'EMAIL_NOT_ALLOWED', 'Email not whitelisted')
        return authErrorResponse({
          status: 400,
          code: 'EMAIL_NOT_ALLOWED',
          message: 'This email address is not allowed for registration. Please contact support.',
        })
      }

      // Rate limited by Appwrite
      if (errorStatus === 429 || errorCode === '429') {
        logRegistrationFailed(email, clientIP, userAgent, duration, 'RATE_LIMITED', 'Appwrite rate limit')
        return authErrorResponse({
          status: 429,
          code: 'RATE_LIMITED',
          message: 'Too many registration attempts. Please try again in a few minutes.',
        })
      }

      // Server error
      if (errorStatus >= 500) {
        logRegistrationFailed(email, clientIP, userAgent, duration, 'SERVER_ERROR', 'Appwrite server error', {
          statusCode: errorStatus,
        })
        return authErrorResponse({
          status: 500,
          code: 'SERVER_ERROR',
          message: 'Authentication service is temporarily unavailable. Please try again later.',
          details: { errorId: makeErrorId() },
        })
      }

      // Fallback for unknown errors
      logRegistrationFailed(email, clientIP, userAgent, duration, 'REGISTRATION_FAILED', errorMessage, {
        errorCode,
        errorType,
        errorStatus,
      })
      return authErrorResponse({
        status: 400,
        code: 'REGISTRATION_FAILED',
        message: 'Unable to create account. Please check your information and try again.',
        details: {
          errorId: makeErrorId(),
          errorCode,
          errorType,
          errorStatus,
          errorMessage,
        },
      })
    }

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
        message: 'Registration successful. Please verify your email to complete setup.',
      },
      201
    )
  } catch (error: any) {
    const duration = Date.now() - startTime
    console.error('[v0] Unexpected registration error:', error)

    logRegistrationFailed(email, clientIP, userAgent, duration, 'UNEXPECTED_ERROR', error?.message || 'Unknown error', {
      errorStack: error?.stack,
    })

    return authErrorResponse({
      status: 500,
      code: 'REGISTRATION_FAILED',
      message: 'Registration failed. Please try again or contact support if the problem persists.',
      details: {
        errorId: makeErrorId(),
        errorMessage: error?.message,
        errorCode: error?.code,
        errorType: error?.type,
        errorResponse: error?.response,
      },
    })
  }
}
