/**
 * Enterprise Audit Logging System
 * Comprehensive security audit trail for compliance (SOC 2, GDPR, etc.)
 */

export enum AuditEvent {
  // Authentication events
  USER_REGISTERED = 'user.registered',
  USER_EMAIL_VERIFIED = 'user.email_verified',
  USER_LOGIN_SUCCESS = 'user.login_success',
  USER_LOGIN_FAILED = 'user.login_failed',
  USER_LOGOUT = 'user.logout',
  USER_PASSWORD_CHANGED = 'user.password_changed',
  USER_PASSWORD_RESET_REQUESTED = 'user.password_reset_requested',
  USER_PASSWORD_RESET_COMPLETED = 'user.password_reset_completed',

  // 2FA events
  TWO_FA_ENABLED = 'auth.2fa_enabled',
  TWO_FA_DISABLED = 'auth.2fa_disabled',
  TWO_FA_VERIFIED = 'auth.2fa_verified',
  TWO_FA_FAILED = 'auth.2fa_failed',
  TWO_FA_BACKUP_CODE_USED = 'auth.backup_code_used',

  // Session events
  SESSION_CREATED = 'session.created',
  SESSION_REVOKED = 'session.revoked',
  SESSION_EXPIRED = 'session.expired',
  TOKEN_REFRESHED = 'session.token_refreshed',

  // Device events
  DEVICE_REGISTERED = 'device.registered',
  DEVICE_VERIFIED = 'device.verified',
  DEVICE_REVOKED = 'device.revoked',

  // Security events
  SUSPICIOUS_ACTIVITY_DETECTED = 'security.suspicious_activity',
  IP_BLOCKED = 'security.ip_blocked',
  BRUTE_FORCE_ATTEMPT = 'security.brute_force',
  RATE_LIMIT_EXCEEDED = 'security.rate_limit',
  CREDENTIAL_STUFFING_ATTEMPT = 'security.credential_stuffing',

  // Data access events
  USER_DATA_ACCESSED = 'data.user_accessed',
  SENSITIVE_DATA_EXPORTED = 'data.sensitive_exported',
  PERMISSION_CHANGED = 'permission.changed',
  ROLE_ASSIGNED = 'permission.role_assigned',
  ROLE_REVOKED = 'permission.role_revoked',

  // Account events
  ACCOUNT_LOCKED = 'account.locked',
  ACCOUNT_UNLOCKED = 'account.unlocked',
  ACCOUNT_DELETED = 'account.deleted',
  PROFILE_UPDATED = 'account.profile_updated',
}

export interface AuditLog {
  id: string
  timestamp: number
  event: AuditEvent
  userId?: string
  actor?: string // Who performed the action
  ipAddress: string
  userAgent: string
  resourceId?: string // e.g., documentId, sessionId
  resourceType?: string
  status: 'success' | 'failure' | 'blocked'
  changes?: Record<string, { before: any; after: any }>
  metadata?: Record<string, any>
  retentionUntil?: number // GDPR right to erasure
}

const auditLogs: AuditLog[] = []
const RETENTION_DAYS = 365
const RETENTION_MS = RETENTION_DAYS * 24 * 60 * 60 * 1000

/**
 * Log an audit event
 */
export function logAuditEvent(log: Omit<AuditLog, 'id' | 'timestamp'>) {
  const now = Date.now()
  const auditLog: AuditLog = {
    id: generateAuditLogId(),
    timestamp: now,
    retentionUntil: now + RETENTION_MS,
    ...log,
  }

  auditLogs.push(auditLog)

  // In production, write to database/file system for persistence
  console.log(`[AUDIT] ${log.event}`, {
    userId: log.userId,
    ipAddress: log.ipAddress,
    status: log.status,
  })

  // Alert on critical events
  if (isCriticalEvent(log.event)) {
    alertCriticalEvent(auditLog)
  }

  return auditLog
}

/**
 * Log successful authentication
 */
export function logAuthenticationSuccess(
  userId: string,
  ipAddress: string,
  userAgent: string,
  metadata?: Record<string, any>
) {
  return logAuditEvent({
    event: AuditEvent.USER_LOGIN_SUCCESS,
    userId,
    ipAddress,
    userAgent,
    status: 'success',
    metadata,
  })
}

