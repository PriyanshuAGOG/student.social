/**
 * Enterprise-level audit logging for authentication events
 * Tracks all auth activities with comprehensive context for security analysis
 */

export type AuthEventType =
  | 'REGISTER_ATTEMPT'
  | 'REGISTER_SUCCESS'
  | 'REGISTER_FAILED'
  | 'LOGIN_ATTEMPT'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGIN_LOCKOUT'
  | 'LOGOUT'
  | 'PASSWORD_RESET_REQUESTED'
  | 'PASSWORD_RESET_SUCCESS'
  | 'PASSWORD_RESET_FAILED'
  | 'EMAIL_VERIFICATION_SENT'
  | 'EMAIL_VERIFIED'
  | 'EMAIL_VERIFICATION_FAILED'
  | 'DEVICE_REGISTERED'
  | 'DEVICE_UNVERIFIED'
  | 'UNUSUAL_ACTIVITY'
  | 'BRUTE_FORCE_DETECTED'

export interface AuditLog {
  id: string
  timestamp: string
  timezone: string
  eventType: AuthEventType
  userId?: string
  email?: string
  ipAddress: string
  userAgent: string
  deviceFingerprint?: string
  endpoint: string
  method: string
  statusCode: number
  duration: number // milliseconds
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
  metadata?: Record<string, any>
  sessionId?: string
  errorCode?: string
  errorMessage?: string
}

// In-memory audit log store (use proper DB in production)
const auditLogs: AuditLog[] = []
const MAX_LOGS = 10000

/**
 * Extract request context from Next.js request
 */
export function extractRequestContext(request: Request) {
  const headers = request.headers
  const userAgent = headers.get('user-agent') || 'unknown'
  const ipAddress = headers.get('x-forwarded-for')?.split(',')[0] || headers.get('x-real-ip') || 'unknown'
  const referer = headers.get('referer') || 'unknown'
  const origin = headers.get('origin') || 'unknown'

  return {
    userAgent,
    ipAddress: ipAddress.trim(),
    referer,
    origin,
  }
}

/**
 * Log authentication event
 */
export function logAuthEvent(event: Omit<AuditLog, 'id' | 'timestamp' | 'timezone'>): AuditLog {
  const id = `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const now = new Date()
  const log: AuditLog = {
    id,
    timestamp: now.toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    ...event,
  }

  // Store in memory (implement DB storage in production)
  auditLogs.push(log)

  // Rotate logs if too many
  if (auditLogs.length > MAX_LOGS) {
    auditLogs.shift()
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[AUDIT] ${event.eventType} - ${event.userId || event.email || 'unknown'} from ${event.ipAddress}`)
  }

  return log
}

/**
 * Log successful registration
 */
export function logRegistrationSuccess(
  userId: string,
  email: string,
  ipAddress: string,
  userAgent: string,
  duration: number
) {
  return logAuthEvent({
    eventType: 'REGISTER_SUCCESS',
    userId,
    email,
    ipAddress,
    userAgent,
    endpoint: '/api/auth/register',
    method: 'POST',
    statusCode: 201,
    duration,
    severity: 'INFO',
    metadata: { action: 'Account created successfully' },
  })
}

/**
 * Log failed registration
 */
export function logRegistrationFailed(
  email: string,
  ipAddress: string,
  userAgent: string,
  duration: number,
  errorCode: string,
  errorMessage: string,
  metadata?: Record<string, any>
) {
  return logAuthEvent({
    eventType: 'REGISTER_FAILED',
    email,
    ipAddress,
    userAgent,
    endpoint: '/api/auth/register',
    method: 'POST',
    statusCode: 400,
    duration,
    severity: 'WARNING',
    errorCode,
    errorMessage,
    metadata: { ...metadata, reason: 'Registration validation failed' },
  })
}

/**
 * Log successful login
 */
