import crypto from 'crypto'

export function generateCalendarToken(): string {
  return `pscal_v1_${crypto.randomBytes(32).toString('base64url')}`
}

export function hashCalendarToken(token: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(token).digest('hex')
}

export function hashIp(ip: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(ip).digest('hex')
}

export function encryptCalendarToken(rawToken: string, key: string): string {
  const normalizedKey = crypto.createHash('sha256').update(key).digest()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', normalizedKey, iv)
  const ciphertext = Buffer.concat([cipher.update(rawToken, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, ciphertext]).toString('base64url')
}

export function decryptCalendarToken(payload: string, key: string): string {
  const normalizedKey = crypto.createHash('sha256').update(key).digest()
  const raw = Buffer.from(payload, 'base64url')
  const iv = raw.subarray(0, 12)
  const tag = raw.subarray(12, 28)
  const ciphertext = raw.subarray(28)
  const decipher = crypto.createDecipheriv('aes-256-gcm', normalizedKey, iv)
  decipher.setAuthTag(tag)
  const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  return plain.toString('utf8')
}
