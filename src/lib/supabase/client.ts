'use client'

import { createBrowserClient as createClient } from '@supabase/ssr'

import type { Database } from '@/types/database'

// Browser(Client Component)에서 사용하는 Supabase 클라이언트
// 싱글톤으로 관리되어 여러 컴포넌트에서 호출해도 동일 인스턴스 반환
export function createBrowserClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
