import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 프로덕션에서만 활성화
  enabled: process.env.NODE_ENV === 'production',

  // 성능 모니터링 — 10% 샘플링 (트래픽 증가 시 낮출 것)
  tracesSampleRate: 0.1,

  // 세션 리플레이 — 에러 발생 시 100%, 일반 세션 1%
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration(),
    Sentry.browserTracingIntegration(),
  ],

  // 민감정보 필터링
  beforeSend(event) {
    // 비밀번호, 토큰 등 민감 데이터 제거
    if (event.request?.cookies) {
      delete event.request.cookies
    }
    return event
  },
})
