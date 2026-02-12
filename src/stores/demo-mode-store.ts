import { create } from 'zustand'

import { DEMO_COOKIE_NAME } from '@/lib/demo/constants'

interface DemoModeState {
  isDemoMode: boolean
  enterDemoMode: () => void
  exitDemoMode: () => void
}

function getCookie(name: string): boolean {
  if (typeof document === 'undefined') return false
  return document.cookie.split('; ').some((c) => c.startsWith(`${name}=`))
}

export const useDemoModeStore = create<DemoModeState>((set) => ({
  isDemoMode: getCookie(DEMO_COOKIE_NAME),

  enterDemoMode: () => {
    document.cookie = `${DEMO_COOKIE_NAME}=true; path=/; max-age=${60 * 60 * 24}` // 24시간
    set({ isDemoMode: true })
  },

  exitDemoMode: () => {
    document.cookie = `${DEMO_COOKIE_NAME}=; path=/; max-age=0`
    set({ isDemoMode: false })
  },
}))
