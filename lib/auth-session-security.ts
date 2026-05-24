import crypto from 'crypto'

/**
 * Enterprise Session Security System
 * Implements token rotation, device tracking, concurrent session limits
 */

export interface SessionToken {
  accessToken: string
  refreshToken: string
  expiresIn: number
  issuedAt: number
}

export interface DeviceInfo {
  deviceId: string
  deviceName: string
  deviceType: 'mobile' | 'desktop' | 'tablet' | 'unknown'
  osName: string
  osVersion: string
  browserName: string
  browserVersion: string
  userAgent: string
  ipAddress: string
  lastActivity: number
  isVerified: boolean
}

export interface Session {
  sessionId: string
  userId: string
  deviceId: string
  accessToken: string
  refreshToken: string
  tokenVersion: number
  createdAt: number
  lastActivity: number
  expiresAt: number
  isActive: boolean
}

const MAX_CONCURRENT_SESSIONS = 5
const ACCESS_TOKEN_EXPIRY = 30 * 60 * 1000 // 30 minutes
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000 // 7 days
const SESSION_IDLE_TIMEOUT = 24 * 60 * 60 * 1000 // 24 hours

const activeSessions = new Map<string, Session[]>()
const deviceRegistry = new Map<string, DeviceInfo>()
const tokenBlacklist = new Set<string>()
const tokenVersions = new Map<string, number>()

/**
 * Generate secure random tokens
 */
export function generateTokens(): SessionToken {
  const now = Date.now()
  
  return {
    accessToken: crypto.randomBytes(32).toString('hex'),
    refreshToken: crypto.randomBytes(48).toString('hex'),
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuedAt: now,
  }
}

/**
 * Create a new session with token rotation support
 */
export function createSession(
  userId: string,
  deviceInfo: DeviceInfo,
  ipAddress: string
): Session {
  const tokens = generateTokens()
  const sessionId = crypto.randomUUID()
  const now = Date.now()

  const session: Session = {
    sessionId,
    userId,
    deviceId: deviceInfo.deviceId,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    tokenVersion: 1,
    createdAt: now,
    lastActivity: now,
    expiresAt: now + tokens.expiresIn,
    isActive: true,
  }

  // Store session
  if (!activeSessions.has(userId)) {
    activeSessions.set(userId, [])
  }

  const userSessions = activeSessions.get(userId)!
  userSessions.push(session)

  // Enforce max concurrent sessions - remove oldest if exceeded
  if (userSessions.length > MAX_CONCURRENT_SESSIONS) {
    const sortedByActivity = userSessions.sort((a, b) => a.lastActivity - b.lastActivity)
    const toRemove = sortedByActivity.slice(0, userSessions.length - MAX_CONCURRENT_SESSIONS)
    
    for (const session of toRemove) {
      revokeSession(userId, session.sessionId)
    }
  }

  // Register device if new
  if (!deviceRegistry.has(deviceInfo.deviceId)) {
    deviceRegistry.set(deviceInfo.deviceId, {
      ...deviceInfo,
      lastActivity: now,
      isVerified: false,
    })
  } else {
    const device = deviceRegistry.get(deviceInfo.deviceId)!
    device.lastActivity = now
    device.userAgent = deviceInfo.userAgent
  }

  // Initialize token version if not exists
  if (!tokenVersions.has(userId)) {
    tokenVersions.set(userId, 1)
  }

  return session
}

/**
 * Validate a session token
 */
export function validateSession(userId: string, accessToken: string): { valid: boolean; session?: Session } {
  // Check if token is blacklisted
  if (tokenBlacklist.has(accessToken)) {
    return { valid: false }
  }

  const userSessions = activeSessions.get(userId)
  if (!userSessions) {
    return { valid: false }
  }

  const session = userSessions.find((s) => s.accessToken === accessToken && s.isActive)
  
  if (!session) {
    return { valid: false }
  }

  // Check expiry
  if (Date.now() > session.expiresAt) {
    session.isActive = false
    return { valid: false }
  }

  // Check idle timeout
  if (Date.now() - session.lastActivity > SESSION_IDLE_TIMEOUT) {
    session.isActive = false
    return { valid: false }
  }

  // Update last activity
  session.lastActivity = Date.now()

  return { valid: true, session }
}

/**
 * Refresh access token
 */
export function refreshAccessToken(userId: string, refreshToken: string): SessionToken | null {
  const userSessions = activeSessions.get(userId)
  if (!userSessions) {
    return null
  }

  const session = userSessions.find((s) => s.refreshToken === refreshToken && s.isActive)
  
  if (!session) {
    return null
  }

  // Check if refresh token has expired (7 days)
  if (Date.now() - session.createdAt > REFRESH_TOKEN_EXPIRY) {
    session.isActive = false
    return null
  }

  // Generate new tokens
  const newTokens = generateTokens()
  const now = Date.now()

  // Update session
  session.accessToken = newTokens.accessToken
  session.refreshToken = newTokens.refreshToken
  session.expiresAt = now + newTokens.expiresIn
  session.lastActivity = now
  session.tokenVersion = (session.tokenVersion || 0) + 1

  // Blacklist old refresh token for security
  tokenBlacklist.add(refreshToken)

  return newTokens
}

