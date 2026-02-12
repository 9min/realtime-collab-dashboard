import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { DEMO_COOKIE_NAME } from '@/lib/demo/constants'
import { createServerClient } from '@/lib/supabase/server'

// 루트 페이지: 인증 상태에 따라 리다이렉트
export default async function HomePage() {
  // 데모 모드 cookie 확인 — auth 체크 없이 바로 /projects로 이동
  const cookieStore = await cookies()
  if (cookieStore.get(DEMO_COOKIE_NAME)) {
    redirect('/projects')
  }

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/projects')
  }

  redirect('/login')
}
