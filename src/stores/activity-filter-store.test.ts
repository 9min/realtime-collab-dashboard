import { describe, it, expect, beforeEach } from 'vitest'

import { useActivityFilterStore } from './activity-filter-store'

describe('useActivityFilterStore', () => {
  beforeEach(() => {
    useActivityFilterStore.getState().resetFilters()
  })

  describe('searchText', () => {
    it('setSearchText로 검색어를 설정한다', () => {
      useActivityFilterStore.getState().setSearchText('hello')
      expect(useActivityFilterStore.getState().searchText).toBe('hello')
    })
  })

  describe('actionTypes', () => {
    it('toggleActionType으로 액션 타입을 추가한다', () => {
      useActivityFilterStore.getState().toggleActionType('created')
      expect(useActivityFilterStore.getState().actionTypes).toEqual(['created'])
    })

    it('toggleActionType으로 이미 있는 액션 타입을 제거한다', () => {
      useActivityFilterStore.getState().toggleActionType('created')
      useActivityFilterStore.getState().toggleActionType('created')
      expect(useActivityFilterStore.getState().actionTypes).toEqual([])
    })

    it('여러 액션 타입을 토글한다', () => {
      useActivityFilterStore.getState().toggleActionType('created')
      useActivityFilterStore.getState().toggleActionType('deleted')
      expect(useActivityFilterStore.getState().actionTypes).toEqual(['created', 'deleted'])
    })
  })

  describe('entityTypes', () => {
    it('toggleEntityType으로 엔터티 타입을 추가한다', () => {
      useActivityFilterStore.getState().toggleEntityType('task')
      expect(useActivityFilterStore.getState().entityTypes).toEqual(['task'])
    })

    it('toggleEntityType으로 이미 있는 엔터티 타입을 제거한다', () => {
      useActivityFilterStore.getState().toggleEntityType('task')
      useActivityFilterStore.getState().toggleEntityType('task')
      expect(useActivityFilterStore.getState().entityTypes).toEqual([])
    })
  })

  describe('userIds', () => {
    it('toggleUserId로 사용자를 추가한다', () => {
      useActivityFilterStore.getState().toggleUserId('user-1')
      expect(useActivityFilterStore.getState().userIds).toEqual(['user-1'])
    })

    it('toggleUserId로 이미 있는 사용자를 제거한다', () => {
      useActivityFilterStore.getState().toggleUserId('user-1')
      useActivityFilterStore.getState().toggleUserId('user-1')
      expect(useActivityFilterStore.getState().userIds).toEqual([])
    })
  })

  describe('resetFilters', () => {
    it('모든 필터를 초기화한다', () => {
      useActivityFilterStore.getState().setSearchText('test')
      useActivityFilterStore.getState().toggleActionType('created')
      useActivityFilterStore.getState().toggleEntityType('task')
      useActivityFilterStore.getState().toggleUserId('user-1')

      useActivityFilterStore.getState().resetFilters()

      const state = useActivityFilterStore.getState()
      expect(state.searchText).toBe('')
      expect(state.actionTypes).toEqual([])
      expect(state.entityTypes).toEqual([])
      expect(state.userIds).toEqual([])
    })
  })

  describe('hasActiveFilters', () => {
    it('초기 상태에서는 false를 반환한다', () => {
      expect(useActivityFilterStore.getState().hasActiveFilters()).toBe(false)
    })

    it('검색어가 있으면 true를 반환한다', () => {
      useActivityFilterStore.getState().setSearchText('test')
      expect(useActivityFilterStore.getState().hasActiveFilters()).toBe(true)
    })

    it('액션 타입 필터가 있으면 true를 반환한다', () => {
      useActivityFilterStore.getState().toggleActionType('updated')
      expect(useActivityFilterStore.getState().hasActiveFilters()).toBe(true)
    })

    it('엔터티 타입 필터가 있으면 true를 반환한다', () => {
      useActivityFilterStore.getState().toggleEntityType('column')
      expect(useActivityFilterStore.getState().hasActiveFilters()).toBe(true)
    })

    it('사용자 필터가 있으면 true를 반환한다', () => {
      useActivityFilterStore.getState().toggleUserId('user-1')
      expect(useActivityFilterStore.getState().hasActiveFilters()).toBe(true)
    })
  })
})
