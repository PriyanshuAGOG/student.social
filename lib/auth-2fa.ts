import crypto from 'crypto'
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'

/**
 * Enterprise Two-Factor Authentication System
 * Supports TOTP (Time-based One-Time Password) and backup codes
 */

export interface TOTPSecret {
  secret: string
  qrCode: string
  backupCodes: string[]
}

export interface VerificationResult {
  verified: boolean
  remainingAttempts?: number
}

const TOTP_WINDOW = 2 // Allow ±30 second window
const BACKUP_CODE_LENGTH = 8
const BACKUP_CODES_COUNT = 10

/**
 * Generate a new TOTP secret with QR code
 */
export async function generateTOTPSecret(email: string, appName: string = 'Peerspark'): Promise<TOTPSecret> {
  const secret = speakeasy.generateSecret({
    name: `${appName} (${email})`,
    issuer: appName,
    length: 32, // 256-bit entropy
  })

  // Generate QR code for scanning with authenticator app
  const qrCode = await QRCode.toDataURL(secret.otpauth_url!)

  // Generate backup codes
  const backupCodes = generateBackupCodes()

  return {
    secret: secret.base32,
    qrCode,
    backupCodes,
  }
}

/**
 * Verify a TOTP token
 */
export function verifyTOTPToken(secret: string, token: string): boolean {
  try {
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: TOTP_WINDOW,
    })

    return verified === true
  } catch (error) {
    console.error('[2FA] TOTP verification error:', error)
    return false
  }
}

/**
 * Generate backup codes for account recovery
 */
export function generateBackupCodes(count: number = BACKUP_CODES_COUNT): string[] {
  const codes: string[] = []

  for (let i = 0; i < count; i++) {
    // Generate random hex string and format as XXXX-XXXX
    const code = crypto.randomBytes(4).toString('hex').toUpperCase()
    codes.push(`${code.slice(0, 4)}-${code.slice(4, 8)}`)
  }

  return codes
}

/**
 * Hash a backup code for storage
 */
export function hashBackupCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex')
}

/**
 * Verify a backup code
 */
export function verifyBackupCode(code: string, hashedCode: string): boolean {
  const hash = crypto.createHash('sha256').update(code).digest('hex')
  return hash === hashedCode
}

/**
 * Encrypt TOTP secret for storage
 */
export function encryptTOTPSecret(secret: string, encryptionKey: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(
    'aes-256-gcm',
    crypto.scryptSync(encryptionKey, 'salt', 32),
    iv
  )

  let encrypted = cipher.update(secret, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag()

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

/**
 * Decrypt TOTP secret from storage
 */
export function decryptTOTPSecret(encrypted: string, encryptionKey: string): string {
  const [ivHex, authTagHex, ciphertext] = encrypted.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    crypto.scryptSync(encryptionKey, 'salt', 32),
    iv
  )

  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Generate a time-based one-time password (for SMS/email delivery)
 */
export function generateOTP(length: number = 6): string {
  const digits = '0123456789'
  let otp = ''

  for (let i = 0; i < length; i++) {
    otp += digits.charAt(Math.floor(Math.random() * digits.length))
  }

  return otp
}

/**
 * Hash an OTP for secure storage
 */
export function hashOTP(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex')
}

/**
 * Verify an OTP with timing window
 */
export function verifyOTP(otp: string, hashedOTP: string, maxAge: number = 600000): boolean {
  const hash = crypto.createHash('sha256').update(otp).digest('hex')
  return hash === hashedOTP
}

/**
 * Check if 2FA is enabled for a user
 */
export function is2FAEnabled(user: any): boolean {
  return user?.totpEnabled === true || user?.twoFactorEnabled === true
}

/**
 * Check if 2FA verification is required
 */
export function requires2FAVerification(user: any): boolean {
  return is2FAEnabled(user) && !user?.twoFactorVerified
}
