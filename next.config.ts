import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'
import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
}

export default withSentryConfig(withBundleAnalyzer(nextConfig), {
  // Sentry 빌드 옵션
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // 소스맵 업로드 — 프로덕션 빌드에서만
  silent: !process.env.CI,

  // 번들 크기 최적화
  widenClientFileUpload: true,
  disableLogger: true,

  // 소스맵 설정
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
})