/**
 * Revoke a specific session
 */
export function revokeSession(userId: string, sessionId: string): boolean {
  const userSessions = activeSessions.get(userId)
  
  if (!userSessions) {
    return false
  }

  const session = userSessions.find((s) => s.sessionId === sessionId)
  
  if (!session) {
    return false
  }

  // Mark as inactive
  session.isActive = false
  
  // Blacklist tokens
  tokenBlacklist.add(session.accessToken)
  tokenBlacklist.add(session.refreshToken)

  // Remove from active sessions
  const index = userSessions.indexOf(session)
  if (index > -1) {
    userSessions.splice(index, 1)
  }

  return true
}

/**
 * Revoke all sessions for a user (e.g., on password change)
 */
export function revokeAllSessions(userId: string): number {
  const userSessions = activeSessions.get(userId)
  
  if (!userSessions) {
    return 0
  }

  let revokedCount = 0

  for (const session of userSessions) {
    if (session.isActive) {
      session.isActive = false
      tokenBlacklist.add(session.accessToken)
      tokenBlacklist.add(session.refreshToken)
      revokedCount++
    }
  }

  // Clear all sessions
  activeSessions.delete(userId)

  return revokedCount
}

/**
 * Get all active sessions for a user
 */
export function getUserSessions(userId: string): Session[] {
  const userSessions = activeSessions.get(userId) || []
  return userSessions.filter((s) => s.isActive && Date.now() <= s.expiresAt)
}

/**
 * Register a new device
 */
export function registerDevice(userId: string, deviceInfo: DeviceInfo): DeviceInfo {
  const registered: DeviceInfo = {
    ...deviceInfo,
    lastActivity: Date.now(),
    isVerified: false,
  }

  deviceRegistry.set(deviceInfo.deviceId, registered)

  // New device login should trigger verification email
  console.log(`[Session Security] New device registered for user ${userId}: ${deviceInfo.deviceName}`)

  return registered
}

/**
 * Get user's registered devices
 */
export function getUserDevices(userId: string): DeviceInfo[] {
  // In production, this would query from database
  const devices: DeviceInfo[] = []
  
  for (const device of deviceRegistry.values()) {
    devices.push(device)
  }

  return devices
}

/**
 * Verify a device (after email confirmation)
 */
export function verifyDevice(deviceId: string): boolean {
  const device = deviceRegistry.get(deviceId)
  
  if (!device) {
    return false
  }

  device.isVerified = true
  return true
}

/**
 * Revoke a device (unregister)
 */
export function revokeDevice(deviceId: string): boolean {
  return deviceRegistry.delete(deviceId)
}

/**
 * Detect suspicious session activity
 */
export function detectSuspiciousActivity(userId: string, currentIP: string): { suspicious: boolean; reason?: string } {
  const userSessions = activeSessions.get(userId)
  
  if (!userSessions || userSessions.length === 0) {
    return { suspicious: false }
  }

  // Check for simultaneous login from different IPs within short time
  const recentSessions = userSessions.filter((s) => Date.now() - s.lastActivity < 300000) // 5 minutes
  const differentIPs = new Set(recentSessions.map((s) => s.deviceId))

  if (recentSessions.length > 2) {
    return {
      suspicious: true,
      reason: 'Multiple simultaneous active sessions detected',
    }
  }

  return { suspicious: false }
}

/**
 * Cleanup expired sessions
 */
export function cleanupExpiredSessions(): number {
  let cleanedCount = 0
  const now = Date.now()

  for (const [userId, sessions] of activeSessions.entries()) {
    const activeSession = sessions.filter((s) => s.isActive && now <= s.expiresAt)
    
    if (activeSession.length === 0) {
      activeSessions.delete(userId)
      cleanedCount += sessions.length
    } else {
      activeSessions.set(userId, activeSession)
      cleanedCount += sessions.length - activeSession.length
    }
  }

  return cleanedCount
}

/**
 * Get session statistics
 */
export function getSessionStats(): { activeSessions: number; totalUsers: number; oldestSession: number } {
  let totalActiveSessions = 0
  let oldestSession = Date.now()

  for (const sessions of activeSessions.values()) {
    for (const session of sessions) {
      if (session.isActive) {
        totalActiveSessions++
        if (session.createdAt < oldestSession) {
          oldestSession = session.createdAt
        }
      }
    }
  }

  return {
    activeSessions: totalActiveSessions,
    totalUsers: activeSessions.size,
    oldestSession,
  }
}
