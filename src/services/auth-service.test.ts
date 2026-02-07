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
})
