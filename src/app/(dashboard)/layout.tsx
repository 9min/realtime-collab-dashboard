import type { ReactNode } from 'react'

// Dashboard 레이아웃: 사이드바 + 메인 콘텐츠
// TODO: Sidebar, Header 컴포넌트 구현 후 연결
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* TODO: <Sidebar /> */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
