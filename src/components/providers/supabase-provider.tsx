'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
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
