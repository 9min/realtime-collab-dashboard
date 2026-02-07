'use client'

import { useEffect } from 'react'

import { Button } from '@/components/ui/button'

// Global Error Boundary (Layer 1)
// 예상치 못한 에러를 최상위에서 캐치하여 흰 화면 방지
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // TODO: 에러 리포팅 서비스 연동 (Sentry 등)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">문제가 발생했습니다</h2>
        <p className="text-muted-foreground max-w-md">
          예상치 못한 오류가 발생했습니다. 다시 시도하거나, 문제가 지속되면 새로고침해주세요.
        </p>
        {error.digest && (
          <p className="text-muted-foreground text-xs">Error ID: {error.digest}</p>
        )}
        <div className="flex justify-center gap-3">
          <Button onClick={reset}>다시 시도</Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            새로고침
          </Button>
        </div>
      </div>
    </div>
  )
}
