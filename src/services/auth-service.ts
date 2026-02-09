import type { SupabaseClient } from '@supabase/supabase-js'

import { AVATAR } from '@/lib/constants'
import type { ServiceResult } from '@/types/common'
import type { Database, Tables } from '@/types/database'

type Client = SupabaseClient<Database>
type Profile = Tables<'profiles'>

// OAuth 로그인 (GitHub / Google / Kakao)
export async function signInWithOAuth(
  supabase: Client,
  provider: 'github' | 'google' | 'kakao',
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

// 아바타 업로드
export async function uploadAvatar(
  supabase: Client,
  userId: string,
  file: File,
): Promise<ServiceResult<string>> {
  const ext = file.name.split('.').pop() ?? 'png'
  const filePath = `${userId}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(AVATAR.BUCKET_NAME)
    .upload(filePath, file, { upsert: true })

  if (uploadError) {
    return { data: null, error: { code: 'UPLOAD_ERROR', message: uploadError.message } }
  }

  const { data: urlData } = supabase.storage
    .from(AVATAR.BUCKET_NAME)
    .getPublicUrl(filePath)

  return { data: urlData.publicUrl, error: null }
}

// 아바타 삭제
export async function deleteAvatar(
  supabase: Client,
  avatarUrl: string,
): Promise<ServiceResult<null>> {
  const bucketPrefix = `/storage/v1/object/public/${AVATAR.BUCKET_NAME}/`
  const idx = avatarUrl.indexOf(bucketPrefix)
  if (idx === -1) {
    return { data: null, error: { code: 'INVALID_URL', message: '올바르지 않은 아바타 URL입니다' } }
  }
  const filePath = avatarUrl.slice(idx + bucketPrefix.length)

  const { error } = await supabase.storage
    .from(AVATAR.BUCKET_NAME)
    .remove([filePath])

  if (error) {
    return { data: null, error: { code: 'DELETE_ERROR', message: error.message } }
  }

  return { data: null, error: null }
}

// 계정 삭제 (서버 API 호출)
export async function deleteAccount(): Promise<ServiceResult<null>> {
  const res = await fetch('/api/auth/delete-account', { method: 'POST' })

  if (!res.ok) {
    const body = await res.json()
    return {
      data: null,
      error: { code: 'DELETE_ACCOUNT_ERROR', message: body.error ?? '계정 삭제 실패' },
    }
  }

  return { data: null, error: null }
}

// 프로필 + auth.user_metadata 동시 수정
export async function updateProfileWithAuth(
  supabase: Client,
  userId: string,
  input: Pick<Profile, 'full_name' | 'avatar_url'>,
): Promise<ServiceResult<Profile>> {
  const profileResult = await updateProfile(supabase, userId, input)
  if (profileResult.error) return profileResult

  // auth.users의 user_metadata도 업데이트 (헤더 즉시 반영용)
  const { error: authError } = await supabase.auth.updateUser({
    data: { full_name: input.full_name, avatar_url: input.avatar_url },
  })

  if (authError) {
    return { data: null, error: { code: 'AUTH_UPDATE_ERROR', message: authError.message } }
  }

  return profileResult
}
