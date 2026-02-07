import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useMediaQuery } from './use-media-query'

describe('useMediaQuery', () => {
  let changeHandlers: ((event: MediaQueryListEvent) => void)[]

  beforeEach(() => {
    changeHandlers = []

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn((_type: string, handler: (event: MediaQueryListEvent) => void) => {
          changeHandlers.push(handler)
        }),
        removeEventListener: vi.fn((_type: string, handler: (event: MediaQueryListEvent) => void) => {
          changeHandlers = changeHandlers.filter((h) => h !== handler)
        }),
      })),
    })
  })

  it('초기 상태: matches=false', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))
    expect(result.current).toBe(false)
  })

  it('쿼리 매칭 시 true 반환', () => {
    // matchMedia가 true를 반환하도록 변경
    vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
      matches: true,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }) as unknown as MediaQueryList)

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))
    expect(result.current).toBe(true)
  })

  it('서로 다른 쿼리에 대해 독립적으로 동작', () => {
    vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
      matches: query === '(min-width: 1024px)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }) as unknown as MediaQueryList)

    const { result: small } = renderHook(() => useMediaQuery('(min-width: 768px)'))
    const { result: large } = renderHook(() => useMediaQuery('(min-width: 1024px)'))

    expect(small.current).toBe(false)
    expect(large.current).toBe(true)
  })
})
