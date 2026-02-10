import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createRateLimiter } from '@/lib/rate-limit'

describe('createRateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should allow requests within limit', () => {
    const limiter = createRateLimiter({ interval: 60_000, maxRequests: 5 })

    for (let i = 0; i < 5; i++) {
      const result = limiter.check('user-1')
      expect(result.success).toBe(true)
    }
  })

  it('should reject requests exceeding limit', () => {
    const limiter = createRateLimiter({ interval: 60_000, maxRequests: 3 })

    for (let i = 0; i < 3; i++) {
      limiter.check('user-1')
    }

    const result = limiter.check('user-1')
    expect(result.success).toBe(false)
  })

  it('should return correct remaining count', () => {
    const limiter = createRateLimiter({ interval: 60_000, maxRequests: 5 })

    const r1 = limiter.check('user-1')
    expect(r1.remaining).toBe(4)

    const r2 = limiter.check('user-1')
    expect(r2.remaining).toBe(3)

    const r3 = limiter.check('user-1')
    expect(r3.remaining).toBe(2)
  })

  it('should return limit in every result', () => {
    const limiter = createRateLimiter({ interval: 60_000, maxRequests: 10 })

    const result = limiter.check('user-1')
    expect(result.limit).toBe(10)
  })

  it('should return retryAfterMs when limited', () => {
    const limiter = createRateLimiter({ interval: 60_000, maxRequests: 2 })

    limiter.check('user-1')
    vi.advanceTimersByTime(10_000)
    limiter.check('user-1')

    const result = limiter.check('user-1')
    expect(result.success).toBe(false)
    expect(result.retryAfterMs).toBeGreaterThan(0)
    expect(result.retryAfterMs).toBeLessThanOrEqual(60_000)
  })

  it('should reset after interval expires', () => {
    const limiter = createRateLimiter({ interval: 60_000, maxRequests: 2 })

    limiter.check('user-1')
    limiter.check('user-1')

    const blocked = limiter.check('user-1')
    expect(blocked.success).toBe(false)

    vi.advanceTimersByTime(60_000)

    const allowed = limiter.check('user-1')
    expect(allowed.success).toBe(true)
    expect(allowed.remaining).toBe(1)
  })

  it('should reset specific key', () => {
    const limiter = createRateLimiter({ interval: 60_000, maxRequests: 2 })

    limiter.check('user-1')
    limiter.check('user-1')

    const blocked = limiter.check('user-1')
    expect(blocked.success).toBe(false)

    limiter.reset('user-1')

    const allowed = limiter.check('user-1')
    expect(allowed.success).toBe(true)
    expect(allowed.remaining).toBe(1)
  })

  it('should track concurrent keys independently', () => {
    const limiter = createRateLimiter({ interval: 60_000, maxRequests: 2 })

    limiter.check('user-1')
    limiter.check('user-1')

    const blockedUser1 = limiter.check('user-1')
    expect(blockedUser1.success).toBe(false)

    const allowedUser2 = limiter.check('user-2')
    expect(allowedUser2.success).toBe(true)
    expect(allowedUser2.remaining).toBe(1)
  })

  it('should handle boundary condition: exactly at max requests', () => {
    const limiter = createRateLimiter({ interval: 60_000, maxRequests: 3 })

    const r1 = limiter.check('user-1')
    expect(r1.success).toBe(true)
    expect(r1.remaining).toBe(2)

    const r2 = limiter.check('user-1')
    expect(r2.success).toBe(true)
    expect(r2.remaining).toBe(1)

    const r3 = limiter.check('user-1')
    expect(r3.success).toBe(true)
    expect(r3.remaining).toBe(0)

    const r4 = limiter.check('user-1')
    expect(r4.success).toBe(false)
    expect(r4.remaining).toBe(0)
  })

  it('should slide the window as time progresses', () => {
    const limiter = createRateLimiter({ interval: 60_000, maxRequests: 2 })

    limiter.check('user-1')
    vi.advanceTimersByTime(30_000)
    limiter.check('user-1')

    const blocked = limiter.check('user-1')
    expect(blocked.success).toBe(false)

    vi.advanceTimersByTime(30_000)

    const allowed = limiter.check('user-1')
    expect(allowed.success).toBe(true)
  })

  it('should return null retryAfterMs when not limited', () => {
    const limiter = createRateLimiter({ interval: 60_000, maxRequests: 5 })

    const result = limiter.check('user-1')
    expect(result.retryAfterMs).toBeNull()
  })

  it('should not affect other keys when resetting one key', () => {
    const limiter = createRateLimiter({ interval: 60_000, maxRequests: 2 })

    limiter.check('user-1')
    limiter.check('user-2')
    limiter.check('user-2')

    limiter.reset('user-1')

    const blockedUser2 = limiter.check('user-2')
    expect(blockedUser2.success).toBe(false)

    const allowedUser1 = limiter.check('user-1')
    expect(allowedUser1.success).toBe(true)
    expect(allowedUser1.remaining).toBe(1)
  })
})
