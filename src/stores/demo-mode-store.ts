import { create } from 'zustand'

import { DEMO_COOKIE_NAME } from '@/lib/demo/constants'

interface DemoModeState {
  isDemoMode: boolean
  /** 클라이언트에서 쿠키 동기화 완료 여부 */
  hydrated: boolean
  /** 클라이언트 마운트 후 쿠키에서 isDemoMode를 동기화 */
  hydrate: () => void
  enterDemoMode: () => void
  exitDemoMode: () => void
}

function getCookie(name: string): boolean {
  if (typeof document === 'undefined') return false
  return document.cookie.split('; ').some((c) => c.startsWith(`${name}=`))
}

export const useDemoModeStore = create<DemoModeState>((set) => ({
  isDemoMode: false, // SSR-safe: 서버/클라이언트 모두 false로 시작
  hydrated: false,

  hydrate: () => {
    set({ isDemoMode: getCookie(DEMO_COOKIE_NAME), hydrated: true })
  },

  enterDemoMode: () => {
    document.cookie = `${DEMO_COOKIE_NAME}=true; path=/; max-age=${60 * 60 * 24}` // 24시간
    set({ isDemoMode: true })
  },

  exitDemoMode: () => {
    document.cookie = `${DEMO_COOKIE_NAME}=; path=/; max-age=0`
    set({ isDemoMode: false })
  },
}))
