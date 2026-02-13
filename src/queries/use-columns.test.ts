import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'

vi.mock('@/components/providers/supabase-provider', () => ({
  useSupabase: () => ({}),
}))

vi.mock('@/services/column-service', () => ({
  getColumns: vi.fn(),
  createColumn: vi.fn(),
  updateColumn: vi.fn(),
  deleteColumn: vi.fn(),
  reorderColumns: vi.fn(),
}))

import { getColumns, createColumn, deleteColumn, reorderColumns } from '@/services/column-service'
import { mockColumns } from '@/__tests__/helpers/fixtures'
import {
  useColumns,
  useCreateColumn,
  useDeleteColumn,
  useReorderColumns,
  columnKeys,
} from './use-columns'

describe('use-columns', () => {
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

  describe('useColumns', () => {
    it('컬럼 목록을 조회한다', async () => {
      vi.mocked(getColumns).mockResolvedValue({ data: mockColumns, error: null })

      const { result } = renderHook(() => useColumns('p1'), { wrapper })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockColumns)
    })

    it('에러 시 error 상태가 된다', async () => {
      vi.mocked(getColumns).mockResolvedValue({
        data: null,
        error: { code: 'ERR', message: 'fail' },
      })

      const { result } = renderHook(() => useColumns('p1'), { wrapper })

      await waitFor(() => expect(result.current.isError).toBe(true))
    })
  })

  describe('useCreateColumn', () => {
    it('성공 시 캐시를 무효화한다', async () => {
      vi.mocked(createColumn).mockResolvedValue({ data: mockColumns[0], error: null })
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useCreateColumn('p1'), { wrapper })

      await act(async () => {
        await result.current.mutateAsync({ title: 'New', position: 2 })
      })

      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: columnKeys.list('p1') }),
      )
    })
  })

  describe('useDeleteColumn', () => {
    it('성공 시 캐시를 무효화한다', async () => {
      vi.mocked(deleteColumn).mockResolvedValue({ data: null, error: null })
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useDeleteColumn('p1'), { wrapper })

      await act(async () => {
        await result.current.mutateAsync('c1')
      })

      expect(invalidateSpy).toHaveBeenCalled()
    })
  })

  describe('useReorderColumns', () => {
    it('성공 시 캐시를 무효화한다', async () => {
      vi.mocked(reorderColumns).mockResolvedValue({ data: mockColumns, error: null })
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useReorderColumns('p1'), { wrapper })

      await act(async () => {
        await result.current.mutateAsync(['c2', 'c1'])
      })

      expect(invalidateSpy).toHaveBeenCalled()
    })
  })

  describe('columnKeys', () => {
    it('올바른 쿼리 키를 생성한다', () => {
      expect(columnKeys.list('p1')).toEqual(['columns', 'p1'])
    })
  })
})
