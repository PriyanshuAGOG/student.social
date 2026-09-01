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
  if (!payload || !key) throw new Error('Calendar token payload or key is missing')
  const normalizedKey = crypto.createHash('sha256').update(key).digest()
  const raw = Buffer.from(payload, 'base64url')
  if (raw.length <= 28) throw new Error('Calendar token payload is invalid')
  const iv = raw.subarray(0, 12)
  const tag = raw.subarray(12, 28)
  const ciphertext = raw.subarray(28)
  const decipher = crypto.createDecipheriv('aes-256-gcm', normalizedKey, iv)
  decipher.setAuthTag(tag)
  const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  return plain.toString('utf8')
}

export function decryptCalendarTokenWithFallback(
  payload: string,
  keys: string[],
): { token: string; keyIndex: number } {
  const uniqueKeys = keys.filter((key, index) => key && keys.indexOf(key) === index)
  let lastError: unknown

  for (let index = 0; index < uniqueKeys.length; index += 1) {
    try {
      return { token: decryptCalendarToken(payload, uniqueKeys[index]), keyIndex: index }
    } catch (error) {
      lastError = error
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Calendar token could not be decrypted')
}
