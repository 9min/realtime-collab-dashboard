import { describe, it, expect } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database'
import { createMockSupabaseClient } from '@/__tests__/helpers/mock-supabase'
import { mockProfile, mockProfile2, MOCK_USER_ID, MOCK_USER_ID_2 } from '@/__tests__/helpers/fixtures'

import { getAllUsers, setAdminStatus, getMyProfile } from './admin-service'

type Client = SupabaseClient<Database>

describe('admin-service', () => {
  describe('getAllUsers', () => {
    it('전체 사용자 목록을 반환한다', async () => {
      const users = [mockProfile, mockProfile2]
      const client = createMockSupabaseClient({
        fromResponses: [{ data: users, error: null }],
      }) as Client

      const result = await getAllUsers(client)

      expect(result.error).toBeNull()
      expect(result.data).toEqual(users)
    })

    it('에러 시 ServiceResult error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'PGRST116', message: 'DB error' } }],
      }) as Client

      const result = await getAllUsers(client)

      expect(result.data).toBeNull()
      expect(result.error).toEqual({ code: 'PGRST116', message: 'DB error' })
    })
  })

  describe('setAdminStatus', () => {
    it('성공 시 error가 null이다', async () => {
      const client = createMockSupabaseClient({
        rpcResponse: { data: null, error: null },
      }) as Client

      const result = await setAdminStatus(client, MOCK_USER_ID_2, true)

      expect(result.error).toBeNull()
      expect(client.rpc).toHaveBeenCalledWith('set_admin_status', {
        p_user_id: MOCK_USER_ID_2,
        p_is_admin: true,
      })
    })

    it('admin이 아닌 유저가 호출하면 에러를 반환한다', async () => {
      const client = createMockSupabaseClient({
        rpcResponse: { data: null, error: { code: 'P0001', message: 'Admin permission required' } },
      }) as Client

      const result = await setAdminStatus(client, MOCK_USER_ID_2, true)

      expect(result.data).toBeNull()
      expect(result.error).toEqual({ code: 'P0001', message: 'Admin permission required' })
    })

    it('자기 자신의 admin 해제 시 에러를 반환한다', async () => {
      const client = createMockSupabaseClient({
        rpcResponse: { data: null, error: { code: 'P0001', message: 'Cannot remove own admin status' } },
      }) as Client

      const result = await setAdminStatus(client, MOCK_USER_ID, false)

      expect(result.data).toBeNull()
      expect(result.error?.message).toBe('Cannot remove own admin status')
    })
  })

  describe('getMyProfile', () => {
    it('현재 유저의 프로필을 반환한다', async () => {
      const adminProfile = { ...mockProfile, is_admin: true }
      const client = createMockSupabaseClient({
        authUser: { id: MOCK_USER_ID, email: 'test@example.com' },
        fromResponses: [{ data: adminProfile, error: null }],
      }) as Client

      const result = await getMyProfile(client)

      expect(result.error).toBeNull()
      expect(result.data).toEqual(adminProfile)
      expect(result.data?.is_admin).toBe(true)
    })

    it('미인증 시 AUTH_ERROR를 반환한다', async () => {
      const client = createMockSupabaseClient({
        authUser: null,
      }) as Client
      // auth.getUser가 user: null을 반환하도록 설정됨

      const result = await getMyProfile(client)

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('AUTH_ERROR')
    })

    it('프로필 조회 실패 시 에러를 반환한다', async () => {
      const client = createMockSupabaseClient({
        authUser: { id: MOCK_USER_ID, email: 'test@example.com' },
        fromResponses: [{ data: null, error: { code: 'PGRST116', message: 'not found' } }],
      }) as Client

      const result = await getMyProfile(client)

      expect(result.data).toBeNull()
      expect(result.error).toEqual({ code: 'PGRST116', message: 'not found' })
    })
  })
})
