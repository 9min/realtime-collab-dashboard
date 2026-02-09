import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'

vi.mock('@/components/providers/supabase-provider', () => ({
  useSupabase: () => ({}),
}))

const mockSignOut = vi.fn()
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ user: { id: 'user-aaa-111', email: 'test@example.com' }, signOut: mockSignOut }),
}))

vi.mock('@/services/auth-service', () => ({
  getProfile: vi.fn(),
  updateProfileWithAuth: vi.fn(),
  uploadAvatar: vi.fn(),
  deleteAvatar: vi.fn(),
  deleteAccount: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

import { toast } from 'sonner'
import { getProfile, updateProfileWithAuth, uploadAvatar, deleteAvatar, deleteAccount } from '@/services/auth-service'
import { mockProfile } from '@/__tests__/helpers/fixtures'
import { useProfile, useUpdateProfile, useUploadAvatar, useDeleteAvatar, useDeleteAccount, profileKeys } from './use-profile'

describe('use-profile', () => {
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

  // ── profileKeys ──
  describe('profileKeys', () => {
    it('올바른 쿼리 키를 생성한다', () => {
      expect(profileKeys.all).toEqual(['profile'])
      expect(profileKeys.detail('uid')).toEqual(['profile', 'uid'])
    })
  })

  // ── useProfile ──
  describe('useProfile', () => {
    it('프로필을 조회한다', async () => {
      vi.mocked(getProfile).mockResolvedValue({ data: mockProfile, error: null })

      const { result } = renderHook(() => useProfile(), { wrapper })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockProfile)
    })

    it('서비스 에러 시 error 상태가 된다', async () => {
      vi.mocked(getProfile).mockResolvedValue({
        data: null,
        error: { code: 'ERR', message: '프로필 조회 실패' },
      })

      const { result } = renderHook(() => useProfile(), { wrapper })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error?.message).toBe('프로필 조회 실패')
    })
  })

  // ── useUpdateProfile ──
  describe('useUpdateProfile', () => {
    it('프로필 수정 성공 시 캐시 무효화 + toast', async () => {
      const updated = { ...mockProfile, full_name: 'New Name' }
      vi.mocked(updateProfileWithAuth).mockResolvedValue({ data: updated, error: null })
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useUpdateProfile(), { wrapper })

      await act(async () => {
        await result.current.mutateAsync({ full_name: 'New Name', avatar_url: null })
      })

      expect(toast.success).toHaveBeenCalledWith('프로필이 수정되었습니다')
      expect(invalidateSpy).toHaveBeenCalled()
    })

    it('프로필 수정 실패 시 error toast', async () => {
      vi.mocked(updateProfileWithAuth).mockResolvedValue({
        data: null,
        error: { code: 'ERR', message: 'fail' },
      })

      const { result } = renderHook(() => useUpdateProfile(), { wrapper })

      await act(async () => {
        try {
          await result.current.mutateAsync({ full_name: 'X', avatar_url: null })
        } catch {
          // expected
        }
      })

      expect(toast.error).toHaveBeenCalledWith('프로필 수정에 실패했습니다')
    })
  })

  // ── useUploadAvatar ──
  describe('useUploadAvatar', () => {
    it('아바타 업로드 성공 시 URL을 반환한다', async () => {
      const publicUrl = 'https://example.com/avatars/test.png'
      vi.mocked(uploadAvatar).mockResolvedValue({ data: publicUrl, error: null })

      const { result } = renderHook(() => useUploadAvatar(), { wrapper })

      const file = new File(['data'], 'photo.png', { type: 'image/png' })
      let url: string | undefined
      await act(async () => {
        url = await result.current.mutateAsync(file)
      })

      expect(url).toBe(publicUrl)
    })

    it('업로드 실패 시 error toast', async () => {
      vi.mocked(uploadAvatar).mockResolvedValue({
        data: null,
        error: { code: 'UPLOAD_ERROR', message: 'fail' },
      })

      const { result } = renderHook(() => useUploadAvatar(), { wrapper })

      const file = new File(['data'], 'photo.png', { type: 'image/png' })
      await act(async () => {
        try {
          await result.current.mutateAsync(file)
        } catch {
          // expected
        }
      })

      expect(toast.error).toHaveBeenCalledWith('아바타 업로드에 실패했습니다')
    })
  })

  // ── useDeleteAvatar ──
  describe('useDeleteAvatar', () => {
    it('아바타 삭제 성공', async () => {
      vi.mocked(deleteAvatar).mockResolvedValue({ data: null, error: null })

      const { result } = renderHook(() => useDeleteAvatar(), { wrapper })

      await act(async () => {
        await result.current.mutateAsync('https://example.com/avatars/test.png')
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
    })

    it('삭제 실패 시 error toast', async () => {
      vi.mocked(deleteAvatar).mockResolvedValue({
        data: null,
        error: { code: 'DELETE_ERROR', message: 'fail' },
      })

      const { result } = renderHook(() => useDeleteAvatar(), { wrapper })

      await act(async () => {
        try {
          await result.current.mutateAsync('https://example.com/avatars/test.png')
        } catch {
          // expected
        }
      })

      expect(toast.error).toHaveBeenCalledWith('아바타 삭제에 실패했습니다')
    })
  })

  // ── useDeleteAccount ──
  describe('useDeleteAccount', () => {
    it('성공 시 queryClient.clear + signOut + toast.success', async () => {
      vi.mocked(deleteAccount).mockResolvedValue({ data: null, error: null })
      mockSignOut.mockResolvedValue(undefined)
      const clearSpy = vi.spyOn(queryClient, 'clear')

      const { result } = renderHook(() => useDeleteAccount(), { wrapper })

      await act(async () => {
        await result.current.mutateAsync()
      })

      expect(toast.success).toHaveBeenCalledWith('계정이 삭제되었습니다')
      expect(clearSpy).toHaveBeenCalled()
      expect(mockSignOut).toHaveBeenCalled()
    })

    it('실패 시 toast.error', async () => {
      vi.mocked(deleteAccount).mockResolvedValue({
        data: null,
        error: { code: 'DELETE_ACCOUNT_ERROR', message: '계정 삭제 실패' },
      })

      const { result } = renderHook(() => useDeleteAccount(), { wrapper })

      await act(async () => {
        try {
          await result.current.mutateAsync()
        } catch {
          // expected
        }
      })

      expect(toast.error).toHaveBeenCalledWith('계정 삭제에 실패했습니다')
    })
  })
})
