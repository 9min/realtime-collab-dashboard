import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'

import { DEMO_USER_ID } from './constants'
import { demoDataStore } from './demo-store'

const DEMO_USER: User = {
  id: DEMO_USER_ID,
  aud: 'authenticated',
  role: 'authenticated',
  email: 'demo@example.com',
  email_confirmed_at: new Date().toISOString(),
  app_metadata: { provider: 'demo', providers: ['demo'] },
  user_metadata: { full_name: '데모 사용자', avatar_url: '' },
  identities: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const DEMO_SESSION: Session = {
  access_token: 'demo-access-token',
  refresh_token: 'demo-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: DEMO_USER,
}

type AuthCallback = (event: AuthChangeEvent, session: Session | null) => void

export function createMockAuth() {
  const listeners: AuthCallback[] = []

  return {
    getUser: async () => ({ data: { user: DEMO_USER }, error: null }),

    getSession: async () => ({ data: { session: DEMO_SESSION }, error: null }),

    signOut: async () => {
      listeners.forEach((cb) => cb('SIGNED_OUT', null))
      return { error: null }
    },

    signInWithOAuth: async () => ({ data: { provider: 'demo' as const, url: '' }, error: null }),

    updateUser: async (attributes: { data?: Record<string, unknown> }) => {
      if (attributes.data) {
        Object.assign(DEMO_USER.user_metadata, attributes.data)
        // 프로필도 동기화
        demoDataStore.updateRows('profiles', [['id', 'eq', DEMO_USER_ID]], {
          full_name: (attributes.data['full_name'] as string) ?? DEMO_USER.user_metadata.full_name,
          avatar_url: (attributes.data['avatar_url'] as string) ?? null,
          updated_at: new Date().toISOString(),
        })
      }
      return { data: { user: DEMO_USER }, error: null }
    },

    onAuthStateChange: (callback: AuthCallback) => {
      listeners.push(callback)
      // 초기 이벤트 발생 (비동기)
      setTimeout(() => callback('INITIAL_SESSION', DEMO_SESSION), 0)
      return {
        data: {
          subscription: {
            id: 'demo-auth-subscription',
            unsubscribe: () => {
              const idx = listeners.indexOf(callback)
              if (idx > -1) listeners.splice(idx, 1)
            },
            callback,
          },
        },
      }
    },

    refreshSession: async () => ({ data: { session: DEMO_SESSION, user: DEMO_USER }, error: null }),
  }
}
