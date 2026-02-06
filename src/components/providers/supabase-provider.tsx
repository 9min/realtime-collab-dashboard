'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

import { createBrowserClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type SupabaseContext = {
  supabase: SupabaseClient<Database>
}

const Context = createContext<SupabaseContext | undefined>(undefined)

interface SupabaseProviderProps {
  children: ReactNode
}

export function SupabaseProvider({ children }: SupabaseProviderProps) {
  const supabase = useMemo(() => createBrowserClient(), [])
  const [isReady, setIsReady] = useState(false)

  // 브라우저 클라이언트 세션 초기화 보장
  // getSession()으로 쿠키에서 JWT를 읽어 내부 auth 상태를 설정한 뒤
  // children을 렌더링하여 DB 요청 시 auth.uid()가 정상 동작하도록 함
  useEffect(() => {
    supabase.auth.getSession().then(() => {
      setIsReady(true)
    })
  }, [supabase])

  if (!isReady) {
    return null
  }

  return <Context.Provider value={{ supabase }}>{children}</Context.Provider>
}

// Supabase 클라이언트 접근 훅
export function useSupabase() {
  const context = useContext(Context)
  if (!context) {
    throw new Error('useSupabase는 SupabaseProvider 내에서 사용해야 합니다')
  }
  return context.supabase
}
