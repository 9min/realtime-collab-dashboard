import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'

vi.mock('@/components/providers/supabase-provider', () => ({
  useSupabase: () => ({}),
}))

vi.mock('@/services/comment-service', () => ({
  getComments: vi.fn(),
  createComment: vi.fn(),
  updateComment: vi.fn(),
  deleteComment: vi.fn(),
}))

vi.mock('@/queries/use-activity-logs', () => ({
  activityKeys: {
    list: (projectId: string) => ['activity-logs', projectId],
  },
}))

import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
} from '@/services/comment-service'
import { mockComment } from '@/__tests__/helpers/fixtures'
import {
  useComments,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
  commentKeys,
} from './use-comments'

describe('use-comments', () => {
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

  describe('useComments', () => {
    it('댓글 목록을 조회한다', async () => {
      vi.mocked(getComments).mockResolvedValue({
        data: [mockComment],
        error: null,
      })

      const { result } = renderHook(() => useComments('t1'), { wrapper })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual([mockComment])
    })

    it('에러 시 error 상태가 된다', async () => {
      vi.mocked(getComments).mockResolvedValue({
        data: null,
        error: { code: 'ERR', message: 'fail' },
      })

      const { result } = renderHook(() => useComments('t1'), { wrapper })

      await waitFor(() => expect(result.current.isError).toBe(true))
    })
  })

  describe('useCreateComment', () => {
    it('성공 시 comments + activity 캐시를 무효화한다', async () => {
      vi.mocked(createComment).mockResolvedValue({
        data: mockComment,
        error: null,
      })
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useCreateComment('t1'), { wrapper })

      await act(async () => {
        await result.current.mutateAsync({
          projectId: 'p1',
          userId: 'u1',
          content: 'Test',
        })
      })

      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: commentKeys.list('t1') }),
      )
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['activity-logs', 'p1'] }),
      )
    })
  })

  describe('useUpdateComment', () => {
    it('성공 시 캐시를 무효화한다', async () => {
      vi.mocked(updateComment).mockResolvedValue({
        data: { ...mockComment, content: 'Updated' },
        error: null,
      })
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useUpdateComment('t1'), { wrapper })

      await act(async () => {
        await result.current.mutateAsync({ commentId: 'c1', content: 'Updated' })
      })

      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: commentKeys.list('t1') }),
      )
    })
  })

  describe('useDeleteComment', () => {
    it('성공 시 comments + activity 캐시를 무효화한다', async () => {
      vi.mocked(deleteComment).mockResolvedValue({ data: null, error: null })
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useDeleteComment('t1', 'p1'), { wrapper })

      await act(async () => {
        await result.current.mutateAsync('c1')
      })

      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: commentKeys.list('t1') }),
      )
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['activity-logs', 'p1'] }),
      )
    })
  })

  describe('commentKeys', () => {
    it('올바른 쿼리 키를 생성한다', () => {
      expect(commentKeys.list('t1')).toEqual(['comments', 't1'])
    })
  })
})
