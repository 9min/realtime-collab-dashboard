'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { KanbanSquare, LayoutDashboard, Loader2, Play, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DEMO_PROJECT_ID } from '@/lib/demo/constants'
import { createBrowserClient } from '@/lib/supabase/client'
import { useDemoModeStore } from '@/stores/demo-mode-store'

const ERROR_MESSAGES: Record<string, string> = {
  auth_callback_error: 'OAuth 인증에 실패했습니다. 다시 시도해주세요.',
}

const FEATURES = [
  { icon: LayoutDashboard, label: '대시보드', color: 'text-blue-500 dark:text-blue-400' },
  { icon: KanbanSquare, label: '칸반 보드', color: 'text-violet-500 dark:text-violet-400' },
  { icon: Users, label: '실시간 협업', color: 'text-emerald-500 dark:text-emerald-400' },
] as const

export default function LoginPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const errorCode = searchParams.get('error')
  const errorDetail = searchParams.get('detail')
  const [isLoading, setIsLoading] = useState<'google' | 'kakao' | null>(null)
  const [isDemoLoading, setIsDemoLoading] = useState(false)
  const enterDemoMode = useDemoModeStore((s) => s.enterDemoMode)

  const handleOAuthLogin = async (provider: 'google' | 'kakao') => {
    setIsLoading(provider)
    const supabase = createBrowserClient()

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/callback`,
      },
    })

    if (error) {
      setIsLoading(null)
    }
  }

  const handleDemoMode = () => {
    setIsDemoLoading(true)
    enterDemoMode()
    router.push(`/projects/${DEMO_PROJECT_ID}`)
  }

  return (
    <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 flex flex-col items-center motion-safe:duration-700">
      {/* 타이틀 영역 */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight whitespace-nowrap">
          <span className="bg-gradient-to-r from-blue-600 via-violet-600 to-emerald-500 bg-clip-text text-transparent dark:from-blue-400 dark:via-violet-400 dark:to-emerald-400">
            실시간 협업 일정관리 도구
          </span>
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">소규모 팀을 위한 실시간 협업 대시보드</p>

        {/* 핵심 기능 배지 */}
        <div className="mt-5 flex items-center justify-center gap-3">
          {FEATURES.map(({ icon: Icon, label, color }) => (
            <div
              key={label}
              className="flex items-center gap-1.5 rounded-full border bg-white/60 px-3 py-1.5 text-xs font-medium backdrop-blur-sm dark:bg-slate-800/60"
            >
              <Icon className={`h-3.5 w-3.5 ${color}`} />
              <span className="text-foreground/80">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 로그인 카드 */}
      <Card className="w-full border-slate-200/60 bg-white/70 shadow-xl backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70">
        <CardContent className="flex flex-col gap-3 p-4">
          {errorCode && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 text-center text-sm">
              <p>{ERROR_MESSAGES[errorCode] ?? '알 수 없는 에러가 발생했습니다.'}</p>
              {errorDetail && <p className="mt-1 text-xs opacity-75">{errorDetail}</p>}
            </div>
          )}

          <Button
            variant="outline"
            className="w-full bg-white/50 dark:bg-slate-800/50"
            onClick={() => handleOAuthLogin('google')}
            disabled={isLoading !== null || isDemoLoading}
          >
            {isLoading === 'google' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                리다이렉트 중...
              </>
            ) : (
              <>
                <GoogleIcon className="mr-2 h-5 w-5" />
                Google로 로그인
              </>
            )}
          </Button>

          <Button
            variant="outline"
            className="w-full bg-[#FEE500] text-[#191919] hover:bg-[#FEE500]/90 hover:text-[#191919] dark:bg-[#FEE500]/90 dark:hover:bg-[#FEE500]/80"
            onClick={() => handleOAuthLogin('kakao')}
            disabled={isLoading !== null || isDemoLoading}
          >
            {isLoading === 'kakao' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                리다이렉트 중...
              </>
            ) : (
              <>
                <KakaoIcon className="mr-2 h-5 w-5" />
                Kakao로 로그인
              </>
            )}
          </Button>

          {/* 구분선 */}
          <div className="relative my-1">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="text-muted-foreground bg-white/70 px-2 dark:bg-slate-900/70">
                또는
              </span>
            </div>
          </div>

          {/* 체험하기 버튼 */}
          <Button
            variant="outline"
            className="w-full border-emerald-300 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100/50 hover:text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:bg-emerald-950/50"
            onClick={handleDemoMode}
            disabled={isLoading !== null || isDemoLoading}
          >
            {isDemoLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                준비 중...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                로그인 없이 체험하기
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// Google 아이콘 (인라인 SVG)
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

// Kakao 아이콘 (인라인 SVG - 말풍선 로고)
function KakaoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.72 1.8 5.108 4.516 6.467-.158.573-.57 2.073-.652 2.393-.102.395.145.39.305.284.125-.083 1.994-1.355 2.803-1.905.657.096 1.334.147 2.028.147 5.523 0 10-3.463 10-7.386C22 6.463 17.523 3 12 3z" />
    </svg>
  )
}
