import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

import {
  isMaintenanceEnabled,
  verifyBypassKey,
  MAINTENANCE_BYPASS_COOKIE,
  MAINTENANCE_PATH,
} from '@/lib/maintenance'

// Middleware에서 세션 갱신 + 인증 상태 확인
export async function updateSession(request: NextRequest) {
  // ── 점검 모드 게이트 (Supabase 호출 전에 차단) ──
  if (isMaintenanceEnabled()) {
    const { pathname } = request.nextUrl

    // 점검 페이지 자체는 통과 (무한 리다이렉트 방지)
    if (pathname === MAINTENANCE_PATH) {
      return NextResponse.next({ request })
    }

    // 우회 쿠키가 있으면 관리자 — 기존 로직으로 통과
    if (request.cookies.has(MAINTENANCE_BYPASS_COOKIE)) {
      // 아래 기존 로직으로 fall-through
    } else {
      // ?bypass=<키> 파라미터로 우회 시도
      const bypassParam = request.nextUrl.searchParams.get('bypass')
      if (bypassParam && verifyBypassKey(bypassParam)) {
        // 우회 쿠키 설정 + bypass 파라미터 제거 후 리다이렉트
        const url = request.nextUrl.clone()
        url.searchParams.delete('bypass')
        const response = NextResponse.redirect(url)
        response.cookies.set(MAINTENANCE_BYPASS_COOKIE, '1', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
        })
        return response
      }

      // API 경로는 503 JSON 응답
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Service Unavailable', message: '시스템 점검 중입니다' },
          { status: 503 },
        )
      }

      // 그 외 모든 요청 → 점검 페이지로 리다이렉트
      const url = request.nextUrl.clone()
      url.pathname = MAINTENANCE_PATH
      url.search = ''
      return NextResponse.redirect(url)
    }
  }

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
