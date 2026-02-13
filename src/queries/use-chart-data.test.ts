import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'

vi.mock('@/components/providers/supabase-provider', () => ({
  useSupabase: () => ({}),
}))

vi.mock('@/services/chart-service', () => ({
  getTaskStatusData: vi.fn(),
  getWeeklyProgressData: vi.fn(),
  getBurndownData: vi.fn(),
}))

import { getTaskStatusData, getWeeklyProgressData, getBurndownData } from '@/services/chart-service'
import {
  useTaskStatusChart,
  useWeeklyProgressChart,
  useBurndownChart,
  chartKeys,
} from './use-chart-data'

const mockStatusData = [{ name: '할 일', value: 3, color: '#3b82f6' }]
const mockWeeklyData = [{ date: '1월 1일', completed: 2, created: 3 }]
const mockBurndownData = [{ date: '1월 1일', remaining: 5, ideal: 4 }]

describe('use-chart-data', () => {
  let queryClient: QueryClient

  function wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
  })

  describe('useTaskStatusChart', () => {
    it('태스크 상태 데이터를 조회한다', async () => {
      vi.mocked(getTaskStatusData).mockResolvedValue({ data: mockStatusData, error: null })

      const { result } = renderHook(() => useTaskStatusChart('p1'), { wrapper })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockStatusData)
    })

    it('projectId가 빈 문자열이면 비활성화된다', () => {
      const { result } = renderHook(() => useTaskStatusChart(''), { wrapper })

      expect(result.current.fetchStatus).toBe('idle')
    })
  })

  describe('useWeeklyProgressChart', () => {
    it('주간 진행률 데이터를 조회한다', async () => {
      vi.mocked(getWeeklyProgressData).mockResolvedValue({ data: mockWeeklyData, error: null })

      const { result } = renderHook(() => useWeeklyProgressChart('p1'), { wrapper })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockWeeklyData)
    })
  })

  describe('useBurndownChart', () => {
    it('번다운 데이터를 조회한다', async () => {
      vi.mocked(getBurndownData).mockResolvedValue({ data: mockBurndownData, error: null })

      const { result } = renderHook(() => useBurndownChart('p1'), { wrapper })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockBurndownData)
    })

    it('에러 시 error 상태가 된다', async () => {
      vi.mocked(getBurndownData).mockResolvedValue({
        data: null,
        error: { code: 'ERR', message: 'fail' },
      })

      const { result } = renderHook(() => useBurndownChart('p1'), { wrapper })

      await waitFor(() => expect(result.current.isError).toBe(true))
    })
  })

  describe('chartKeys', () => {
    it('올바른 쿼리 키를 생성한다', () => {
      expect(chartKeys.taskStatus('p1')).toEqual(['chart', 'task-status', 'p1'])
      expect(chartKeys.weeklyProgress('p1')).toEqual(['chart', 'weekly-progress', 'p1'])
      expect(chartKeys.burndown('p1')).toEqual(['chart', 'burndown', 'p1'])
    })
  })
})
