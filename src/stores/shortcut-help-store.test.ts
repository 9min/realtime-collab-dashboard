import { describe, it, expect, beforeEach } from 'vitest'
import { useShortcutHelpStore } from './shortcut-help-store'

describe('shortcut-help-store', () => {
  beforeEach(() => {
    useShortcutHelpStore.setState({ isOpen: false })
  })

  it('초기 상태는 닫혀있다', () => {
    expect(useShortcutHelpStore.getState().isOpen).toBe(false)
  })

  it('setOpen으로 열고 닫을 수 있다', () => {
    useShortcutHelpStore.getState().setOpen(true)
    expect(useShortcutHelpStore.getState().isOpen).toBe(true)

    useShortcutHelpStore.getState().setOpen(false)
    expect(useShortcutHelpStore.getState().isOpen).toBe(false)
  })

  it('toggle로 상태를 반전시킨다', () => {
    useShortcutHelpStore.getState().toggle()
    expect(useShortcutHelpStore.getState().isOpen).toBe(true)

    useShortcutHelpStore.getState().toggle()
    expect(useShortcutHelpStore.getState().isOpen).toBe(false)
  })
})
