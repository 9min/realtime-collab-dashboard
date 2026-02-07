import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

import { toast } from 'sonner'
import { useOptimisticMutation } from './use-optimistic-mutation'

describe('useOptimisticMutation', () => {
  let queryClient: QueryClient

  function wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
  })

  it('mutation 성공 시 data를 반환한다', async () => {
    const mutationFn = vi.fn().mockResolvedValue({ data: 'result', error: null })

    const { result } = renderHook(
      () =>
        useOptimisticMutation({
          mutationFn,
          invalidateKeys: [['test']],
          successMessage: '성공',
        }),
      { wrapper },
    )

    await act(async () => {
      await result.current.mutateAsync('input')
    })

    expect(mutationFn).toHaveBeenCalledWith('input')
    expect(toast.success).toHaveBeenCalledWith('성공')
  })

  it('mutation 실패 시 error toast를 표시한다', async () => {
    const mutationFn = vi.fn().mockResolvedValue({
      data: null,
      error: { code: 'ERR', message: '실패' },
    })

    const { result } = renderHook(
      () =>
        useOptimisticMutation({
          mutationFn,
          invalidateKeys: [['test']],
          errorMessage: '오류 발생',
        }),
      { wrapper },
    )

    await act(async () => {
      try {
        await result.current.mutateAsync('input')
      } catch {
        // expected
      }
    })

    expect(toast.error).toHaveBeenCalledWith('오류 발생')
  })

  it('onOptimisticUpdate가 호출된다', async () => {
    const mutationFn = vi.fn().mockResolvedValue({ data: 'ok', error: null })
    const onOptimisticUpdate = vi.fn()

    const { result } = renderHook(
      () =>
        useOptimisticMutation({
          mutationFn,
          invalidateKeys: [['test']],
          onOptimisticUpdate,
        }),
      { wrapper },
    )

    await act(async () => {
      await result.current.mutateAsync('vars')
    })

    expect(onOptimisticUpdate).toHaveBeenCalledWith('vars')
  })

  it('mutation 실패 시 스냅샷으로 롤백한다', async () => {
    const queryKey = ['test', 'data']
    queryClient.setQueryData(queryKey, 'original')

    const mutationFn = vi.fn().mockResolvedValue({
      data: null,
      error: { code: 'ERR', message: '실패' },
    })

    const onOptimisticUpdate = vi.fn().mockImplementation(() => {
      queryClient.setQueryData(queryKey, 'optimistic')
    })

    const { result } = renderHook(
      () =>
        useOptimisticMutation({
          mutationFn,
          invalidateKeys: [queryKey],
          onOptimisticUpdate,
        }),
      { wrapper },
    )

    await act(async () => {
      try {
        await result.current.mutateAsync('input')
      } catch {
        // expected
      }
    })

    // 롤백 후 원래 데이터 복원
    await waitFor(() => {
      expect(queryClient.getQueryData(queryKey)).toBe('original')
    })
  })

  it('successMessage가 없으면 toast.success를 호출하지 않는다', async () => {
    const mutationFn = vi.fn().mockResolvedValue({ data: 'ok', error: null })

    const { result } = renderHook(
      () =>
        useOptimisticMutation({
          mutationFn,
          invalidateKeys: [['test']],
        }),
      { wrapper },
    )

    await act(async () => {
      await result.current.mutateAsync('input')
    })

    expect(toast.success).not.toHaveBeenCalled()
  })

  it('기본 errorMessage가 적용된다', async () => {
    const mutationFn = vi.fn().mockResolvedValue({
      data: null,
      error: { code: 'ERR', message: '실패' },
    })

    const { result } = renderHook(
      () =>
        useOptimisticMutation({
          mutationFn,
          invalidateKeys: [['test']],
          // errorMessage 생략 → 기본값 사용
        }),
      { wrapper },
    )

    await act(async () => {
      try {
        await result.current.mutateAsync('input')
      } catch {
        // expected
      }
    })

    expect(toast.error).toHaveBeenCalledWith('작업 중 오류가 발생했습니다')
  })
})
