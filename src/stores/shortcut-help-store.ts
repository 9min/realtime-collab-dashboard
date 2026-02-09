import { create } from 'zustand'

interface ShortcutHelpState {
  isOpen: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
}

export const useShortcutHelpStore = create<ShortcutHelpState>((set) => ({
  isOpen: false,
  setOpen: (open) => set({ isOpen: open }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}))
