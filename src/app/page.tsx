import { redirect } from 'next/navigation'

import { createServerClient } from '@/lib/supabase/server'

// 루트 페이지: 인증 상태에 따라 리다이렉트
export default async function HomePage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/projects')
  }

  redirect('/login')
}