export function logLoginSuccess(
  userId: string,
  email: string,
  ipAddress: string,
  userAgent: string,
  duration: number,
  deviceFingerprint: string,
  sessionId?: string
) {
  return logAuthEvent({
    eventType: 'LOGIN_SUCCESS',
    userId,
    email,
    ipAddress,
    userAgent,
    deviceFingerprint,
    sessionId,
    endpoint: '/api/auth/login',
    method: 'POST',
    statusCode: 200,
    duration,
    severity: 'INFO',
    metadata: { action: 'User authenticated' },
  })
}

/**
 * Log failed login attempt
 */
export function logLoginFailed(
  email: string,
  ipAddress: string,
  userAgent: string,
  duration: number,
  reason: string,
  remainingAttempts?: number
) {
  return logAuthEvent({
    eventType: 'LOGIN_FAILED',
    email,
    ipAddress,
    userAgent,
    endpoint: '/api/auth/login',
    method: 'POST',
    statusCode: 401,
    duration,
    severity: 'WARNING',
    errorCode: 'INVALID_CREDENTIALS',
    errorMessage: reason,
    metadata: { remainingAttempts },
  })
}

/**
 * Log account lockout
 */
export function logAccountLockout(
  userId: string,
  email: string,
  ipAddress: string,
  userAgent: string,
  lockedUntil: number
) {
  return logAuthEvent({
    eventType: 'LOGIN_LOCKOUT',
    userId,
    email,
    ipAddress,
    userAgent,
    endpoint: '/api/auth/login',
    method: 'POST',
    statusCode: 429,
    duration: 0,
    severity: 'CRITICAL',
    errorCode: 'ACCOUNT_LOCKED',
    errorMessage: 'Account locked due to too many failed login attempts',
    metadata: { lockedUntil, reason: 'Security protection' },
  })
}

/**
 * Log unusual or suspicious activity
 */
export function logSuspiciousActivity(
  userId: string | undefined,
  email: string | undefined,
  ipAddress: string,
  userAgent: string,
  activityType: string,
  details: Record<string, any>
) {
  return logAuthEvent({
    eventType: 'UNUSUAL_ACTIVITY',
    userId,
    email,
    ipAddress,
    userAgent,
    endpoint: '/api/auth/*',
    method: 'POST',
    statusCode: 200,
    duration: 0,
    severity: 'WARNING',
    metadata: { activityType, ...details },
  })
}

/**
 * Log brute force detection
 */
export function logBruteForceDetection(ipAddress: string, attemptCount: number, endpoint: string) {
  return logAuthEvent({
    eventType: 'BRUTE_FORCE_DETECTED',
    ipAddress,
    userAgent: 'multiple',
    endpoint,
    method: 'POST',
    statusCode: 429,
    duration: 0,
    severity: 'CRITICAL',
    errorCode: 'BRUTE_FORCE',
    errorMessage: 'Multiple failed attempts detected',
    metadata: { attemptCount, recommendation: 'Block IP temporarily' },
  })
}

/**
 * Log email verification sent
 */
export function logEmailVerificationSent(userId: string, email: string, ipAddress: string, userAgent: string) {
  return logAuthEvent({
    eventType: 'EMAIL_VERIFICATION_SENT',
    userId,
    email,
    ipAddress,
    userAgent,
    endpoint: '/api/auth/send-verification',
    method: 'POST',
    statusCode: 200,
    duration: 0,
    severity: 'INFO',
    metadata: { action: 'Verification email sent' },
  })
}

/**
 * Log email verification success
 */
export function logEmailVerificationSuccess(userId: string, email: string, ipAddress: string, userAgent: string) {
  return logAuthEvent({
    eventType: 'EMAIL_VERIFIED',
    userId,
    email,
    ipAddress,
    userAgent,
    endpoint: '/api/auth/verify-email',
    method: 'POST',
    statusCode: 200,
    duration: 0,
    severity: 'INFO',
    metadata: { action: 'Email verified' },
  })
}

/**
 * Log device registration
 */
