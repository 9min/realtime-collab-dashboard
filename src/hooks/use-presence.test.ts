import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// mock setup
const mockTrack = vi.fn().mockResolvedValue(undefined)
const mockUntrack = vi.fn()
const mockRemoveChannel = vi.fn()
const mockPresenceState = vi.fn().mockReturnValue({})
const mockSubscribe = vi.fn()
let presenceSyncCallback: (() => void) | null = null

const mockChannel = {
  on: vi.fn().mockImplementation((_type: string, _opts: unknown, cb: () => void) => {
    presenceSyncCallback = cb
    return mockChannel
  }),
  subscribe: mockSubscribe,
  track: mockTrack,
  untrack: mockUntrack,
  presenceState: mockPresenceState,
}

vi.mock('@/components/providers/supabase-provider', () => ({
  useSupabase: () => ({
    channel: vi.fn().mockReturnValue(mockChannel),
    removeChannel: mockRemoveChannel,
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  }),
}))

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: {
      id: 'user-1',
      user_metadata: { full_name: 'Test User', avatar_url: null },
    },
    isLoading: false,
    isAuthenticated: true,
  }),
}))

import { usePresence } from './use-presence'

describe('usePresence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    presenceSyncCallback = null
    mockPresenceState.mockReturnValue({})
    mockSubscribe.mockImplementation((cb: (status: string) => void) => {
      cb('SUBSCRIBED')
    })
  })

  it('초기 onlineUsers는 빈 배열이다', () => {
    const { result } = renderHook(() => usePresence('project-1'))

    expect(result.current.onlineUsers).toEqual([])
  })

  it('SUBSCRIBED 상태에서 track을 호출한다', () => {
    renderHook(() => usePresence('project-1'))

    expect(mockTrack).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        full_name: 'Test User',
      }),
    )
  })

  it('presence sync 시 온라인 유저 목록이 업데이트된다', async () => {
    const presenceUser = {
      user_id: 'user-1',
      full_name: 'Test User',
      avatar_url: null,
      online_at: '2026-01-01T00:00:00Z',
    }

    mockPresenceState.mockReturnValue({
      'user-1': [presenceUser],
    })

    const { result } = renderHook(() => usePresence('project-1'))

    // presence sync 이벤트 트리거
    act(() => {
      presenceSyncCallback?.()
    })

    await waitFor(() => {
      expect(result.current.onlineUsers).toHaveLength(1)
    })

    expect(result.current.onlineUsers[0].user_id).toBe('user-1')
  })

  it('중복 유저는 한 번만 표시된다', async () => {
    const presenceUser = {
      user_id: 'user-1',
      full_name: 'Test User',
      avatar_url: null,
      online_at: '2026-01-01T00:00:00Z',
    }

    mockPresenceState.mockReturnValue({
      key1: [presenceUser],
      key2: [presenceUser], // 같은 유저가 중복
    })

    const { result } = renderHook(() => usePresence('project-1'))

    act(() => {
      presenceSyncCallback?.()
    })

    await waitFor(() => {
      expect(result.current.onlineUsers).toHaveLength(1)
    })
  })

  it('unmount 시 untrack과 removeChannel을 호출한다', () => {
    const { unmount } = renderHook(() => usePresence('project-1'))

    unmount()

    expect(mockUntrack).toHaveBeenCalled()
    expect(mockRemoveChannel).toHaveBeenCalled()
  })
})
