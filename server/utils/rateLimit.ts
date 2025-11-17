type RateLimitKey = string

interface RateLimitConfig {
  windowMs: number
  max: number
}

interface RateLimitEntry {
  count: number
  expiresAt: number
}

const store = new Map<RateLimitKey, RateLimitEntry>()

function cleanupExpired(now: number) {
  for (const [key, entry] of store) {
    if (entry.expiresAt <= now) {
      store.delete(key)
    }
  }
}

export function rateLimit(key: RateLimitKey, config: RateLimitConfig) {
  const now = Date.now()
  cleanupExpired(now)

  const existing = store.get(key)
  if (existing && existing.expiresAt > now) {
    if (existing.count >= config.max) {
      return {
        allowed: false,
        retryAfter: Math.max(0, Math.ceil((existing.expiresAt - now) / 1000)),
      }
    }

    existing.count += 1
    store.set(key, existing)
    return { allowed: true }
  }

  store.set(key, {
    count: 1,
    expiresAt: now + config.windowMs,
  })

  return { allowed: true }
}