export function logDeviceRegistration(
  userId: string,
  ipAddress: string,
  userAgent: string,
  deviceFingerprint: string,
  isNewDevice: boolean
) {
  return logAuthEvent({
    eventType: 'DEVICE_REGISTERED',
    userId,
    ipAddress,
    userAgent,
    deviceFingerprint,
    endpoint: '/api/auth/login',
    method: 'POST',
    statusCode: 200,
    duration: 0,
    severity: isNewDevice ? 'WARNING' : 'INFO',
    metadata: { isNewDevice, action: isNewDevice ? 'New device detected' : 'Known device' },
  })
}

/**
 * Detect suspicious patterns from audit logs
 */
export function detectSuspiciousPatterns(timeWindowMs: number = 5 * 60 * 1000): { pattern: string; severity: string; details: any }[] {
  const now = Date.now()
  const recentLogs = auditLogs.filter((log) => new Date(log.timestamp).getTime() > now - timeWindowMs)

  const suspicious: { pattern: string; severity: string; details: any }[] = []

  // Check for multiple failed logins from same IP
  const ipFailedLogins = new Map<string, number>()
  recentLogs
    .filter((log) => log.eventType === 'LOGIN_FAILED')
    .forEach((log) => {
      const count = (ipFailedLogins.get(log.ipAddress) || 0) + 1
      ipFailedLogins.set(log.ipAddress, count)
    })

  ipFailedLogins.forEach((count, ip) => {
    if (count >= 3) {
      suspicious.push({
        pattern: 'Multiple failed login attempts from same IP',
        severity: count >= 5 ? 'CRITICAL' : 'WARNING',
        details: { ipAddress: ip, failedAttempts: count },
      })
    }
  })

  // Check for login attempts from many different IPs for same user
  const userIPs = new Map<string, Set<string>>()
  recentLogs
    .filter((log) => log.eventType === 'LOGIN_ATTEMPT' && log.userId)
    .forEach((log) => {
      if (!userIPs.has(log.userId!)) userIPs.set(log.userId!, new Set())
      userIPs.get(log.userId!)!.add(log.ipAddress)
    })

  userIPs.forEach((ips, userId) => {
    if (ips.size >= 3) {
      suspicious.push({
        pattern: 'Login attempts from multiple IPs for single user',
        severity: 'WARNING',
        details: { userId, ipCount: ips.size, ips: Array.from(ips) },
      })
    }
  })

  return suspicious
}

/**
 * Get audit logs with filtering
 */
export function getAuditLogs(filter?: {
  userId?: string
  email?: string
  ipAddress?: string
  eventType?: AuthEventType
  severity?: 'INFO' | 'WARNING' | 'CRITICAL'
  limit?: number
}): AuditLog[] {
  let results = [...auditLogs]

  if (filter?.userId) {
    results = results.filter((log) => log.userId === filter.userId)
  }
  if (filter?.email) {
    results = results.filter((log) => log.email === filter.email)
  }
  if (filter?.ipAddress) {
    results = results.filter((log) => log.ipAddress === filter.ipAddress)
  }
  if (filter?.eventType) {
    results = results.filter((log) => log.eventType === filter.eventType)
  }
  if (filter?.severity) {
    results = results.filter((log) => log.severity === filter.severity)
  }

  // Return most recent first
  results = results.reverse()

  if (filter?.limit) {
    results = results.slice(0, filter.limit)
  }

  return results
}

/**
 * Export audit trail as JSON
 */
export function exportAuditTrail(format: 'json' | 'csv' = 'json'): string {
  if (format === 'json') {
    return JSON.stringify(auditLogs, null, 2)
  }

  // CSV format
  const headers = ['Timestamp', 'Event', 'User', 'Email', 'IP', 'Status', 'Severity']
  const rows = auditLogs.map((log) => [
    log.timestamp,
    log.eventType,
    log.userId || '-',
    log.email || '-',
    log.ipAddress,
    log.statusCode,
    log.severity,
  ])

  const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
  return csvContent
}
