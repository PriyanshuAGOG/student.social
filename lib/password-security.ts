import bcrypt from 'bcryptjs'

/**
 * Enterprise-level password security module
 * Implements password requirements, history tracking, and breach detection
 */

export interface PasswordPolicy {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  specialChars: string
}

export interface PasswordStrength {
  score: number // 0-4
  feedback: string[]
  isStrong: boolean
}

// Default enterprise password policy
export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
}

// Store password hashes for history (userId -> [hashes])
const passwordHistoryStore = new Map<string, string[]>()

/**
 * Hash password with bcrypt
 */
export async function hashPassword(password: string, rounds: number = 12): Promise<string> {
  return bcrypt.hash(password, rounds)
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash)
  } catch (error) {
    return false
  }
}

/**
 * Validate password strength and compliance with policy
 */
export function validatePasswordStrength(password: string, policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY): PasswordStrength {
  const feedback: string[] = []
  let score = 0

  // Check minimum length
  if (password.length >= policy.minLength) {
    score++
  } else {
    feedback.push(`Password must be at least ${policy.minLength} characters long`)
  }

  // Check uppercase requirement
  if (policy.requireUppercase) {
    if (/[A-Z]/.test(password)) {
      score++
    } else {
      feedback.push('Password must contain at least one uppercase letter')
    }
  }

  // Check lowercase requirement
  if (policy.requireLowercase) {
    if (/[a-z]/.test(password)) {
      score++
    } else {
      feedback.push('Password must contain at least one lowercase letter')
    }
  }

  // Check numbers requirement
  if (policy.requireNumbers) {
    if (/[0-9]/.test(password)) {
      score++
    } else {
      feedback.push('Password must contain at least one number')
    }
  }

  // Check special characters requirement
  if (policy.requireSpecialChars) {
    const specialCharsRegex = new RegExp(`[${policy.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`)
    if (specialCharsRegex.test(password)) {
      score++
    } else {
      feedback.push(`Password must contain at least one special character: ${policy.specialChars}`)
    }
  }

  // Bonus points for extra length and character variety
  if (password.length >= policy.minLength + 8) score = Math.min(4, score + 1)
  if (/[a-z]/.test(password) && /[A-Z]/.test(password) && /[0-9]/.test(password)) score = Math.min(4, score + 0.5)

  return {
    score: Math.min(4, Math.floor(score)),
    feedback,
    isStrong: feedback.length === 0,
  }
}

/**
 * Check if password has been used before (password history)
 * Prevents reusing old passwords
 */
export async function checkPasswordHistory(userId: string, newPassword: string, historySize: number = 5): Promise<boolean> {
  const history = passwordHistoryStore.get(userId) || []

  // Check against recent password hashes
  for (let i = 0; i < Math.min(historySize, history.length); i++) {
    const matches = await verifyPassword(newPassword, history[i])
    if (matches) {
      return false // Password was used before
    }
  }

  return true // Password is new
}

/**
 * Add password to history after change
 */
export async function addToPasswordHistory(userId: string, passwordHash: string, historySize: number = 5): Promise<void> {
  let history = passwordHistoryStore.get(userId) || []

  // Add new password to beginning
  history.unshift(passwordHash)

  // Keep only the last N passwords
  history = history.slice(0, historySize)

  passwordHistoryStore.set(userId, history)
}

/**
 * Check password against common breach database
 * In production, integrate with haveibeenpwned.com API
 */
export async function checkPasswordBreach(password: string): Promise<{ breached: boolean; count?: number }> {
  // Common weak passwords list (in production, use API)
  const commonPasswords = new Set([
    'password123', 'qwerty123', '123456789', 'admin123', 'letmein123',
    'welcome123', 'monkey123', '1234567890', 'dragon123', 'master123',
  ])

  if (commonPasswords.has(password.toLowerCase())) {
    return { breached: true, count: 999999 }
  }

  // In production, call haveibeenpwned API:
  // const apiKey = process.env.HIBP_API_KEY
  // const hash = sha1(password).toUpperCase()
  // const prefix = hash.substring(0, 5)
  // const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`)

  return { breached: false }
}

/**
 * Generate password reset token
 */
export function generatePasswordResetToken(): string {
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  return Buffer.from(token).toString('base64')
}

/**
 * Validate email against common patterns (prevent disposable emails)
 */
export function validateEmail(email: string): { valid: boolean; reason?: string } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!emailRegex.test(email)) {
    return { valid: false, reason: 'Invalid email format' }
  }

  // Disposable email domains (sample list - expand as needed)
  const disposableDomains = new Set([
    'tempmail.com', 'throwaway.email', 'mailinator.com', '10minutemail.com',
    'guerrillamail.com', 'yopmail.com', 'temp-mail.org',
  ])

  const domain = email.split('@')[1].toLowerCase()
  if (disposableDomains.has(domain)) {
    return { valid: false, reason: 'Disposable email addresses are not allowed' }
  }

  return { valid: true }
}

/**
 * Calculate password entropy (complexity measure)
 */
export function calculatePasswordEntropy(password: string): number {
  let characterSpace = 0

  if (/[a-z]/.test(password)) characterSpace += 26
  if (/[A-Z]/.test(password)) characterSpace += 26
  if (/[0-9]/.test(password)) characterSpace += 10
  if (/[^a-zA-Z0-9]/.test(password)) characterSpace += 32

  const entropy = password.length * Math.log2(characterSpace)
  return Math.round(entropy * 100) / 100
}

/**
 * Get password strength recommendation
 */
export function getPasswordRecommendation(password: string): string {
  const strength = validatePasswordStrength(password)
  const entropy = calculatePasswordEntropy(password)

  if (strength.score === 4 && entropy > 80) {
    return 'Excellent password - Very strong'
  }
  if (strength.score >= 3 && entropy > 60) {
    return 'Good password - Strong'
  }
  if (strength.score >= 2 && entropy > 40) {
    return 'Fair password - Could be stronger'
  }
  
  return 'Weak password - Not secure enough'
}

/**
 * Get detailed password requirements checklist
 */
export function getPasswordRequirements(password: string) {
  return {
    minLength: {
      met: password.length >= DEFAULT_PASSWORD_POLICY.minLength,
      label: `At least ${DEFAULT_PASSWORD_POLICY.minLength} characters`,
      current: password.length,
    },
    uppercase: {
      met: /[A-Z]/.test(password),
      label: 'At least one uppercase letter (A-Z)',
    },
    lowercase: {
      met: /[a-z]/.test(password),
      label: 'At least one lowercase letter (a-z)',
    },
    number: {
      met: /[0-9]/.test(password),
      label: 'At least one number (0-9)',
    },
    special: {
      met: new RegExp(`[${DEFAULT_PASSWORD_POLICY.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`).test(password),
      label: `At least one special character (!@#$%^&*)`,
    },
  }
}
