import { describe, it, expect, beforeEach } from 'vitest'

import { useSprintStore } from './sprint-store'

describe('useSprintStore', () => {
  beforeEach(() => {
    useSprintStore.setState({
      viewMode: 'board',
      selectedSprintId: null,
    })
  })

  describe('viewMode', () => {
    it('초기 상태: board', () => {
      expect(useSprintStore.getState().viewMode).toBe('board')
    })

    it('setViewMode: 뷰 모드 변경', () => {
      useSprintStore.getState().setViewMode('backlog')
      expect(useSprintStore.getState().viewMode).toBe('backlog')

      useSprintStore.getState().setViewMode('board')
      expect(useSprintStore.getState().viewMode).toBe('board')
    })
  })

  describe('selectedSprintId', () => {
    it('초기 상태: null', () => {
      expect(useSprintStore.getState().selectedSprintId).toBeNull()
    })

    it('setSelectedSprintId: 스프린트 선택/해제', () => {
      useSprintStore.getState().setSelectedSprintId('sprint-123')
      expect(useSprintStore.getState().selectedSprintId).toBe('sprint-123')

      useSprintStore.getState().setSelectedSprintId(null)
      expect(useSprintStore.getState().selectedSprintId).toBeNull()
    })
  })
})
