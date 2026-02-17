import type { Tables } from './database'
import type { TaskPriority } from './common'

// DB 테이블 기반 타입
export type Task = Tables<'tasks'>
export type KanbanColumn = Tables<'kanban_columns'>

// 컬럼 + 태스크 결합 (칸반 보드 렌더링용)
export interface KanbanColumnWithTasks extends KanbanColumn {
  tasks: Task[]
}

// 태스크 생성 폼 데이터
export interface CreateTaskInput {
  title: string
  description?: string
  priority: TaskPriority
  assignee_id?: string
  start_date?: string
  due_date?: string
}

// 태스크 이동 (DnD)
export interface MoveTaskPayload {
  taskId: string
  sourceColumnId: string
  destinationColumnId: string
  newPosition: number
}

// 컬럼 이동 (DnD)
export interface MoveColumnPayload {
  columnId: string
  newPosition: number
}
