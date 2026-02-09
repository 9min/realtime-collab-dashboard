import { create } from 'zustand'

import type { ActivityAction, ActivityEntity } from '@/types/activity'

interface ActivityFilterState {
  searchText: string
  setSearchText: (text: string) => void

  actionTypes: ActivityAction[]
  toggleActionType: (action: ActivityAction) => void

  entityTypes: ActivityEntity[]
  toggleEntityType: (entity: ActivityEntity) => void

  userIds: string[]
  toggleUserId: (id: string) => void

  resetFilters: () => void
  hasActiveFilters: () => boolean
}

const INITIAL_STATE = {
  searchText: '',
  actionTypes: [] as ActivityAction[],
  entityTypes: [] as ActivityEntity[],
  userIds: [] as string[],
}

export const useActivityFilterStore = create<ActivityFilterState>((set, get) => ({
  ...INITIAL_STATE,

  setSearchText: (text) => set({ searchText: text }),

  toggleActionType: (action) =>
    set((state) => ({
      actionTypes: state.actionTypes.includes(action)
        ? state.actionTypes.filter((a) => a !== action)
        : [...state.actionTypes, action],
    })),

  toggleEntityType: (entity) =>
    set((state) => ({
      entityTypes: state.entityTypes.includes(entity)
        ? state.entityTypes.filter((e) => e !== entity)
        : [...state.entityTypes, entity],
    })),

  toggleUserId: (id) =>
    set((state) => ({
      userIds: state.userIds.includes(id)
        ? state.userIds.filter((u) => u !== id)
        : [...state.userIds, id],
    })),

  resetFilters: () => set(INITIAL_STATE),

  hasActiveFilters: () => {
    const state = get()
    return (
      state.searchText !== '' ||
      state.actionTypes.length > 0 ||
      state.entityTypes.length > 0 ||
      state.userIds.length > 0
    )
  },
}))
