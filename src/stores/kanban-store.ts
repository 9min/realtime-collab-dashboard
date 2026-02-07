import { create } from 'zustand'

interface KanbanState {
  // DnD 진행 중 상태
  isDragging: boolean
  setDragging: (value: boolean) => void

  // 현재 드래그 중인 아이템 ID
  draggingTaskId: string | null
  setDraggingTaskId: (taskId: string | null) => void

  // 태스크 상세 다이얼로그
  selectedTaskId: string | null
  setSelectedTaskId: (taskId: string | null) => void

  // 새 태스크 생성 대상 컬럼
  createTaskColumnId: string | null
  setCreateTaskColumnId: (columnId: string | null) => void
}

export const useKanbanStore = create<KanbanState>((set) => ({
  // DnD
  isDragging: false,
  setDragging: (value) => set({ isDragging: value }),

  draggingTaskId: null,
  setDraggingTaskId: (taskId) => set({ draggingTaskId: taskId }),

  // 태스크 상세
  selectedTaskId: null,
  setSelectedTaskId: (taskId) => set({ selectedTaskId: taskId }),

  // 태스크 생성
  createTaskColumnId: null,
  setCreateTaskColumnId: (columnId) => set({ createTaskColumnId: columnId }),
}))
