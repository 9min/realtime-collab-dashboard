import type { SupabaseClient } from '@supabase/supabase-js'

import type { ServiceResult } from '@/types/common'
import type { Database, Tables } from '@/types/database'

type Client = SupabaseClient<Database>
type Profile = Tables<'profiles'>

// OAuth 로그인 (GitHub / Google)
export async function signInWithOAuth(
  supabase: Client,
  provider: 'github' | 'google',
  redirectTo: string,
): Promise<ServiceResult<{ url: string }>> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo },
  })

  if (error) {
    return { data: null, error: { code: 'AUTH_ERROR', message: error.message } }
  }

  return { data: { url: data.url }, error: null }
}

// OAuth 콜백 코드 → 세션 교환
export async function exchangeCodeForSession(
  supabase: Client,
  code: string,
): Promise<ServiceResult<null>> {
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return { data: null, error: { code: 'AUTH_CALLBACK_ERROR', message: error.message } }
  }

  return { data: null, error: null }
}

// 로그아웃
export async function signOut(supabase: Client): Promise<ServiceResult<null>> {
  const { error } = await supabase.auth.signOut()

  if (error) {
    return { data: null, error: { code: 'SIGNOUT_ERROR', message: error.message } }
  }

  return { data: null, error: null }
}

// 현재 유저 프로필 조회
export async function getProfile(
  supabase: Client,
  userId: string,
): Promise<ServiceResult<Profile>> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .returns<Profile[]>()
    .single()

  if (error || !data) {
    return {
      data: null,
      error: { code: error?.code ?? 'UNKNOWN', message: error?.message ?? '프로필 조회 실패' },
    }
  }

  return { data, error: null }
}

// 프로필 수정
export async function updateProfile(
  supabase: Client,
  userId: string,
  input: Pick<Profile, 'full_name' | 'avatar_url'>,
): Promise<ServiceResult<Profile>> {
  const { data, error } = await supabase
    .from('profiles')
    .update(input)
    .eq('id', userId)
    .select('*')
    .returns<Profile[]>()
    .single()

  if (error || !data) {
    return {
      data: null,
      error: { code: error?.code ?? 'UNKNOWN', message: error?.message ?? '프로필 수정 실패' },
    }
  }

  return { data, error: null }
}
