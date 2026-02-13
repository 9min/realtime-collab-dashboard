'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'

// Route Error Boundary (Layer 2)
// 프로젝트 페이지 내 에러를 캐치하여 대시보드로 복귀 가능하게 함
export default function ProjectError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    // TODO: 에러 리포팅 서비스 연동
  }, [error])

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="space-y-4 text-center">
        <h2 className="text-xl font-bold">프로젝트를 불러올 수 없습니다</h2>
        <p className="text-muted-foreground max-w-md">
          {error.message || '프로젝트 데이터를 가져오는 중 오류가 발생했습니다.'}
        </p>
        <div className="flex justify-center gap-3">
          <Button onClick={reset}>다시 시도</Button>
          <Button variant="outline" onClick={() => router.push('/projects')}>
            프로젝트 목록으로
          </Button>
        </div>
      </div>
    </div>
  )
}
