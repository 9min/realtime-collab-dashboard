import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'

vi.mock('@/components/providers/supabase-provider', () => ({
  useSupabase: () => ({}),
}))

vi.mock('@/services/dashboard-service', () => ({
  getDashboardLayout: vi.fn(),
  saveDashboardLayout: vi.fn(),
}))

import { getDashboardLayout, saveDashboardLayout } from '@/services/dashboard-service'
import { mockLayoutItems, mockDashboardLayout } from '@/__tests__/helpers/fixtures'
import {
  useDashboardLayout,
  useSaveDashboardLayout,
  dashboardLayoutKeys,
} from './use-dashboard-layout'

describe('use-dashboard-layout', () => {
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

  describe('useDashboardLayout', () => {
    it('레이아웃을 조회한다', async () => {
      vi.mocked(getDashboardLayout).mockResolvedValue({ data: mockLayoutItems, error: null })

      const { result } = renderHook(() => useDashboardLayout('p1'), { wrapper })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockLayoutItems)
    })

    it('레이아웃이 없으면 null을 반환한다', async () => {
      vi.mocked(getDashboardLayout).mockResolvedValue({ data: null, error: null })

      const { result } = renderHook(() => useDashboardLayout('p1'), { wrapper })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toBeNull()
    })

    it('projectId가 빈 문자열이면 비활성화된다', () => {
      const { result } = renderHook(() => useDashboardLayout(''), { wrapper })

      expect(result.current.fetchStatus).toBe('idle')
    })

    it('에러 시 error 상태가 된다', async () => {
      vi.mocked(getDashboardLayout).mockResolvedValue({
        data: null,
        error: { code: 'UNAUTHORIZED', message: '로그인 필요' },
      })

      const { result } = renderHook(() => useDashboardLayout('p1'), { wrapper })

      await waitFor(() => expect(result.current.isError).toBe(true))
    })
  })

  describe('useSaveDashboardLayout', () => {
    it('저장 성공 시 캐시를 무효화한다', async () => {
      vi.mocked(saveDashboardLayout).mockResolvedValue({ data: mockDashboardLayout, error: null })
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useSaveDashboardLayout('p1'), { wrapper })

      await act(async () => {
        await result.current.mutateAsync(mockLayoutItems)
      })

      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: dashboardLayoutKeys.layout('p1') }),
      )
    })
  })

  describe('dashboardLayoutKeys', () => {
    it('올바른 쿼리 키를 생성한다', () => {
      expect(dashboardLayoutKeys.layout('p1')).toEqual(['dashboard-layout', 'p1'])
    })
  })
})
