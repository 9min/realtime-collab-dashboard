import { describe, it, expect, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database'
import { createMockSupabaseClient } from '@/__tests__/helpers/mock-supabase'
import { MOCK_USER_ID, mockProfile } from '@/__tests__/helpers/fixtures'

import {
  signInWithOAuth,
  exchangeCodeForSession,
  signOut,
  getProfile,
  updateProfile,
  uploadAvatar,
  deleteAvatar,
  updateProfileWithAuth,
} from './auth-service'

type Client = SupabaseClient<Database>

describe('auth-service', () => {
  // ── signInWithOAuth ──
  describe('signInWithOAuth', () => {
    it('GitHub OAuth URL을 반환한다', async () => {
      const authUrl = 'https://supabase.auth/github'
      const client = createMockSupabaseClient({}) as Client
      ;(client as unknown as { auth: { signInWithOAuth: ReturnType<typeof vi.fn> } }).auth.signInWithOAuth =
        vi.fn().mockResolvedValue({ data: { url: authUrl }, error: null })

      const result = await signInWithOAuth(client, 'github', 'http://localhost:3000/callback')

      expect(result.error).toBeNull()
      expect(result.data?.url).toBe(authUrl)
    })

    it('Google OAuth URL을 반환한다', async () => {
      const authUrl = 'https://supabase.auth/google'
      const client = createMockSupabaseClient({}) as Client
      ;(client as unknown as { auth: { signInWithOAuth: ReturnType<typeof vi.fn> } }).auth.signInWithOAuth =
        vi.fn().mockResolvedValue({ data: { url: authUrl }, error: null })

      const result = await signInWithOAuth(client, 'google', 'http://localhost:3000/callback')

      expect(result.error).toBeNull()
      expect(result.data?.url).toBe(authUrl)
    })

    it('에러 시 AUTH_ERROR를 반환한다', async () => {
      const client = createMockSupabaseClient({}) as Client
      ;(client as unknown as { auth: { signInWithOAuth: ReturnType<typeof vi.fn> } }).auth.signInWithOAuth =
        vi.fn().mockResolvedValue({ data: null, error: { message: 'Provider error' } })

      const result = await signInWithOAuth(client, 'github', 'http://localhost:3000/callback')

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('AUTH_ERROR')
    })
  })

  // ── exchangeCodeForSession ──
  describe('exchangeCodeForSession', () => {
    it('코드를 세션으로 교환한다', async () => {
      const client = createMockSupabaseClient({}) as Client

      const result = await exchangeCodeForSession(client, 'auth-code-123')

      expect(result.error).toBeNull()
    })

    it('에러 시 AUTH_CALLBACK_ERROR를 반환한다', async () => {
      const client = createMockSupabaseClient({}) as Client
      ;(client as unknown as { auth: { exchangeCodeForSession: ReturnType<typeof vi.fn> } }).auth.exchangeCodeForSession =
        vi.fn().mockResolvedValue({ error: { message: 'Invalid code' } })

      const result = await exchangeCodeForSession(client, 'invalid-code')

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('AUTH_CALLBACK_ERROR')
    })
  })

  // ── signOut ──
  describe('signOut', () => {
    it('로그아웃 성공을 반환한다', async () => {
      const client = createMockSupabaseClient({}) as Client

      const result = await signOut(client)

      expect(result.error).toBeNull()
    })

    it('에러 시 SIGNOUT_ERROR를 반환한다', async () => {
      const client = createMockSupabaseClient({}) as Client
      ;(client as unknown as { auth: { signOut: ReturnType<typeof vi.fn> } }).auth.signOut =
        vi.fn().mockResolvedValue({ error: { message: 'Session expired' } })

      const result = await signOut(client)

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('SIGNOUT_ERROR')
    })
  })

  // ── getProfile ──
  describe('getProfile', () => {
    it('프로필을 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: mockProfile, error: null }],
      }) as Client

      const result = await getProfile(client, MOCK_USER_ID)

      expect(result.error).toBeNull()
      expect(result.data).toEqual(mockProfile)
    })

    it('존재하지 않는 유저 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'PGRST116', message: 'Not found' } }],
      }) as Client

      const result = await getProfile(client, 'nonexistent')

      expect(result.data).toBeNull()
      expect(result.error).not.toBeNull()
    })

    it('data가 null이면 UNKNOWN 에러를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: null }],
      }) as Client

      const result = await getProfile(client, MOCK_USER_ID)

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('UNKNOWN')
    })
  })

  // ── updateProfile ──
  describe('updateProfile', () => {
    it('프로필을 수정하고 반환한다', async () => {
      const updated = { ...mockProfile, full_name: 'New Name' }
      const client = createMockSupabaseClient({
        fromResponses: [{ data: updated, error: null }],
      }) as Client

      const result = await updateProfile(client, MOCK_USER_ID, {
        full_name: 'New Name',
        avatar_url: null,
      })

      expect(result.error).toBeNull()
      expect(result.data?.full_name).toBe('New Name')
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'PGRST204', message: 'Not found' } }],
      }) as Client

      const result = await updateProfile(client, 'nonexistent', {
        full_name: 'X',
        avatar_url: null,
      })

      expect(result.data).toBeNull()
      expect(result.error).not.toBeNull()
    })
  })

  // ── uploadAvatar ──
  describe('uploadAvatar', () => {
    it('파일을 업로드하고 public URL을 반환한다', async () => {
      const publicUrl = 'https://example.com/storage/v1/object/public/avatars/user-aaa-111/123.png'
      const client = createMockSupabaseClient({
        storage: { publicUrl },
      }) as Client
      const file = new File(['data'], 'photo.png', { type: 'image/png' })

      const result = await uploadAvatar(client, MOCK_USER_ID, file)

      expect(result.error).toBeNull()
      expect(result.data).toBe(publicUrl)
    })

    it('업로드 에러 시 UPLOAD_ERROR를 반환한다', async () => {
      const client = createMockSupabaseClient({
        storage: { uploadResponse: { data: null, error: { message: 'Storage full' } } },
      }) as Client
      const file = new File(['data'], 'photo.png', { type: 'image/png' })

      const result = await uploadAvatar(client, MOCK_USER_ID, file)

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('UPLOAD_ERROR')
    })
  })

  // ── deleteAvatar ──
  describe('deleteAvatar', () => {
    it('올바른 URL에서 파일을 삭제한다', async () => {
      const client = createMockSupabaseClient({}) as Client
      const url = 'https://example.com/storage/v1/object/public/avatars/user-aaa-111/123.png'

      const result = await deleteAvatar(client, url)

      expect(result.error).toBeNull()
    })

    it('잘못된 URL이면 INVALID_URL 에러를 반환한다', async () => {
      const client = createMockSupabaseClient({}) as Client

      const result = await deleteAvatar(client, 'https://example.com/wrong-url')

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('INVALID_URL')
    })

    it('storage 삭제 에러 시 DELETE_ERROR를 반환한다', async () => {
      const client = createMockSupabaseClient({
        storage: { removeResponse: { data: null, error: { message: 'Not found' } } },
      }) as Client
      const url = 'https://example.com/storage/v1/object/public/avatars/user-aaa-111/123.png'

      const result = await deleteAvatar(client, url)

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('DELETE_ERROR')
    })
  })

  // ── updateProfileWithAuth ──
  describe('updateProfileWithAuth', () => {
    it('profiles 테이블과 auth.user_metadata를 동시에 업데이트한다', async () => {
      const updated = { ...mockProfile, full_name: 'New Name' }
      const client = createMockSupabaseClient({
        fromResponses: [{ data: updated, error: null }],
      }) as Client

      const result = await updateProfileWithAuth(client, MOCK_USER_ID, {
        full_name: 'New Name',
        avatar_url: null,
      })

      expect(result.error).toBeNull()
      expect(result.data?.full_name).toBe('New Name')
      expect(
        (client as unknown as { auth: { updateUser: ReturnType<typeof vi.fn> } }).auth.updateUser,
      ).toHaveBeenCalledWith({
        data: { full_name: 'New Name', avatar_url: null },
      })
    })

    it('profiles 업데이트 실패 시 auth.updateUser를 호출하지 않는다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'PGRST204', message: 'Not found' } }],
      }) as Client

      const result = await updateProfileWithAuth(client, 'nonexistent', {
        full_name: 'X',
        avatar_url: null,
      })

      expect(result.data).toBeNull()
      expect(result.error).not.toBeNull()
      expect(
        (client as unknown as { auth: { updateUser: ReturnType<typeof vi.fn> } }).auth.updateUser,
      ).not.toHaveBeenCalled()
    })

    it('auth.updateUser 실패 시 AUTH_UPDATE_ERROR를 반환한다', async () => {
      const updated = { ...mockProfile, full_name: 'New Name' }
      const client = createMockSupabaseClient({
        fromResponses: [{ data: updated, error: null }],
        updateUserResponse: { data: null, error: { message: 'Auth error' } },
      }) as Client

      const result = await updateProfileWithAuth(client, MOCK_USER_ID, {
        full_name: 'New Name',
        avatar_url: null,
      })

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('AUTH_UPDATE_ERROR')
    })
  })
})
