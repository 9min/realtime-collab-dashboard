import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'

vi.mock('@/components/providers/supabase-provider', () => ({
  useSupabase: () => ({}),
}))

vi.mock('@/services/dependency-service', () => ({
  getDependencies: vi.fn(),
  createDependency: vi.fn(),
  deleteDependency: vi.fn(),
  hasCyclicDependency: vi.fn(),
}))

import { getDependencies, createDependency, deleteDependency } from '@/services/dependency-service'
import type { TaskDependency } from '@/types/dependency'
import { useDependencies, useCreateDependency, useDeleteDependency, dependencyKeys } from './use-dependencies'

const MOCK_PROJECT_ID = 'project-aaa-111'
const MOCK_DEP_ID = 'dep-aaa-111'

const mockDep: TaskDependency = {
  id: MOCK_DEP_ID,
  project_id: MOCK_PROJECT_ID,
  blocking_task_id: 'task-aaa-111',
  blocked_task_id: 'task-bbb-222',
  created_by: 'user-aaa-111',
  created_at: '2026-01-15T10:00:00Z',
}

describe('use-dependencies', () => {
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

  describe('useDependencies', () => {
    it('의존성 목록을 조회한다', async () => {
      vi.mocked(getDependencies).mockResolvedValue({ data: [mockDep], error: null })

      const { result } = renderHook(() => useDependencies(MOCK_PROJECT_ID), { wrapper })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual([mockDep])
    })

    it('에러 시 error 상태가 된다', async () => {
      vi.mocked(getDependencies).mockResolvedValue({
        data: null,
        error: { code: 'ERR', message: 'fail' },
      })

      const { result } = renderHook(() => useDependencies(MOCK_PROJECT_ID), { wrapper })

      await waitFor(() => expect(result.current.isError).toBe(true))
    })
  })

  describe('useCreateDependency', () => {
    it('성공 시 캐시를 무효화한다', async () => {
      vi.mocked(createDependency).mockResolvedValue({ data: mockDep, error: null })
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useCreateDependency(MOCK_PROJECT_ID), { wrapper })

      await act(async () => {
        await result.current.mutateAsync({
          project_id: MOCK_PROJECT_ID,
          blocking_task_id: 'task-aaa-111',
          blocked_task_id: 'task-bbb-222',
          created_by: 'user-aaa-111',
        })
      })

      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: dependencyKeys.list(MOCK_PROJECT_ID) }),
      )
    })
  })

  describe('useDeleteDependency', () => {
    it('성공 시 캐시를 무효화한다', async () => {
      vi.mocked(deleteDependency).mockResolvedValue({ data: null, error: null })
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useDeleteDependency(MOCK_PROJECT_ID), { wrapper })

      await act(async () => {
        await result.current.mutateAsync(MOCK_DEP_ID)
      })

      expect(invalidateSpy).toHaveBeenCalled()
    })
  })

  describe('dependencyKeys', () => {
    it('올바른 쿼리 키를 생성한다', () => {
      expect(dependencyKeys.list('p1')).toEqual(['dependencies', 'p1'])
    })
  })
})
