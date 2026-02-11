import type { ReactNode } from 'react'

import { ThemeToggle } from '@/components/layout/theme-toggle'
import { NetworkCanvas } from '@/components/auth/network-canvas'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Connected Nodes 배경 애니메이션 */}
      <div className="pointer-events-none absolute inset-0">
        <NetworkCanvas />
      </div>

      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-auto px-4">
        {children}
      </div>
    </div>
  )
}
