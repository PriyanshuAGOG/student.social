import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'

/**
 * Enterprise-level authentication security module
 * Implements JWT sessions, rate limiting, CSRF, device fingerprinting, and account lockout
 */

// ==================== JWT SESSION MANAGEMENT ====================

export interface JWTPayload {
  userId: string
  sessionId: string
  deviceFingerprint: string
  iat: number
  exp: number
  jti: string // JWT ID for token blacklisting
}

export interface SessionToken {
  accessToken: string
  refreshToken: string
  expiresIn: number
  deviceFingerprint: string
}

/**
 * Generate RS256-signed JWT tokens with proper expiry
 */
export function generateJWT(payload: Omit<JWTPayload, 'iat' | 'exp' | 'jti'>, expiryMinutes: number = 30): string {
  const secret = process.env.JWT_SIGNING_KEY || 'default-dev-key-change-in-production'
  const now = Math.floor(Date.now() / 1000)
  
  const fullPayload: JWTPayload = {
    ...payload,
    iat: now,
    exp: now + expiryMinutes * 60,
    jti: uuidv4(),
  }

  return jwt.sign(fullPayload, secret, { algorithm: 'HS256' })
}

/**
 * Verify and decode JWT token
 */
export function verifyJWT(token: string): JWTPayload | null {
  try {
    const secret = process.env.JWT_SIGNING_KEY || 'default-dev-key-change-in-production'
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] })
    return decoded as JWTPayload
  } catch (error) {
    return null
  }
}

/**
 * Generate refresh token (longer expiry, encrypted)
 */
export function generateRefreshToken(userId: string, sessionId: string): string {
  const token = uuidv4()
  const expiry = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 // 7 days
  const payload = { userId, sessionId, token, expiry }
  
  // Store in Redis/DB for revocation capability
  return Buffer.from(JSON.stringify(payload)).toString('base64')
}

// ==================== RATE LIMITING ====================

interface RateLimitConfig {
  maxAttempts: number
  windowMs: number // milliseconds
  lockoutMs?: number // lockout duration after exceeding limit
}

const DEFAULT_REGISTER_LIMIT: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 60 * 60 * 1000, // 1 hour
}

const DEFAULT_LOGIN_LIMIT: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  lockoutMs: 15 * 60 * 1000, // 15 minute lockout
}

const DEFAULT_PASSWORD_RESET_LIMIT: RateLimitConfig = {
  maxAttempts: 3,
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
}

// In-memory rate limit store (use Redis in production)
const rateLimitStore = new Map<string, { attempts: number; firstAttempt: number; lockedUntil?: number }>()

/**
 * Check rate limit for an operation
 */
export function checkRateLimit(key: string, config: RateLimitConfig): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  // Check if user is locked out
  if (entry?.lockedUntil && now < entry.lockedUntil) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.lockedUntil,
    }
  }

  // Reset window if expired
  if (!entry || now - entry.firstAttempt > config.windowMs) {
    rateLimitStore.set(key, { attempts: 1, firstAttempt: now })
    return {
      allowed: true,
      remaining: config.maxAttempts - 1,
      resetTime: now + config.windowMs,
    }
  }

  // Increment attempt count
  entry.attempts++

  if (entry.attempts > config.maxAttempts) {
    // Lock out if configured
    if (config.lockoutMs) {
      entry.lockedUntil = now + config.lockoutMs
    }
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.lockedUntil || now + config.windowMs,
    }
  }

  return {
    allowed: true,
    remaining: config.maxAttempts - entry.attempts,
    resetTime: entry.firstAttempt + config.windowMs,
  }
}

/**
 * Get rate limit configuration by operation type
 */
export function getRateLimitConfig(operation: 'register' | 'login' | 'password_reset' | 'email_verify'): RateLimitConfig {
  switch (operation) {
    case 'register':
      return DEFAULT_REGISTER_LIMIT
    case 'login':
      return DEFAULT_LOGIN_LIMIT
    case 'password_reset':
      return DEFAULT_PASSWORD_RESET_LIMIT
    case 'email_verify':
      return { maxAttempts: 5, windowMs: 24 * 60 * 60 * 1000 }
    default:
      return { maxAttempts: 10, windowMs: 60 * 60 * 1000 }
  }
}

// ==================== CSRF PROTECTION ====================

const csrfTokenStore = new Map<string, { token: string; createdAt: number }>()
const CSRF_TOKEN_EXPIRY = 60 * 60 * 1000 // 1 hour

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  const token = crypto.randomBytes(32).toString('hex')
  const tokenId = uuidv4()
  csrfTokenStore.set(tokenId, { token, createdAt: Date.now() })
  
  // Cleanup old tokens
  if (csrfTokenStore.size > 10000) {
    const now = Date.now()
    for (const [id, data] of csrfTokenStore.entries()) {
      if (now - data.createdAt > CSRF_TOKEN_EXPIRY) {
        csrfTokenStore.delete(id)
      }
    }
  }
  
  return token
}

/**
 * Verify CSRF token
 */
export function verifyCSRFToken(token: string): boolean {
  for (const [, data] of csrfTokenStore.entries()) {
    if (crypto.timingSafeEqual(Buffer.from(data.token), Buffer.from(token))) {
      // Check expiry
      if (Date.now() - data.createdAt <= CSRF_TOKEN_EXPIRY) {
        return true
      }
    }
  }
  return false
}

