import { create } from 'zustand'

type ViewMode = 'board' | 'backlog'

interface SprintState {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void

  selectedSprintId: string | null
  setSelectedSprintId: (sprintId: string | null) => void
}

export const useSprintStore = create<SprintState>((set) => ({
  viewMode: 'board',
  setViewMode: (mode) => set({ viewMode: mode }),

  selectedSprintId: null,
  setSelectedSprintId: (sprintId) => set({ selectedSprintId: sprintId }),
}))
