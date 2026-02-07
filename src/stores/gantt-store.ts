import { create } from 'zustand'

type ViewMode = 'week' | 'month'

interface GanttState {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
}

export const useGanttStore = create<GanttState>((set) => ({
  viewMode: 'week',
  setViewMode: (mode) => set({ viewMode: mode }),
}))
