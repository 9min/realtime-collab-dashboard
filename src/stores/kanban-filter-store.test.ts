import { describe, it, expect, beforeEach } from 'vitest'

import { useKanbanFilterStore } from './kanban-filter-store'

describe('useKanbanFilterStore', () => {
  beforeEach(() => {
    useKanbanFilterStore.getState().resetFilters()
  })

  describe('searchText', () => {
    it('setSearchText로 검색어를 설정한다', () => {
      useKanbanFilterStore.getState().setSearchText('hello')
      expect(useKanbanFilterStore.getState().searchText).toBe('hello')
    })
  })

  describe('priorities', () => {
    it('togglePriority로 우선순위를 추가한다', () => {
      useKanbanFilterStore.getState().togglePriority('high')
      expect(useKanbanFilterStore.getState().priorities).toEqual(['high'])
    })

    it('togglePriority로 이미 있는 우선순위를 제거한다', () => {
      useKanbanFilterStore.getState().togglePriority('high')
      useKanbanFilterStore.getState().togglePriority('high')
      expect(useKanbanFilterStore.getState().priorities).toEqual([])
    })
  })

  describe('assigneeIds', () => {
    it('setAssigneeIds로 담당자 목록을 설정한다', () => {
      useKanbanFilterStore.getState().setAssigneeIds(['user-1', 'user-2'])
      expect(useKanbanFilterStore.getState().assigneeIds).toEqual(['user-1', 'user-2'])
    })

    it('toggleAssigneeId로 담당자를 추가한다', () => {
      useKanbanFilterStore.getState().toggleAssigneeId('user-1')
      expect(useKanbanFilterStore.getState().assigneeIds).toEqual(['user-1'])
    })

    it('toggleAssigneeId로 이미 있는 담당자를 제거한다', () => {
      useKanbanFilterStore.getState().toggleAssigneeId('user-1')
      useKanbanFilterStore.getState().toggleAssigneeId('user-1')
      expect(useKanbanFilterStore.getState().assigneeIds).toEqual([])
    })
  })

  describe('dueDateRange', () => {
    it('setDueDateFrom으로 시작일을 설정한다', () => {
      useKanbanFilterStore.getState().setDueDateFrom('2026-01-01')
      expect(useKanbanFilterStore.getState().dueDateRange.from).toBe('2026-01-01')
    })

    it('setDueDateTo로 종료일을 설정한다', () => {
      useKanbanFilterStore.getState().setDueDateTo('2026-12-31')
      expect(useKanbanFilterStore.getState().dueDateRange.to).toBe('2026-12-31')
    })
  })

  describe('resetFilters', () => {
    it('모든 필터를 초기화한다', () => {
      useKanbanFilterStore.getState().setSearchText('hello')
      useKanbanFilterStore.getState().togglePriority('high')
      useKanbanFilterStore.getState().toggleAssigneeId('user-1')
      useKanbanFilterStore.getState().setDueDateFrom('2026-01-01')

      useKanbanFilterStore.getState().resetFilters()

      const state = useKanbanFilterStore.getState()
      expect(state.searchText).toBe('')
      expect(state.priorities).toEqual([])
      expect(state.assigneeIds).toEqual([])
      expect(state.dueDateRange).toEqual({ from: null, to: null })
    })
  })

  describe('hasActiveFilters', () => {
    it('초기 상태에서는 false를 반환한다', () => {
      expect(useKanbanFilterStore.getState().hasActiveFilters()).toBe(false)
    })

    it('필터가 활성화되면 true를 반환한다', () => {
      useKanbanFilterStore.getState().setSearchText('test')
      expect(useKanbanFilterStore.getState().hasActiveFilters()).toBe(true)
    })
  })
})
