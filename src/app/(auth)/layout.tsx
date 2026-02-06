import type { ReactNode } from 'react'

// Auth 레이아웃: 중앙 정렬
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md px-4">{children}</div>
    </div>
  )
}