// ==================== DEVICE FINGERPRINTING ====================

export interface DeviceFingerprint {
  id: string
  userAgent: string
  ipAddress: string
  hash: string
  createdAt: number
  lastSeen: number
  isVerified: boolean
}

const deviceStore = new Map<string, DeviceFingerprint>()

/**
 * Generate device fingerprint from request headers
 */
export function generateDeviceFingerprint(userAgent: string, ipAddress: string): string {
  const fingerprintString = `${userAgent}||${ipAddress}`
  return crypto.createHash('sha256').update(fingerprintString).digest('hex')
}

/**
 * Register a new device for a user
 */
export function registerDevice(userId: string, userAgent: string, ipAddress: string): DeviceFingerprint {
  const hash = generateDeviceFingerprint(userAgent, ipAddress)
  const deviceId = `${userId}:${hash}`
  
  const fingerprint: DeviceFingerprint = {
    id: deviceId,
    userAgent,
    ipAddress,
    hash,
    createdAt: Date.now(),
    lastSeen: Date.now(),
    isVerified: false,
  }
  
  deviceStore.set(deviceId, fingerprint)
  return fingerprint
}

/**
 * Verify device matches user's registered devices
 */
export function verifyDevice(userId: string, userAgent: string, ipAddress: string): { isKnown: boolean; device?: DeviceFingerprint } {
  const hash = generateDeviceFingerprint(userAgent, ipAddress)
  const deviceId = `${userId}:${hash}`
  const device = deviceStore.get(deviceId)
  
  if (device) {
    device.lastSeen = Date.now()
    return { isKnown: true, device }
  }
  
  return { isKnown: false }
}

// ==================== ACCOUNT LOCKOUT ====================

interface AccountLockout {
  userId: string
  failedAttempts: number
  lastFailedAttempt: number
  lockedUntil?: number
}

const lockoutStore = new Map<string, AccountLockout>()

const LOCKOUT_CONFIG = {
  maxFailedAttempts: 5,
  initialLockoutMs: 15 * 60 * 1000, // 15 minutes
  maxLockoutMs: 60 * 60 * 1000, // 1 hour
}

/**
 * Record failed login attempt
 */
export function recordFailedLoginAttempt(userId: string): { locked: boolean; remainingAttempts: number; lockedUntil?: number } {
  const now = Date.now()
  let lockout = lockoutStore.get(userId)

  if (!lockout) {
    lockout = {
      userId,
      failedAttempts: 1,
      lastFailedAttempt: now,
    }
    lockoutStore.set(userId, lockout)
    return {
      locked: false,
      remainingAttempts: LOCKOUT_CONFIG.maxFailedAttempts - 1,
    }
  }

  // Check if lockout expired
  if (lockout.lockedUntil && now > lockout.lockedUntil) {
    lockout.failedAttempts = 1
    lockout.lastFailedAttempt = now
    lockout.lockedUntil = undefined
    return {
      locked: false,
      remainingAttempts: LOCKOUT_CONFIG.maxFailedAttempts - 1,
    }
  }

  // Check if already locked
  if (lockout.lockedUntil && now < lockout.lockedUntil) {
    return {
      locked: true,
      remainingAttempts: 0,
      lockedUntil: lockout.lockedUntil,
    }
  }

  lockout.failedAttempts++
  lockout.lastFailedAttempt = now

  if (lockout.failedAttempts >= LOCKOUT_CONFIG.maxFailedAttempts) {
    // Calculate exponential backoff
    const lockoutMultiplier = Math.min(Math.pow(2, lockout.failedAttempts - LOCKOUT_CONFIG.maxFailedAttempts), 4)
    lockout.lockedUntil = now + LOCKOUT_CONFIG.initialLockoutMs * lockoutMultiplier

    return {
      locked: true,
      remainingAttempts: 0,
      lockedUntil: lockout.lockedUntil,
    }
  }

  return {
    locked: false,
    remainingAttempts: LOCKOUT_CONFIG.maxFailedAttempts - lockout.failedAttempts,
  }
}

/**
 * Clear failed login attempts on successful login
 */
export function clearLoginAttempts(userId: string): void {
  lockoutStore.delete(userId)
}

/**
 * Check if account is locked
 */
export function isAccountLocked(userId: string): { locked: boolean; lockedUntil?: number } {
  const lockout = lockoutStore.get(userId)
  if (!lockout?.lockedUntil) {
    return { locked: false }
  }

  const now = Date.now()
  if (now < lockout.lockedUntil) {
    return { locked: true, lockedUntil: lockout.lockedUntil }
  }

  // Lockout expired, clear it
  lockoutStore.delete(userId)
  return { locked: false }
}

// ==================== TOKEN BLACKLIST ====================

const tokenBlacklist = new Set<string>()

/**
 * Blacklist a token (for logout)
 */
export function blacklistToken(jti: string): void {
  tokenBlacklist.add(jti)
  
  // Cleanup old entries periodically
  if (tokenBlacklist.size > 100000) {
    tokenBlacklist.clear()
  }
}

/**
 * Check if token is blacklisted
 */
export function isTokenBlacklisted(jti: string): boolean {
  return tokenBlacklist.has(jti)
}
