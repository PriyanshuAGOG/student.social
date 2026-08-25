type CachedProfile<T> = {
  value: T
  expiresAt: number
}

type ProfileEnsureDeduperOptions = {
  ttlMs?: number
  now?: () => number
}

/**
 * Coalesces concurrent profile bootstrap requests and briefly reuses successful
 * results. Profile bootstrap is idempotent, so a small cache prevents route
 * remounts from repeatedly exercising the mutation endpoint.
 */
export function createProfileEnsureDeduper<T>({
  ttlMs = 60_000,
  now = Date.now,
}: ProfileEnsureDeduperOptions = {}) {
  const inFlight = new Map<string, Promise<T>>()
  const cache = new Map<string, CachedProfile<T>>()

  return {
    ensure(userId: string, operation: () => Promise<T>): Promise<T> {
      const cached = cache.get(userId)
      if (cached && cached.expiresAt > now()) {
        return Promise.resolve(cached.value)
      }
      if (cached) cache.delete(userId)

      const pending = inFlight.get(userId)
      if (pending) return pending

      const request = Promise.resolve()
        .then(operation)
        .then((value) => {
          cache.set(userId, { value, expiresAt: now() + ttlMs })
          return value
        })
        .finally(() => {
          inFlight.delete(userId)
        })

      inFlight.set(userId, request)
      return request
    },

    clear(userId?: string) {
      if (userId) {
        cache.delete(userId)
        inFlight.delete(userId)
        return
      }

      cache.clear()
      inFlight.clear()
    },
  }
}
