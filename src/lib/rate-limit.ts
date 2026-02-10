import { RATE_LIMIT } from '@/lib/constants'

interface RateLimitConfig {
  interval: number
  maxRequests: number
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  retryAfterMs: number | null
}

interface RateLimiter {
  check: (key: string) => RateLimitResult
  reset: (key: string) => void
}

export function createRateLimiter(config: RateLimitConfig): RateLimiter {
  const { interval, maxRequests } = config
  const requests = new Map<string, number[]>()

  const cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [key, timestamps] of requests.entries()) {
      const valid = timestamps.filter((t) => now - t < interval)
      if (valid.length === 0) {
        requests.delete(key)
      } else {
        requests.set(key, valid)
      }
    }
  }, RATE_LIMIT.CLEANUP_INTERVAL)

  if (typeof cleanupTimer === 'object' && 'unref' in cleanupTimer) {
    cleanupTimer.unref()
  }

  function check(key: string): RateLimitResult {
    const now = Date.now()
    const timestamps = requests.get(key) ?? []
    const windowTimestamps = timestamps.filter((t) => now - t < interval)

    if (windowTimestamps.length >= maxRequests) {
      const oldestInWindow = windowTimestamps[0]
      const retryAfterMs = oldestInWindow + interval - now

      requests.set(key, windowTimestamps)

      return {
        success: false,
        limit: maxRequests,
        remaining: 0,
        retryAfterMs,
      }
    }

    windowTimestamps.push(now)
    requests.set(key, windowTimestamps)

    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - windowTimestamps.length,
      retryAfterMs: null,
    }
  }

  function reset(key: string): void {
    requests.delete(key)
  }

  return { check, reset }
}
