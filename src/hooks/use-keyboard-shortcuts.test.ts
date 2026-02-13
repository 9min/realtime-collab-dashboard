import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

import { useKeyboardShortcuts } from './use-keyboard-shortcuts'

// isInputFocused mock
vi.mock('@/lib/keyboard-shortcuts', () => ({
  isInputFocused: vi.fn(() => false),
}))

import { isInputFocused } from '@/lib/keyboard-shortcuts'

const mockedIsInputFocused = vi.mocked(isInputFocused)

function fireKeydown(opts: Partial<KeyboardEventInit>) {
  const event = new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    ...opts,
  })
  document.dispatchEvent(event)
  return event
}

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedIsInputFocused.mockReturnValue(false)
  })

  it('키 매칭 시 action을 호출한다', () => {
    const action = vi.fn()
    renderHook(() => useKeyboardShortcuts([{ key: '1', action }]))

    fireKeydown({ key: '1' })
    expect(action).toHaveBeenCalledTimes(1)
  })

  it('shiftKey가 필요한 단축키를 지원한다', () => {
    const action = vi.fn()
    renderHook(() => useKeyboardShortcuts([{ key: '?', shiftKey: true, action }]))

    // shift 없이 누르면 호출 안됨
    fireKeydown({ key: '?' })
    expect(action).not.toHaveBeenCalled()

    // shift와 함께 누르면 호출
    fireKeydown({ key: '?', shiftKey: true })
    expect(action).toHaveBeenCalledTimes(1)
  })

  it('metaOrCtrlKey가 필요한 단축키를 지원한다', () => {
    const action = vi.fn()
    renderHook(() => useKeyboardShortcuts([{ key: 'k', metaOrCtrlKey: true, action }]))

    // meta 없이 누르면 호출 안됨
    fireKeydown({ key: 'k' })
    expect(action).not.toHaveBeenCalled()

    // meta와 함께 누르면 호출
    fireKeydown({ key: 'k', metaKey: true })
    expect(action).toHaveBeenCalledTimes(1)
  })

  it('input 포커스 시 무시한다', () => {
    mockedIsInputFocused.mockReturnValue(true)
    const action = vi.fn()

    renderHook(() => useKeyboardShortcuts([{ key: '1', action }]))

    fireKeydown({ key: '1' })
    expect(action).not.toHaveBeenCalled()
  })

  it('enabled=false이면 리스너를 등록하지 않는다', () => {
    const action = vi.fn()

    renderHook(() => useKeyboardShortcuts([{ key: '1', action }], { enabled: false }))

    fireKeydown({ key: '1' })
    expect(action).not.toHaveBeenCalled()
  })

  it('매치되지 않는 키는 무시한다', () => {
    const action = vi.fn()

    renderHook(() => useKeyboardShortcuts([{ key: '1', action }]))

    fireKeydown({ key: '2' })
    expect(action).not.toHaveBeenCalled()
  })
})
