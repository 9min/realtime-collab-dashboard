import type { Metadata } from 'next'

import { getMaintenanceConfig } from '@/lib/maintenance'

export const metadata: Metadata = {
  title: '시스템 점검 중 | 실시간 협업 일정관리 도구',
  description: '현재 시스템 점검 중입니다. 잠시 후 다시 접속해 주세요.',
}

/**
 * 공사장 경고 줄무늬 테이프 (노란-검정 대각선 패턴)
 * 인라인 SVG 패턴으로 외부 의존성 없이 구현
 */
function CautionStripe() {
  return (
    <div className="h-3 w-full" aria-hidden="true">
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        <defs>
          <pattern id="caution" width="24" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
            <rect width="12" height="12" fill="#EAB308" />
            <rect x="12" width="12" height="12" fill="#1e293b" className="dark:fill-black" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#caution)" />
      </svg>
    </div>
  )
}

// Next.js App Router 규약: page.tsx는 default export 필수
export default function MaintenancePage() {
  const { message, until } = getMaintenanceConfig()

  const formattedUntil = until
    ? formatMaintenanceUntil(until) ?? until
    : null

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* 상단 경고 테이프 */}
      <CautionStripe />

      {/* 메인 콘텐츠 */}
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="mx-auto max-w-lg text-center">
          {/* 아이콘 영역 — 삼각형 경고 스타일 */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-yellow-500/10 dark:bg-yellow-400/10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-yellow-600 dark:text-yellow-400"
              aria-hidden="true"
            >
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </div>

          {/* 텍스트 영역 */}
          <h1 className="mt-8 text-3xl font-bold tracking-tight text-foreground">
            시스템 점검 중입니다
          </h1>

          <p className="mx-auto mt-4 max-w-sm text-base leading-relaxed text-muted-foreground whitespace-pre-line">
            {message}
          </p>

          {/* 복구 시간 카드 */}
          {formattedUntil && (
            <div className="mx-auto mt-8 max-w-xs rounded-xl border border-yellow-300 bg-yellow-50 px-6 py-4 dark:border-yellow-500/30 dark:bg-yellow-500/5">
              <p className="text-xs font-medium tracking-wide text-yellow-700 uppercase dark:text-yellow-400">
                예상 복구 시간
              </p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {formattedUntil}
              </p>
            </div>
          )}

          {/* 상태 표시 */}
          <div className="mt-10 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-500/60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-yellow-500" />
            </span>
            점검 진행 중
          </div>
        </div>
      </div>

      {/* 하단 경고 테이프 */}
      <CautionStripe />
    </div>
  )
}

function formatMaintenanceUntil(isoString: string): string | null {
  try {
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return null
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  } catch {
    return null
  }
}
