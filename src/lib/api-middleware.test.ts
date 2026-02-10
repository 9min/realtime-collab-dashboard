import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

import { getClientIp, withRateLimit } from '@/lib/api-middleware'

function createMockRequest(options?: { ip?: string; xForwardedFor?: string; xRealIp?: string }): NextRequest {
  const headers = new Headers()
  if (options?.xForwardedFor) {
    headers.set('x-forwarded-for', options.xForwardedFor)
  }
  if (options?.xRealIp) {
    headers.set('x-real-ip', options.xRealIp)
  }

  return new NextRequest('http://localhost/api/test', { headers })
}

describe('getClientIp', () => {
  it('should extract IP from x-forwarded-for header', () => {
    const req = createMockRequest({ xForwardedFor: '192.168.1.1, 10.0.0.1' })
    expect(getClientIp(req)).toBe('192.168.1.1')
  })

  it('should extract IP from x-real-ip header when x-forwarded-for is absent', () => {
    const req = createMockRequest({ xRealIp: '10.0.0.5' })
    expect(getClientIp(req)).toBe('10.0.0.5')
  })

  it('should return anonymous when no IP headers present', () => {
    const req = createMockRequest()
    expect(getClientIp(req)).toBe('anonymous')
  })

  it('should prefer x-forwarded-for over x-real-ip', () => {
    const req = createMockRequest({ xForwardedFor: '192.168.1.1', xRealIp: '10.0.0.5' })
    expect(getClientIp(req)).toBe('192.168.1.1')
  })
})

describe('withRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const mockHandler = vi.fn((_req: NextRequest) => {
    return NextResponse.json({ data: 'ok' })
  })

  it('should pass through requests within limit', async () => {
    const handler = withRateLimit(mockHandler, { maxRequests: 5, interval: 60_000 })
    const req = createMockRequest({ xForwardedFor: '1.2.3.4' })

    const response = await handler(req)

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data).toBe('ok')
  })

  it('should return 429 when limit exceeded', async () => {
    const handler = withRateLimit(mockHandler, { maxRequests: 2, interval: 60_000 })
    const req = createMockRequest({ xForwardedFor: '1.2.3.4' })

    await handler(req)
    await handler(req)
    const response = await handler(req)

    expect(response.status).toBe(429)
    const body = await response.json()
    expect(body.error).toBe('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.')
  })

  it('should include rate limit headers in successful response', async () => {
    const handler = withRateLimit(mockHandler, { maxRequests: 10, interval: 60_000 })
    const req = createMockRequest({ xForwardedFor: '1.2.3.4' })

    const response = await handler(req)

    expect(response.headers.get('X-RateLimit-Limit')).toBe('10')
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('9')
  })

  it('should include Retry-After header in 429 response', async () => {
    const handler = withRateLimit(mockHandler, { maxRequests: 1, interval: 60_000 })
    const req = createMockRequest({ xForwardedFor: '1.2.3.4' })

    await handler(req)
    const response = await handler(req)

    expect(response.status).toBe(429)
    expect(response.headers.get('Retry-After')).toBeTruthy()
    expect(response.headers.get('X-RateLimit-Limit')).toBe('1')
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0')
  })

  it('should use custom options when provided', async () => {
    const handler = withRateLimit(mockHandler, { maxRequests: 3, interval: 30_000 })
    const req = createMockRequest({ xForwardedFor: '1.2.3.4' })

    await handler(req)
    await handler(req)
    await handler(req)

    const blockedResponse = await handler(req)
    expect(blockedResponse.status).toBe(429)

    vi.advanceTimersByTime(30_000)

    const allowedResponse = await handler(req)
    expect(allowedResponse.status).toBe(200)
  })

  it('should track different IPs independently', async () => {
    const handler = withRateLimit(mockHandler, { maxRequests: 1, interval: 60_000 })

    const req1 = createMockRequest({ xForwardedFor: '1.2.3.4' })
    const req2 = createMockRequest({ xForwardedFor: '5.6.7.8' })

    await handler(req1)
    const blocked = await handler(req1)
    expect(blocked.status).toBe(429)

    const allowed = await handler(req2)
    expect(allowed.status).toBe(200)
  })

  it('should decrement remaining header with each request', async () => {
    const handler = withRateLimit(mockHandler, { maxRequests: 3, interval: 60_000 })
    const req = createMockRequest({ xForwardedFor: '1.2.3.4' })

    const r1 = await handler(req)
    expect(r1.headers.get('X-RateLimit-Remaining')).toBe('2')

    const r2 = await handler(req)
    expect(r2.headers.get('X-RateLimit-Remaining')).toBe('1')

    const r3 = await handler(req)
    expect(r3.headers.get('X-RateLimit-Remaining')).toBe('0')
  })
})
