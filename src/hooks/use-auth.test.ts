import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// useSupabase mock
const mockGetUser = vi.fn()
const mockSignOut = vi.fn()
const mockOnAuthStateChange = vi.fn()

vi.mock('@/components/providers/supabase-provider', () => ({
  useSupabase: () => ({
    auth: {
      getUser: mockGetUser,
      signOut: mockSignOut,
      onAuthStateChange: mockOnAuthStateChange,
    },
  }),
}))

import { useAuth } from './use-auth'

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  user_metadata: { full_name: 'Test' },
}

describe('useAuth', () => {
  let unsubscribe: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    unsubscribe = vi.fn()
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe } },
    })
  })

  it('초기 상태는 isLoading: true, user: null이다', () => {
    mockGetUser.mockReturnValue(new Promise(() => {})) // never resolves

    const { result } = renderHook(() => useAuth())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('getUser 성공 시 user를 설정한다', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('getUser 시 user가 null이면 미인증 상태', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('auth state change 시 user가 업데이트된다', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    let authCallback: (event: string, session: unknown) => void = () => {}
    mockOnAuthStateChange.mockImplementation((cb: typeof authCallback) => {
      authCallback = cb
      return { data: { subscription: { unsubscribe } } }
    })

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // 로그인 이벤트
    act(() => {
      authCallback('SIGNED_IN', { user: mockUser })
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('signOut을 호출하면 supabase.auth.signOut이 실행된다', () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    mockSignOut.mockResolvedValue({ error: null })

    const { result } = renderHook(() => useAuth())

    // signOut은 내부적으로 supabase.auth.signOut()을 호출하는 래퍼
    // 로딩 완료를 기다릴 필요 없이 바로 호출 가능
    act(() => {
      result.current.signOut()
    })

    expect(mockSignOut).toHaveBeenCalledOnce()
  })

  it('unmount 시 subscription을 해제한다', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const { unmount } = renderHook(() => useAuth())

    unmount()

    expect(unsubscribe).toHaveBeenCalledOnce()
  })
})
