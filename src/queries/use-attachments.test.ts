import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'

vi.mock('@/components/providers/supabase-provider', () => ({
  useSupabase: () => ({}),
}))

vi.mock('@/services/attachment-service', () => ({
  getAttachments: vi.fn(),
  uploadAttachment: vi.fn(),
  deleteAttachment: vi.fn(),
}))

import { getAttachments, uploadAttachment, deleteAttachment } from '@/services/attachment-service'
import { mockAttachment } from '@/__tests__/helpers/fixtures'
import {
  useAttachments,
  useUploadAttachment,
  useDeleteAttachment,
  attachmentKeys,
} from './use-attachments'

describe('use-attachments', () => {
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

  describe('useAttachments', () => {
    it('첨부파일 목록을 조회한다', async () => {
      vi.mocked(getAttachments).mockResolvedValue({
        data: [mockAttachment],
        error: null,
      })

      const { result } = renderHook(() => useAttachments('t1'), { wrapper })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual([mockAttachment])
    })

    it('에러 시 error 상태가 된다', async () => {
      vi.mocked(getAttachments).mockResolvedValue({
        data: null,
        error: { code: 'ERR', message: 'fail' },
      })

      const { result } = renderHook(() => useAttachments('t1'), { wrapper })

      await waitFor(() => expect(result.current.isError).toBe(true))
    })
  })

  describe('useUploadAttachment', () => {
    it('성공 시 캐시를 무효화한다', async () => {
      vi.mocked(uploadAttachment).mockResolvedValue({
        data: mockAttachment,
        error: null,
      })
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
      const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' })

      const { result } = renderHook(() => useUploadAttachment('t1'), { wrapper })

      await act(async () => {
        await result.current.mutateAsync({ projectId: 'p1', userId: 'u1', file: mockFile })
      })

      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: attachmentKeys.list('t1') }),
      )
    })
  })

  describe('useDeleteAttachment', () => {
    it('성공 시 캐시를 무효화한다', async () => {
      vi.mocked(deleteAttachment).mockResolvedValue({ data: null, error: null })
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useDeleteAttachment('t1'), { wrapper })

      await act(async () => {
        await result.current.mutateAsync({ attachmentId: 'a1', filePath: 'test/path.pdf' })
      })

      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: attachmentKeys.list('t1') }),
      )
    })
  })

  describe('attachmentKeys', () => {
    it('올바른 쿼리 키를 생성한다', () => {
      expect(attachmentKeys.list('t1')).toEqual(['attachments', 't1'])
    })
  })
})
