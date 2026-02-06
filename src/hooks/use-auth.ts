'use client'

import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

import { useSupabase } from '@/components/providers/supabase-provider'

interface AuthState {
  user: User | null
  isLoading: boolean
}

export function useAuth() {
  const supabase = useSupabase()
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
  })

  useEffect(() => {
    // 초기 세션 확인
    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthState({ user, isLoading: false })
    })

    // Auth 상태 변경 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthState({ user: session?.user ?? null, isLoading: false })
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return {
    user: authState.user,
    isLoading: authState.isLoading,
    isAuthenticated: authState.user !== null,
    signOut,
  }
}