/**
 * Log failed authentication
 */
export function logAuthenticationFailure(
  email: string,
  ipAddress: string,
  userAgent: string,
  reason: string,
  metadata?: Record<string, any>
) {
  return logAuditEvent({
    event: AuditEvent.USER_LOGIN_FAILED,
    actor: email,
    ipAddress,
    userAgent,
    status: 'failure',
    metadata: { reason, ...metadata },
  })
}

/**
 * Log user registration
 */
export function logUserRegistration(
  userId: string,
  email: string,
  ipAddress: string,
  userAgent: string,
  metadata?: Record<string, any>
) {
  return logAuditEvent({
    event: AuditEvent.USER_REGISTERED,
    userId,
    actor: email,
    ipAddress,
    userAgent,
    status: 'success',
    metadata,
  })
}

/**
 * Log password change
 */
export function logPasswordChange(
  userId: string,
  ipAddress: string,
  userAgent: string,
  reason: 'user_initiated' | 'admin_reset' | 'security_incident',
  metadata?: Record<string, any>
) {
  return logAuditEvent({
    event: AuditEvent.USER_PASSWORD_CHANGED,
    userId,
    ipAddress,
    userAgent,
    status: 'success',
    metadata: { reason, ...metadata },
  })
}

/**
 * Log 2FA enable
 */
export function log2FAEnabled(userId: string, ipAddress: string, userAgent: string) {
  return logAuditEvent({
    event: AuditEvent.TWO_FA_ENABLED,
    userId,
    ipAddress,
    userAgent,
    status: 'success',
  })
}

/**
 * Log 2FA verification
 */
export function log2FAVerification(
  userId: string,
  ipAddress: string,
  userAgent: string,
  verified: boolean
) {
  return logAuditEvent({
    event: verified ? AuditEvent.TWO_FA_VERIFIED : AuditEvent.TWO_FA_FAILED,
    userId,
    ipAddress,
    userAgent,
    status: verified ? 'success' : 'failure',
  })
}

/**
 * Log suspicious activity
 */
export function logSuspiciousActivity(
  userId: string | undefined,
  ipAddress: string,
  userAgent: string,
  activityType: string,
  metadata?: Record<string, any>
) {
  return logAuditEvent({
    event: AuditEvent.SUSPICIOUS_ACTIVITY_DETECTED,
    userId,
    ipAddress,
    userAgent,
    status: 'blocked',
    metadata: { activityType, ...metadata },
  })
}

/**
 * Log IP blocking
 */
export function logIPBlocked(ipAddress: string, reason: string, metadata?: Record<string, any>) {
  return logAuditEvent({
    event: AuditEvent.IP_BLOCKED,
    ipAddress,
    userAgent: 'system',
    status: 'success',
    metadata: { reason, ...metadata },
  })
}

/**
 * Log brute force attempt
 */
export function logBruteForceAttempt(
  email: string,
  ipAddress: string,
  userAgent: string,
  attemptCount: number
) {
  return logAuditEvent({
    event: AuditEvent.BRUTE_FORCE_ATTEMPT,
    actor: email,
    ipAddress,
    userAgent,
    status: 'blocked',
    metadata: { attemptCount },
  })
}

/**
 * Log data access
 */
export function logDataAccess(
  userId: string,
  ipAddress: string,
  userAgent: string,
  resourceType: string,
  resourceId: string,
  metadata?: Record<string, any>
) {
  return logAuditEvent({
    event: AuditEvent.USER_DATA_ACCESSED,
    userId,
    ipAddress,
    userAgent,
    resourceType,
    resourceId,
    status: 'success',
    metadata,
  })
}

/**
 * Get audit logs with filters
 */
