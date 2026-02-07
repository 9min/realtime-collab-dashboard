'use client'

import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'

// channel mock
const mockSubscribe = vi.fn()
const mockRemoveChannel = vi.fn()
let postgresCallbacks: Array<(payload: Record<string, unknown>) => void> = []

const mockChannel: Record<string, unknown> = {
  on: vi.fn().mockImplementation(
    (_type: string, _opts: unknown, cb: (payload: Record<string, unknown>) => void) => {
      postgresCallbacks.push(cb)
      return mockChannel
    },
  ),
}
// subscribe는 mockChannel 자체를 반환해야 hook 내 channel 변수에 값이 할당됨
mockChannel.subscribe = mockSubscribe.mockReturnValue(mockChannel)

const mockUnsubscribeAuth = vi.fn()

vi.mock('@/components/providers/supabase-provider', () => ({
  useSupabase: () => ({
    channel: vi.fn().mockReturnValue(mockChannel),
    removeChannel: mockRemoveChannel,
    realtime: {
      setAuth: vi.fn(),
    },
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'mock-token' } },
      }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: mockUnsubscribeAuth } },
      }),
    },
  }),
}))

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
    isLoading: false,
    isAuthenticated: true,
  }),
}))

vi.mock('sonner', () => ({
  toast: { info: vi.fn(), error: vi.fn(), success: vi.fn() },
}))

// Lazy import after mocks
import { useRealtimeSubscription } from './use-realtime-subscription'

describe('useRealtimeSubscription', () => {
  let queryClient: QueryClient

  function wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }

  beforeEach(() => {
    vi.clearAllMocks()
    postgresCallbacks = []
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
  })

  it('프로젝트 ID로 채널을 구독한다', async () => {
    renderHook(() => useRealtimeSubscription('project-1'), { wrapper })

    await waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalled()
    })
  })

  it('8개 테이블을 감시한다 (tasks, columns, members, activity, comments, notifications, attachments)', async () => {
    renderHook(() => useRealtimeSubscription('project-1'), { wrapper })

    await waitFor(() => {
      // on()이 7번 호출됨 (tasks, kanban_columns, project_members, activity_logs, task_comments, notifications, task_attachments)
      expect(mockChannel.on).toHaveBeenCalledTimes(7)
    })
  })

  it('tasks 변경 시 task + chart 쿼리를 무효화한다', async () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    renderHook(() => useRealtimeSubscription('project-1'), { wrapper })

    await waitFor(() => {
      expect(postgresCallbacks.length).toBeGreaterThan(0)
    })

    // 첫 번째 콜백이 tasks 핸들러
    act(() => {
      postgresCallbacks[0]({
        eventType: 'INSERT',
        new: { created_by: 'user-2' },
      })
    })

    expect(invalidateSpy).toHaveBeenCalled()
  })

  it('projectId가 빈 문자열이면 구독하지 않는다', async () => {
    ;(mockChannel.on as ReturnType<typeof vi.fn>).mockClear()
    mockSubscribe.mockClear()

    renderHook(() => useRealtimeSubscription(''), { wrapper })

    // 비동기 setupChannel이 호출되지 않도록 잠시 대기
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })

    expect(mockSubscribe).not.toHaveBeenCalled()
  })

  it('unmount 시 채널을 해제한다', async () => {
    const { unmount } = renderHook(
      () => useRealtimeSubscription('project-1'),
      { wrapper },
    )

    await waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalled()
    })

    unmount()

    expect(mockRemoveChannel).toHaveBeenCalled()
  })
})
