type RateLimitResult = { allowed: boolean; remaining: number; resetAt: number; durable: boolean }

const localCounters = new Map<string, { count: number; resetAt: number }>()

function localLimit(key: string, max: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const current = localCounters.get(key)
  if (!current || current.resetAt <= now) {
    const resetAt = now + windowMs
    localCounters.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: Math.max(0, max - 1), resetAt, durable: false }
  }
  current.count += 1
  localCounters.set(key, current)
  return { allowed: current.count <= max, remaining: Math.max(0, max - current.count), resetAt: current.resetAt, durable: false }
}

/** Fixed-window limiter backed by Upstash Redis REST in production. */
export async function checkDurableRateLimit(key: string, max: number, windowMs: number): Promise<RateLimitResult> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/+$/, '')
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!redisUrl || !redisToken) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Durable rate limiting is not configured')
    }
    return localLimit(key, max, windowMs)
  }

  const now = Date.now()
  const window = Math.floor(now / windowMs)
  const redisKey = `peerspark:rate:${key}:${window}`
  const response = await fetch(`${redisUrl}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${redisToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([
      ['INCR', redisKey],
      ['PEXPIRE', redisKey, String(windowMs + 5_000)],
    ]),
    cache: 'no-store',
  })
  if (!response.ok) throw new Error(`Durable rate limiter returned ${response.status}`)
  const result = await response.json() as Array<{ result?: number; error?: string }>
  if (result[0]?.error || typeof result[0]?.result !== 'number') {
    throw new Error(result[0]?.error || 'Invalid durable rate limiter response')
  }
  const count = result[0].result
  const resetAt = (window + 1) * windowMs
  return { allowed: count <= max, remaining: Math.max(0, max - count), resetAt, durable: true }
}
