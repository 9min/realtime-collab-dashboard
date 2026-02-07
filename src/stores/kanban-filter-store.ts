import { create } from 'zustand'

import type { TaskPriority } from '@/types/common'

interface DateRange {
  from: string | null
  to: string | null
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

  resetFilters: () => void
  hasActiveFilters: () => boolean
}

const INITIAL_STATE = {
  searchText: '',
  priorities: [] as TaskPriority[],
  assigneeIds: [] as string[],
  dueDateRange: { from: null, to: null } as DateRange,
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

  resetFilters: () => set(INITIAL_STATE),

  hasActiveFilters: () => {
    const state = get()
    return (
      state.searchText !== '' ||
      state.priorities.length > 0 ||
      state.assigneeIds.length > 0 ||
      state.dueDateRange.from !== null ||
      state.dueDateRange.to !== null
    )
  },
}))