export function getAuditLogs(filters?: {
  userId?: string
  event?: AuditEvent
  startDate?: number
  endDate?: number
  status?: 'success' | 'failure' | 'blocked'
  limit?: number
}): AuditLog[] {
  let results = [...auditLogs]

  if (filters?.userId) {
    results = results.filter((log) => log.userId === filters.userId)
  }

  if (filters?.event) {
    results = results.filter((log) => log.event === filters.event)
  }

  if (filters?.startDate) {
    results = results.filter((log) => log.timestamp >= filters.startDate!)
  }

  if (filters?.endDate) {
    results = results.filter((log) => log.timestamp <= filters.endDate!)
  }

  if (filters?.status) {
    results = results.filter((log) => log.status === filters.status)
  }

  // Sort by timestamp descending
  results.sort((a, b) => b.timestamp - a.timestamp)

  if (filters?.limit) {
    results = results.slice(0, filters.limit)
  }

  return results
}

/**
 * Get user's audit trail
 */
export function getUserAuditTrail(userId: string, limit: number = 100): AuditLog[] {
  return getAuditLogs({ userId, limit })
}

/**
 * Generate audit report
 */
export function generateAuditReport(startDate: number, endDate: number): {
  period: { start: Date; end: Date }
  totalEvents: number
  eventCounts: Record<string, number>
  failedAttempts: number
  blockedEvents: number
  criticalEvents: AuditLog[]
} {
  const logs = getAuditLogs({ startDate, endDate })

  const eventCounts: Record<string, number> = {}
  const criticalEvents: AuditLog[] = []

  for (const log of logs) {
    eventCounts[log.event] = (eventCounts[log.event] || 0) + 1

    if (isCriticalEvent(log.event)) {
      criticalEvents.push(log)
    }
  }

  const failedAttempts = logs.filter((l) => l.status === 'failure').length
  const blockedEvents = logs.filter((l) => l.status === 'blocked').length

  return {
    period: { start: new Date(startDate), end: new Date(endDate) },
    totalEvents: logs.length,
    eventCounts,
    failedAttempts,
    blockedEvents,
    criticalEvents,
  }
}

/**
 * Cleanup expired audit logs (GDPR compliance)
 */
export function cleanupExpiredAuditLogs(): number {
  const now = Date.now()
  const initialCount = auditLogs.length

  // Remove logs that have exceeded retention period
  const filtered = auditLogs.filter((log) => (log.retentionUntil || now) > now)

  auditLogs.length = 0
  auditLogs.push(...filtered)

  const deletedCount = initialCount - auditLogs.length
  console.log(`[AUDIT] Cleaned up ${deletedCount} expired logs`)

  return deletedCount
}

/**
 * Export audit logs for compliance
 */
export function exportAuditLogs(format: 'json' | 'csv' = 'json'): string {
  if (format === 'json') {
    return JSON.stringify(auditLogs, null, 2)
  }

  // CSV format
  const headers = [
    'ID',
    'Timestamp',
    'Event',
    'User ID',
    'Actor',
    'IP Address',
    'User Agent',
    'Status',
    'Resource Type',
    'Resource ID',
  ]

  const rows = auditLogs.map((log) => [
    log.id,
    new Date(log.timestamp).toISOString(),
    log.event,
    log.userId || '',
    log.actor || '',
    log.ipAddress,
    log.userAgent,
    log.status,
    log.resourceType || '',
    log.resourceId || '',
  ])

  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')

  return csv
}

// ============ HELPERS ============

function generateAuditLogId(): string {
  return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function isCriticalEvent(event: AuditEvent): boolean {
  const criticalEvents = [
    AuditEvent.USER_PASSWORD_CHANGED,
    AuditEvent.TWO_FA_ENABLED,
    AuditEvent.TWO_FA_DISABLED,
    AuditEvent.SESSION_REVOKED,
    AuditEvent.ACCOUNT_LOCKED,
    AuditEvent.ACCOUNT_DELETED,
    AuditEvent.SUSPICIOUS_ACTIVITY_DETECTED,
    AuditEvent.IP_BLOCKED,
    AuditEvent.BRUTE_FORCE_ATTEMPT,
  ]

  return criticalEvents.includes(event)
}

function alertCriticalEvent(log: AuditLog) {
  // In production, send alert to security team
  console.error(`[CRITICAL AUDIT] ${log.event}`, {
    userId: log.userId,
    ipAddress: log.ipAddress,
    timestamp: new Date(log.timestamp).toISOString(),
  })
}
