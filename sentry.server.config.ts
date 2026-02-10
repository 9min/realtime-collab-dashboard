import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  enabled: process.env.NODE_ENV === 'production',

  // 서버 트레이스 — 5% 샘플링
  tracesSampleRate: 0.05,
})
