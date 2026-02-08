import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'

vi.mock('@/components/providers/supabase-provider', () => ({
  useSupabase: () => ({}),
}))

vi.mock('@/services/activity-service', () => ({
  getActivityLogs: vi.fn(),
}))

import { getActivityLogs } from '@/services/activity-service'
import { mockActivityLog } from '@/__tests__/helpers/fixtures'
import { useActivityLogs, activityKeys } from './use-activity-logs'

describe('use-activity-logs', () => {
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

  describe('useActivityLogs', () => {
    it('활동 로그를 조회한다', async () => {
      vi.mocked(getActivityLogs).mockResolvedValue({
        data: [mockActivityLog],
        error: null,
      })

      const { result } = renderHook(() => useActivityLogs('p1'), { wrapper })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual([mockActivityLog])
    })

    it('에러 시 error 상태가 된다', async () => {
      vi.mocked(getActivityLogs).mockResolvedValue({
        data: null,
        error: { code: 'ERR', message: 'fail' },
      })

      const { result } = renderHook(() => useActivityLogs('p1'), { wrapper })

      await waitFor(() => expect(result.current.isError).toBe(true))
    })
  })

  describe('activityKeys', () => {
    it('올바른 쿼리 키를 생성한다', () => {
      expect(activityKeys.list('p1')).toEqual(['activity-logs', 'p1'])
    })
  })
})
