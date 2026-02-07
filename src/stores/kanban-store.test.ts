import { describe, it, expect, beforeEach } from 'vitest'
import { useKanbanStore } from './kanban-store'

describe('useKanbanStore', () => {
  beforeEach(() => {
    useKanbanStore.setState({
      isDragging: false,
      draggingTaskId: null,
      selectedTaskId: null,
      createTaskColumnId: null,
    })
  })

  describe('DnD 상태', () => {
    it('초기 상태: 드래그 중 아님', () => {
      expect(useKanbanStore.getState().isDragging).toBe(false)
      expect(useKanbanStore.getState().draggingTaskId).toBeNull()
    })

    it('setDragging: 드래그 시작/종료', () => {
      useKanbanStore.getState().setDragging(true)
      expect(useKanbanStore.getState().isDragging).toBe(true)

      useKanbanStore.getState().setDragging(false)
      expect(useKanbanStore.getState().isDragging).toBe(false)
    })

    it('setDraggingTaskId: 드래그 중인 태스크 추적', () => {
      const taskId = 'task-123'
      useKanbanStore.getState().setDraggingTaskId(taskId)
      expect(useKanbanStore.getState().draggingTaskId).toBe(taskId)

      useKanbanStore.getState().setDraggingTaskId(null)
      expect(useKanbanStore.getState().draggingTaskId).toBeNull()
    })
  })

  describe('태스크 선택', () => {
    it('setSelectedTaskId: 태스크 선택/해제', () => {
      useKanbanStore.getState().setSelectedTaskId('task-456')
      expect(useKanbanStore.getState().selectedTaskId).toBe('task-456')

      useKanbanStore.getState().setSelectedTaskId(null)
      expect(useKanbanStore.getState().selectedTaskId).toBeNull()
    })
  })

  describe('태스크 생성', () => {
    it('setCreateTaskColumnId: 생성 대상 컬럼 설정/해제', () => {
      useKanbanStore.getState().setCreateTaskColumnId('col-1')
      expect(useKanbanStore.getState().createTaskColumnId).toBe('col-1')

      useKanbanStore.getState().setCreateTaskColumnId(null)
      expect(useKanbanStore.getState().createTaskColumnId).toBeNull()
    })
  })
})
