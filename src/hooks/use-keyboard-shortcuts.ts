'use client'

import { useEffect } from 'react'

import { isInputFocused } from '@/lib/keyboard-shortcuts'

interface Shortcut {
  key: string
  shiftKey?: boolean
  metaOrCtrlKey?: boolean
  action: () => void
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean
}

export function useKeyboardShortcuts(
  shortcuts: Shortcut[],
  options: UseKeyboardShortcutsOptions = {},
) {
  const { enabled = true } = options

  useEffect(() => {
    if (!enabled) return

    const handler = (e: KeyboardEvent) => {
      if (isInputFocused()) return

      for (const shortcut of shortcuts) {
        const keyMatch = e.key === shortcut.key

        const metaMatch = shortcut.metaOrCtrlKey
          ? (e.metaKey || e.ctrlKey)
          : (!e.metaKey && !e.ctrlKey)

        const shiftMatch = shortcut.shiftKey
          ? e.shiftKey
          : !e.shiftKey

        if (keyMatch && metaMatch && shiftMatch) {
          e.preventDefault()
          shortcut.action()
          return
        }
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [shortcuts, enabled])
}
