import { create } from 'zustand'

import type { SwimlaneMode, TaskPriority } from '@/types/common'

interface DateRange {
  from: string | null
  to: string | null
}

export interface SavedFilterPreset {
  priorities: TaskPriority[]
  assigneeIds: string[]
  dueDateRange: DateRange
  labelIds: string[]
  swimlaneMode: SwimlaneMode
}

interface KanbanFilterState {
  searchText: string
  setSearchText: (text: string) => void

  priorities: TaskPriority[]
  togglePriority: (priority: TaskPriority) => void

  assigneeIds: string[]
  setAssigneeIds: (ids: string[]) => void
  toggleAssigneeId: (id: string) => void

  dueDateRange: DateRange
  setDueDateFrom: (date: string | null) => void
  setDueDateTo: (date: string | null) => void
  clearDueDateRange: () => void

  labelIds: string[]
  toggleLabelId: (id: string) => void

  swimlaneMode: SwimlaneMode
  setSwimlaneMode: (mode: SwimlaneMode) => void

  resetFilters: () => void
  hasActiveFilters: () => boolean

  hydrate: (preset: SavedFilterPreset) => void
  getSavedState: () => SavedFilterPreset
}

const INITIAL_STATE = {
  searchText: '',
  priorities: [] as TaskPriority[],
  assigneeIds: [] as string[],
  dueDateRange: { from: null, to: null } as DateRange,
  labelIds: [] as string[],
  swimlaneMode: 'none' as SwimlaneMode,
}

export const useKanbanFilterStore = create<KanbanFilterState>((set, get) => ({
  ...INITIAL_STATE,

  setSearchText: (text) => set({ searchText: text }),

  togglePriority: (priority) =>
    set((state) => ({
      priorities: state.priorities.includes(priority)
        ? state.priorities.filter((p) => p !== priority)
        : [...state.priorities, priority],
    })),

  setAssigneeIds: (ids) => set({ assigneeIds: ids }),

  toggleAssigneeId: (id) =>
    set((state) => ({
      assigneeIds: state.assigneeIds.includes(id)
        ? state.assigneeIds.filter((a) => a !== id)
        : [...state.assigneeIds, id],
    })),

  setDueDateFrom: (date) =>
    set((state) => ({ dueDateRange: { ...state.dueDateRange, from: date } })),

  setDueDateTo: (date) =>
    set((state) => ({ dueDateRange: { ...state.dueDateRange, to: date } })),

  clearDueDateRange: () => set({ dueDateRange: { from: null, to: null } }),

  toggleLabelId: (id) =>
    set((state) => ({
      labelIds: state.labelIds.includes(id)
        ? state.labelIds.filter((l) => l !== id)
        : [...state.labelIds, id],
    })),

  setSwimlaneMode: (mode) => set({ swimlaneMode: mode }),

  resetFilters: () => set(INITIAL_STATE),

  hasActiveFilters: () => {
    const state = get()
    return (
      state.searchText !== '' ||
      state.priorities.length > 0 ||
      state.assigneeIds.length > 0 ||
      state.dueDateRange.from !== null ||
      state.dueDateRange.to !== null ||
      state.labelIds.length > 0
    )
  },

  hydrate: (preset) =>
    set({
      priorities: preset.priorities,
      assigneeIds: preset.assigneeIds,
      dueDateRange: preset.dueDateRange,
      labelIds: preset.labelIds,
      swimlaneMode: preset.swimlaneMode,
    }),

  getSavedState: () => {
    const { priorities, assigneeIds, dueDateRange, labelIds, swimlaneMode } = get()
    return { priorities, assigneeIds, dueDateRange, labelIds, swimlaneMode }
  },
}))
