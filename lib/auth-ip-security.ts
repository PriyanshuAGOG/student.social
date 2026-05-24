/**
 * Enterprise IP-based Security System
 * Handles IP blocking, reputation tracking, and geographic validation
 */

const BLOCKED_IPS = new Map<string, { reason: string; timestamp: number; duration: number }>()
const SUSPICIOUS_IPS = new Map<string, { score: number; events: Array<{ type: string; timestamp: number }> }>()
const IP_WHITELIST = new Set<string>()

export interface IPReputation {
  ip: string
  score: number
  isBlocked: boolean
  isSuspicious: boolean
  reason?: string
  failedAttempts: number
  lastActivity: number
}

/**
 * Check if an IP is blocked
 */
export function isIPBlocked(ip: string): { blocked: boolean; reason?: string } {
  const blocked = BLOCKED_IPS.get(ip)

  if (!blocked) {
    return { blocked: false }
  }

  // Check if block duration has expired
  if (Date.now() - blocked.timestamp > blocked.duration) {
    BLOCKED_IPS.delete(ip)
    return { blocked: false }
  }

  return { blocked: true, reason: blocked.reason }
}

/**
 * Block an IP address
 */
export function blockIP(ip: string, reason: string = 'Suspicious activity', duration: number = 86400000): void {
  // Default 24 hour block
  BLOCKED_IPS.set(ip, {
    reason,
    timestamp: Date.now(),
    duration,
  })

  console.log(`[IP Security] Blocked IP ${ip}: ${reason}`)
}

/**
 * Unblock an IP address
 */
export function unblockIP(ip: string): void {
  BLOCKED_IPS.delete(ip)
  console.log(`[IP Security] Unblocked IP ${ip}`)
}

/**
 * Add IP to whitelist (trusted IPs)
 */
export function whitelistIP(ip: string): void {
  IP_WHITELIST.add(ip)
  console.log(`[IP Security] Whitelisted IP ${ip}`)
}

/**
 * Check if IP is whitelisted
 */
export function isIPWhitelisted(ip: string): boolean {
  return IP_WHITELIST.has(ip)
}

/**
 * Record a suspicious event for an IP
 */
export function recordSuspiciousEvent(ip: string, eventType: string): number {
  if (!SUSPICIOUS_IPS.has(ip)) {
    SUSPICIOUS_IPS.set(ip, {
      score: 0,
      events: [],
    })
  }

  const ipData = SUSPICIOUS_IPS.get(ip)!
  ipData.events.push({
    type: eventType,
    timestamp: Date.now(),
  })

  // Calculate score based on event type
  const scoreIncrement = getEventScore(eventType)
  ipData.score += scoreIncrement

  // Auto-block if score exceeds threshold (100)
  if (ipData.score >= 100 && !isIPWhitelisted(ip)) {
    blockIP(ip, `High suspicion score: ${ipData.score}`, 172800000) // 48 hour block
  }

  return ipData.score
}

/**
 * Get event score for reputation calculation
 */
function getEventScore(eventType: string): number {
  const scores: Record<string, number> = {
    failed_login: 5,
    failed_registration: 5,
    rate_limit_exceeded: 10,
    password_spray: 20,
    sql_injection_attempt: 30,
    malicious_payload: 30,
    credential_stuffing: 25,
    brute_force: 20,
    bot_signature: 15,
    tor_exit_node: 10,
    vpn_detected: 3, // Low score - VPNs are legitimate
    proxy_detected: 2,
  }

  return scores[eventType] || 1
}

/**
 * Get IP reputation
 */
export function getIPReputation(ip: string): IPReputation {
  const blocked = isIPBlocked(ip)
  const suspicious = SUSPICIOUS_IPS.get(ip)

  return {
    ip,
    score: suspicious?.score || 0,
    isBlocked: blocked.blocked,
    isSuspicious: (suspicious?.score || 0) > 30,
    reason: blocked.reason,
    failedAttempts: suspicious?.events.filter((e) => e.type.includes('failed')).length || 0,
    lastActivity: suspicious?.events[suspicious.events.length - 1]?.timestamp || 0,
  }
}

/**
 * Detect if IP is likely a bot
 */
export function detectBotSignatures(ip: string, userAgent: string): { isBot: boolean; confidence: number } {
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /scraper/i,
    /spider/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java(?!script)/i,
  ]

  const matches = botPatterns.filter((pattern) => pattern.test(userAgent)).length
  const confidence = Math.min(100, (matches / botPatterns.length) * 100)

  if (confidence > 50) {
    recordSuspiciousEvent(ip, 'bot_signature')
  }

  return {
    isBot: confidence > 50,
    confidence,
  }
}

/**
 * Detect if IP is from a known VPN/Proxy
 */
export function detectVPNOrProxy(ip: string): { detected: boolean; type: string; confidence: number } {
  // In production, you would integrate with a service like:
  // - IP Quality Score
  // - AbuseIPDB
  // - MaxMind
  // - IPQualityScore
  
  // For now, return placeholder
  return {
    detected: false,
    type: 'none',
    confidence: 0,
  }
}

/**
 * Validate IP geolocation against user's typical locations
 */
export function validateIPGeolocation(ip: string, userHistory: Array<{ ip: string; timestamp: number; country: string }>): { valid: boolean; anomalyScore: number } {
  // In production, you would integrate with MaxMind or similar
  // to get country/geolocation data
  
  // For now, simple implementation
  if (userHistory.length === 0) {
    return { valid: true, anomalyScore: 0 }
  }

  // If login from a very different location is detected (travel detector)
  // You would calculate distance and travel time between locations
  return {
    valid: true,
    anomalyScore: 0,
  }
}

/**
 * Clear old events from IP tracking (cleanup)
 */
export function cleanupOldIPEvents(maxAge: number = 2592000000): void {
  // 30 days default
  const now = Date.now()

  for (const [ip, data] of SUSPICIOUS_IPS.entries()) {
    // Keep only recent events
    data.events = data.events.filter((event) => now - event.timestamp < maxAge)

    // Recalculate score
    data.score = data.events.reduce((sum, event) => sum + getEventScore(event.type), 0)

    // Remove IP if no recent events
    if (data.events.length === 0) {
      SUSPICIOUS_IPS.delete(ip)
    }
  }
}
