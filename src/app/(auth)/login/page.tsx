import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '로그인 | Realtime Collab Dashboard',
}

// TODO: F1 Authentication 구현 시 OAuth 로그인 UI 추가
export default function LoginPage() {
  return (
    <div className="flex flex-col items-center gap-6">
      <h1 className="text-2xl font-bold">Realtime Collab Dashboard</h1>
      <p className="text-muted-foreground">소규모 팀을 위한 실시간 협업 대시보드</p>
      <div className="flex w-full flex-col gap-3">
        <button
          type="button"
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 transition-colors"
        >
          GitHub로 로그인
        </button>
        <button
          type="button"
          className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-md px-4 py-2 transition-colors"
        >
          Google로 로그인
        </button>
      </div>
    </div>
  )
}
