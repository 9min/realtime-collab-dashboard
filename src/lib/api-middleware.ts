import { NextRequest, NextResponse } from 'next/server'

import { RATE_LIMIT } from '@/lib/constants'
import { DEMO_COOKIE_NAME } from '@/lib/demo/constants'
import { createRateLimiter } from '@/lib/rate-limit'

type RouteHandler = (req: NextRequest, context?: unknown) => Promise<NextResponse> | NextResponse

// 데모 모드 요청 차단 — 서버 API는 실제 Supabase를 사용하므로 데모 모드에서 호출 차단
export function isDemoRequest(req: NextRequest): boolean {
  return req.cookies.has(DEMO_COOKIE_NAME)
}

export function demoModeResponse(): NextResponse {
  return NextResponse.json({ error: '데모 모드에서는 지원되지 않는 기능입니다' }, { status: 403 })
}

interface RateLimitOptions {
  interval?: number
  maxRequests?: number
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'anonymous'
  )
}

export function withRateLimit(handler: RouteHandler, options?: RateLimitOptions): RouteHandler {
  const limiter = createRateLimiter({
    interval: options?.interval ?? RATE_LIMIT.DEFAULT_INTERVAL,
    maxRequests: options?.maxRequests ?? RATE_LIMIT.DEFAULT_MAX_REQUESTS,
  })

  return async (req: NextRequest, context?: unknown) => {
    const ip = getClientIp(req)
    const result = limiter.check(ip)

    if (!result.success) {
      const retryAfterSeconds = Math.ceil((result.retryAfterMs ?? 0) / 1000)

      return NextResponse.json(
        { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSeconds),
            'X-RateLimit-Limit': String(result.limit),
            'X-RateLimit-Remaining': '0',
          },
        },
      )
    }

    const response = await handler(req, context)
    response.headers.set('X-RateLimit-Limit', String(result.limit))
    response.headers.set('X-RateLimit-Remaining', String(result.remaining))

    return response
  }
}

export { getClientIp }
