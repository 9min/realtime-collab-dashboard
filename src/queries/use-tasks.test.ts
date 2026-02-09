import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'

vi.mock('@/components/providers/supabase-provider', () => ({
  useSupabase: () => ({}),
}))

vi.mock('@/services/task-service', () => ({
  getTasksByProject: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  deleteTasksBefore: vi.fn(),
  moveTask: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

import { toast } from 'sonner'
import { getTasksByProject, createTask, updateTask, deleteTask, deleteTasksBefore, moveTask } from '@/services/task-service'
import { mockTasks } from '@/__tests__/helpers/fixtures'
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useBulkDeleteTasks, useMoveTask, taskKeys } from './use-tasks'

describe('use-tasks', () => {
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

  // ── useTasks ──
  describe('useTasks', () => {
    it('태스크 목록을 조회한다', async () => {
      vi.mocked(getTasksByProject).mockResolvedValue({ data: mockTasks, error: null })

      const { result } = renderHook(() => useTasks('p1'), { wrapper })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockTasks)
    })

    it('서비스 에러 시 error 상태가 된다', async () => {
      vi.mocked(getTasksByProject).mockResolvedValue({
        data: null,
        error: { code: 'ERR', message: 'fail' },
      })

      const { result } = renderHook(() => useTasks('p1'), { wrapper })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error?.message).toBe('fail')
    })

    it('taskKeys.list가 올바른 쿼리 키를 생성한다', () => {
      expect(taskKeys.list('p1')).toEqual(['tasks', 'p1'])
    })
  })

  // ── useCreateTask ──
  describe('useCreateTask', () => {
    it('태스크 생성 성공 시 캐시 무효화 + toast', async () => {
      vi.mocked(createTask).mockResolvedValue({ data: mockTasks[0], error: null })
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useCreateTask('p1'), { wrapper })

      await act(async () => {
        await result.current.mutateAsync({
          project_id: 'p1',
          column_id: 'col-1',
          title: 'Task 1',
          position: 0,
          created_by: 'u1',
        })
      })

      expect(toast.success).toHaveBeenCalledWith('태스크가 생성되었습니다')
      expect(invalidateSpy).toHaveBeenCalled()
    })

    it('태스크 생성 실패 시 error toast', async () => {
      vi.mocked(createTask).mockResolvedValue({
        data: null,
        error: { code: 'ERR', message: 'fail' },
      })

      const { result } = renderHook(() => useCreateTask('p1'), { wrapper })

      await act(async () => {
        try {
          await result.current.mutateAsync({
            project_id: 'p1',
            column_id: 'col-1',
            title: 'Task',
            position: 0,
            created_by: 'u1',
          })
        } catch {
          // expected
        }
      })

      expect(toast.error).toHaveBeenCalledWith('태스크 생성에 실패했습니다')
    })
  })

  // ── useUpdateTask ──
  describe('useUpdateTask', () => {
    it('Optimistic Update가 즉시 캐시에 반영된다', async () => {
      queryClient.setQueryData(taskKeys.list('p1'), mockTasks)
      vi.mocked(updateTask).mockResolvedValue({
        data: { ...mockTasks[0], title: 'Updated' },
        error: null,
      })

      const { result } = renderHook(() => useUpdateTask('p1'), { wrapper })

      await act(async () => {
        result.current.mutate({ taskId: mockTasks[0].id, input: { title: 'Updated' } })
      })

      const cached = queryClient.getQueryData<typeof mockTasks>(taskKeys.list('p1'))
      expect(cached?.[0].title).toBe('Updated')
    })

    it('실패 시 이전 상태로 롤백 + error toast', async () => {
      queryClient.setQueryData(taskKeys.list('p1'), mockTasks)
      vi.mocked(updateTask).mockResolvedValue({
        data: null,
        error: { code: 'ERR', message: 'fail' },
      })

      const { result } = renderHook(() => useUpdateTask('p1'), { wrapper })

      await act(async () => {
        try {
          await result.current.mutateAsync({ taskId: mockTasks[0].id, input: { title: 'Bad' } })
        } catch {
          // expected
        }
      })

      expect(toast.error).toHaveBeenCalledWith('태스크 수정에 실패했습니다')
      await waitFor(() => {
        const cached = queryClient.getQueryData<typeof mockTasks>(taskKeys.list('p1'))
        expect(cached?.[0].title).toBe('Task 1')
      })
    })
  })

  // ── useDeleteTask ──
  describe('useDeleteTask', () => {
    it('Optimistic Delete가 캐시에서 즉시 제거된다', async () => {
      queryClient.setQueryData(taskKeys.list('p1'), mockTasks)
      vi.mocked(deleteTask).mockResolvedValue({ data: null, error: null })

      const { result } = renderHook(() => useDeleteTask('p1'), { wrapper })

      await act(async () => {
        result.current.mutate(mockTasks[0].id)
      })

      const cached = queryClient.getQueryData<typeof mockTasks>(taskKeys.list('p1'))
      expect(cached?.find((t) => t.id === mockTasks[0].id)).toBeUndefined()
    })

    it('성공 시 toast.success를 표시한다', async () => {
      vi.mocked(deleteTask).mockResolvedValue({ data: null, error: null })

      const { result } = renderHook(() => useDeleteTask('p1'), { wrapper })

      await act(async () => {
        await result.current.mutateAsync(mockTasks[0].id)
      })

      expect(toast.success).toHaveBeenCalledWith('태스크가 삭제되었습니다')
    })
  })

  // ── useBulkDeleteTasks ──
  describe('useBulkDeleteTasks', () => {
    it('성공 시 캐시 무효화 + success toast', async () => {
      vi.mocked(deleteTasksBefore).mockResolvedValue({
        data: { deletedCount: 3 },
        error: null,
      })
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useBulkDeleteTasks('p1'), { wrapper })

      await act(async () => {
        await result.current.mutateAsync('2026-01-01T00:00:00Z')
      })

      expect(toast.success).toHaveBeenCalledWith('3개의 태스크가 삭제되었습니다')
      expect(invalidateSpy).toHaveBeenCalled()
    })

    it('실패 시 error toast', async () => {
      vi.mocked(deleteTasksBefore).mockResolvedValue({
        data: null,
        error: { code: 'ERR', message: 'fail' },
      })

      const { result } = renderHook(() => useBulkDeleteTasks('p1'), { wrapper })

      await act(async () => {
        try {
          await result.current.mutateAsync('2026-01-01T00:00:00Z')
        } catch {
          // expected
        }
      })

      expect(toast.error).toHaveBeenCalledWith('태스크 일괄 삭제에 실패했습니다')
    })
  })

  // ── useMoveTask ──
  describe('useMoveTask', () => {
    it('Optimistic Move가 column_id와 position을 즉시 반영한다', async () => {
      queryClient.setQueryData(taskKeys.list('p1'), mockTasks)
      vi.mocked(moveTask).mockResolvedValue({
        data: { ...mockTasks[0], column_id: 'col-2', position: 1 },
        error: null,
      })

      const { result } = renderHook(() => useMoveTask('p1'), { wrapper })

      await act(async () => {
        result.current.mutate({
          taskId: mockTasks[0].id,
          sourceColumnId: mockTasks[0].column_id,
          destinationColumnId: 'col-2',
          newPosition: 1,
        })
      })

      const cached = queryClient.getQueryData<typeof mockTasks>(taskKeys.list('p1'))
      const movedTask = cached?.find((t) => t.id === mockTasks[0].id)
      expect(movedTask?.column_id).toBe('col-2')
      expect(movedTask?.position).toBe(1)
    })

    it('이동 실패 시 error toast', async () => {
      queryClient.setQueryData(taskKeys.list('p1'), mockTasks)
      vi.mocked(moveTask).mockResolvedValue({
        data: null,
        error: { code: 'ERR', message: 'fail' },
      })

      const { result } = renderHook(() => useMoveTask('p1'), { wrapper })

      await act(async () => {
        try {
          await result.current.mutateAsync({
            taskId: mockTasks[0].id,
            sourceColumnId: mockTasks[0].column_id,
            destinationColumnId: 'col-2',
            newPosition: 1,
          })
        } catch {
          // expected
        }
      })

      expect(toast.error).toHaveBeenCalledWith('태스크 이동에 실패했습니다')
    })
  })
})
