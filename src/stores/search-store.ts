import { create } from 'zustand'

interface SearchState {
  isOpen: boolean
  query: string
  setOpen: (open: boolean) => void
  setQuery: (query: string) => void
  reset: () => void
}

export const useSearchStore = create<SearchState>((set) => ({
  isOpen: false,
  query: '',
  setOpen: (open) => set({ isOpen: open }),
  setQuery: (query) => set({ query }),
  reset: () => set({ isOpen: false, query: '' }),
}))
