import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'

export interface VerificationToken {
  token: string
  email: string
  userId: string
  expiresAt: number
  attempts: number
  maxAttempts: number
  verified: boolean
  createdAt: number
}

export interface EmailVerificationOptions {
  expirationMinutes?: number
  maxVerificationAttempts?: number
  verificationLink?: (token: string, email: string) => string
}

const DEFAULT_EXPIRATION_MINUTES = 15
const DEFAULT_MAX_ATTEMPTS = 5
const verificationTokens = new Map<string, VerificationToken>()
const emailVerificationCooldown = new Map<string, number>()

/**
 * Generate a secure email verification token
 */
export function generateVerificationToken(
  email: string,
  userId: string,
  options: EmailVerificationOptions = {}
): VerificationToken {
  const expirationMinutes = options.expirationMinutes || DEFAULT_EXPIRATION_MINUTES
  const maxAttempts = options.maxVerificationAttempts || DEFAULT_MAX_ATTEMPTS

  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = Date.now() + expirationMinutes * 60 * 1000

  const verificationToken: VerificationToken = {
    token,
    email: email.toLowerCase(),
    userId,
    expiresAt,
    attempts: 0,
    maxAttempts,
    verified: false,
    createdAt: Date.now(),
  }

  verificationTokens.set(token, verificationToken)
  return verificationToken
}

/**
 * Verify an email with a token
 */
export async function verifyEmailToken(token: string, email: string): Promise<{ success: boolean; error?: string }> {
  const verificationToken = verificationTokens.get(token)

  if (!verificationToken) {
    return { success: false, error: 'Invalid verification token' }
  }

  // Check if token is expired
  if (Date.now() > verificationToken.expiresAt) {
    verificationTokens.delete(token)
    return { success: false, error: 'Verification token has expired' }
  }

  // Check if email matches
  if (verificationToken.email !== email.toLowerCase()) {
    verificationToken.attempts++
    return { success: false, error: 'Email does not match verification token' }
  }

  // Check attempt limit
  if (verificationToken.attempts >= verificationToken.maxAttempts) {
    verificationTokens.delete(token)
    return { success: false, error: 'Too many verification attempts. Token has been revoked.' }
  }

  // Mark as verified
  verificationToken.verified = true
  verificationToken.attempts++

  return { success: true }
}

/**
 * Resend verification email (with rate limiting)
 */
export function canResendVerificationEmail(email: string): { canResend: boolean; waitSeconds?: number } {
  const normalizedEmail = email.toLowerCase()
  const lastAttempt = emailVerificationCooldown.get(normalizedEmail)
  const now = Date.now()
  const COOLDOWN_SECONDS = 60 // 1 minute between resend attempts

  if (lastAttempt && now - lastAttempt < COOLDOWN_SECONDS * 1000) {
    const waitSeconds = Math.ceil((COOLDOWN_SECONDS * 1000 - (now - lastAttempt)) / 1000)
    return { canResend: false, waitSeconds }
  }

  emailVerificationCooldown.set(normalizedEmail, now)
  return { canResend: true }
}

/**
 * Get verification token details (for admin/debugging)
 */
export function getVerificationTokenInfo(token: string): VerificationToken | null {
  return verificationTokens.get(token) || null
}

/**
 * Cleanup expired tokens (should run periodically)
 */
export function cleanupExpiredTokens(): number {
  let cleaned = 0
  const now = Date.now()

  for (const [token, data] of verificationTokens.entries()) {
    if (now > data.expiresAt) {
      verificationTokens.delete(token)
      cleaned++
    }
  }

  return cleaned
}

/**
 * Revoke a verification token
 */
export function revokeVerificationToken(token: string): boolean {
  return verificationTokens.delete(token)
}

/**
 * Check if email is verified
 */
export function isEmailVerified(token: string): boolean {
  const verificationToken = verificationTokens.get(token)
  return verificationToken ? verificationToken.verified : false
}

/**
 * Build a verification email HTML template
 */
export function buildVerificationEmailHTML(
  email: string,
  verificationLink: string,
  appName: string = 'Peerspark'
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
      <h1 style="margin: 0; font-size: 28px;">${appName}</h1>
      <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Verify Your Email Address</p>
    </div>
    
    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
      <p style="margin: 0 0 20px 0;">Hi,</p>
      
      <p style="margin: 0 0 20px 0;">
        Thank you for creating an account on ${appName}. To complete your registration, 
        please verify your email address by clicking the button below.
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationLink}" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          Verify Email Address
        </a>
      </div>
      
      <p style="margin: 0 0 20px 0; font-size: 12px; color: #666;">
        Or paste this link in your browser:<br>
        <code style="background: #eee; padding: 2px 4px; border-radius: 3px; word-break: break-all;">${verificationLink}</code>
      </p>
      
      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
      
      <p style="margin: 0 0 10px 0; font-size: 12px; color: #999;">
        This verification link expires in 15 minutes. If you didn't create this account, 
        you can safely ignore this email.
      </p>
      
      <p style="margin: 10px 0; font-size: 12px; color: #999;">
        For security, we never send passwords via email.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Build a verification email text version
 */
export function buildVerificationEmailText(
  email: string,
  verificationLink: string,
  appName: string = 'Peerspark'
): string {
  return `
${appName} - Verify Your Email

Hi,

Thank you for creating an account on ${appName}. To complete your registration, 
please verify your email address by visiting the link below:

${verificationLink}

This link expires in 15 minutes.

If you didn't create this account, you can safely ignore this email.

For security, we never send passwords via email.

Best regards,
The ${appName} Team
  `.trim()
}
