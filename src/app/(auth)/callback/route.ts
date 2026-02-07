import { NextResponse } from 'next/server'

import { createServerClient } from '@/lib/supabase/server'

// OAuth 콜백 핸들러: code → session 교환
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const errorParam = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const next = searchParams.get('next') ?? '/projects'

  // OAuth provider가 에러를 반환한 경우 (예: access_denied)
  if (errorParam) {
    const desc = encodeURIComponent(errorDescription ?? errorParam)
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error&detail=${desc}`)
  }

  if (code) {
    const supabase = await createServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }

    const detail = encodeURIComponent(error.message)
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error&detail=${detail}`)
  }

  // code도 error도 없는 경우
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
