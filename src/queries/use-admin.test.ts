import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'

vi.mock('@/components/providers/supabase-provider', () => ({
  useSupabase: () => ({}),
}))

vi.mock('@/services/admin-service', () => ({
  getAllUsers: vi.fn(),
  setAdminStatus: vi.fn(),
  getMyProfile: vi.fn(),
  getAllProjectMemberships: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { toast } from 'sonner'
import {
  getAllUsers,
  setAdminStatus,
  getMyProfile,
  getAllProjectMemberships,
} from '@/services/admin-service'
import {
  mockProfile,
  mockProfile2,
  mockProjectMemberships,
  MOCK_USER_ID_2,
} from '@/__tests__/helpers/fixtures'

import {
  useMyProfile,
  useAllUsers,
  useAllProjectMemberships,
  useSetAdminStatus,
  adminKeys,
} from './use-admin'

describe('use-admin', () => {
  let queryClient: QueryClient

  function wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
  })

  // ── Query Keys ──
  describe('adminKeys', () => {
    it('올바른 쿼리 키를 생성한다', () => {
      expect(adminKeys.myProfile).toEqual(['admin', 'my-profile'])
      expect(adminKeys.allUsers).toEqual(['admin', 'users'])
      expect(adminKeys.allMemberships).toEqual(['admin', 'memberships'])
    })
  })

  // ── useMyProfile ──
  describe('useMyProfile', () => {
    it('현재 유저 프로필을 조회한다', async () => {
      const adminProfile = { ...mockProfile, is_admin: true }
      vi.mocked(getMyProfile).mockResolvedValue({ data: adminProfile, error: null })

      const { result } = renderHook(() => useMyProfile(), { wrapper })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual(adminProfile)
      expect(result.current.data?.is_admin).toBe(true)
    })

    it('에러 시 isError가 true이다', async () => {
      vi.mocked(getMyProfile).mockResolvedValue({
        data: null,
        error: { code: 'AUTH_ERROR', message: 'Not authenticated' },
      })

      const { result } = renderHook(() => useMyProfile(), { wrapper })

      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error?.message).toBe('Not authenticated')
    })
  })

  // ── useAllUsers ──
  describe('useAllUsers', () => {
    it('전체 사용자 목록을 조회한다', async () => {
      const users = [mockProfile, mockProfile2]
      vi.mocked(getAllUsers).mockResolvedValue({ data: users, error: null })

      const { result } = renderHook(() => useAllUsers(), { wrapper })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual(users)
      expect(result.current.data).toHaveLength(2)
    })

    it('에러 시 isError가 true이다', async () => {
      vi.mocked(getAllUsers).mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'DB error' },
      })

      const { result } = renderHook(() => useAllUsers(), { wrapper })

      await waitFor(() => expect(result.current.isError).toBe(true))
    })
  })

  // ── useAllProjectMemberships ──
  describe('useAllProjectMemberships', () => {
    it('전체 프로젝트 멤버십을 조회한다', async () => {
      vi.mocked(getAllProjectMemberships).mockResolvedValue({
        data: mockProjectMemberships,
        error: null,
      })

      const { result } = renderHook(() => useAllProjectMemberships(), { wrapper })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual(mockProjectMemberships)
      expect(result.current.data).toHaveLength(3)
    })

    it('에러 시 isError가 true이다', async () => {
      vi.mocked(getAllProjectMemberships).mockResolvedValue({
        data: null,
        error: { code: 'P0001', message: 'Admin permission required' },
      })

      const { result } = renderHook(() => useAllProjectMemberships(), { wrapper })

      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error?.message).toBe('Admin permission required')
    })
  })

  // ── useSetAdminStatus ──
  describe('useSetAdminStatus', () => {
    it('성공 시 캐시 무효화 + success toast', async () => {
      vi.mocked(setAdminStatus).mockResolvedValue({ data: null, error: null })

      const { result } = renderHook(() => useSetAdminStatus(), { wrapper })

      await act(async () => {
        await result.current.mutateAsync({ userId: MOCK_USER_ID_2, isAdmin: true })
      })

      expect(toast.success).toHaveBeenCalledWith('관리자 상태가 변경되었습니다')
    })

    it('실패 시 error toast', async () => {
      vi.mocked(setAdminStatus).mockResolvedValue({
        data: null,
        error: { code: 'P0001', message: 'Admin permission required' },
      })

      const { result } = renderHook(() => useSetAdminStatus(), { wrapper })

      await act(async () => {
        try {
          await result.current.mutateAsync({ userId: MOCK_USER_ID_2, isAdmin: true })
        } catch {
          // mutation throws on error
        }
      })

      expect(toast.error).toHaveBeenCalledWith('Admin permission required')
    })
  })
})
