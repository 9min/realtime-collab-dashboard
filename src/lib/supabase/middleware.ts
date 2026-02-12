import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

// Middleware에서 세션 갱신 + 인증 상태 확인
export async function updateSession(request: NextRequest) {
  // 데모 모드: cookie가 있으면 auth 체크 없이 통과
  const isDemoMode = request.cookies.has('demo_mode')
  if (isDemoMode) {
    const isAuthRoute = request.nextUrl.pathname.startsWith('/login')
    if (isAuthRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/projects'
      return NextResponse.redirect(url)
    }
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    },
  )

  // 세션 갱신 (만료된 토큰 자동 리프레시)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 인증되지 않은 사용자가 보호된 경로 접근 시 리다이렉트
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login')
  const isCallbackRoute = request.nextUrl.pathname.startsWith('/callback')
  const isPublicRoute = isAuthRoute || isCallbackRoute || request.nextUrl.pathname === '/'

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 로그인된 사용자가 로그인 페이지 접근 시 대시보드로 리다이렉트
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/projects'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
