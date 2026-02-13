import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'

vi.mock('@/components/providers/supabase-provider', () => ({
  useSupabase: () => ({}),
}))

vi.mock('@/services/notification-service', () => ({
  getNotifications: vi.fn(),
  getUnreadCount: vi.fn(),
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
}))

import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from '@/services/notification-service'
import { mockNotification } from '@/__tests__/helpers/fixtures'
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  notificationKeys,
} from './use-notifications'

describe('use-notifications', () => {
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

  describe('useNotifications', () => {
    it('알림 목록을 조회한다', async () => {
      vi.mocked(getNotifications).mockResolvedValue({
        data: [mockNotification],
        error: null,
      })

      const { result } = renderHook(() => useNotifications('u1'), { wrapper })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual([mockNotification])
    })

    it('에러 시 error 상태가 된다', async () => {
      vi.mocked(getNotifications).mockResolvedValue({
        data: null,
        error: { code: 'ERR', message: 'fail' },
      })

      const { result } = renderHook(() => useNotifications('u1'), { wrapper })

      await waitFor(() => expect(result.current.isError).toBe(true))
    })
  })

  describe('useUnreadCount', () => {
    it('읽지 않은 알림 수를 조회한다', async () => {
      vi.mocked(getUnreadCount).mockResolvedValue({
        data: 5,
        error: null,
      })

      const { result } = renderHook(() => useUnreadCount('u1'), { wrapper })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toBe(5)
    })

    it('에러 시 error 상태가 된다', async () => {
      vi.mocked(getUnreadCount).mockResolvedValue({
        data: null,
        error: { code: 'ERR', message: 'fail' },
      })

      const { result } = renderHook(() => useUnreadCount('u1'), { wrapper })

      await waitFor(() => expect(result.current.isError).toBe(true))
    })
  })

  describe('useMarkAsRead', () => {
    it('성공 시 list + unread 캐시를 무효화한다', async () => {
      vi.mocked(markAsRead).mockResolvedValue({ data: null, error: null })
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useMarkAsRead('u1'), { wrapper })

      await act(async () => {
        await result.current.mutateAsync('n1')
      })

      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: notificationKeys.list('u1') }),
      )
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: notificationKeys.unreadCount('u1') }),
      )
    })
  })

  describe('useMarkAllAsRead', () => {
    it('성공 시 list + unread 캐시를 무효화한다', async () => {
      vi.mocked(markAllAsRead).mockResolvedValue({ data: null, error: null })
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useMarkAllAsRead('u1'), { wrapper })

      await act(async () => {
        await result.current.mutateAsync()
      })

      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: notificationKeys.list('u1') }),
      )
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: notificationKeys.unreadCount('u1') }),
      )
    })
  })

  describe('notificationKeys', () => {
    it('올바른 쿼리 키를 생성한다', () => {
      expect(notificationKeys.all).toEqual(['notifications'])
      expect(notificationKeys.list('u1')).toEqual(['notifications', 'list', 'u1'])
      expect(notificationKeys.unreadCount('u1')).toEqual(['notifications', 'unread', 'u1'])
    })
  })
})
