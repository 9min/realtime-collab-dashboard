import type { Tables, InsertTables, UpdateTables } from '@/types/database'
import type { ServiceResult } from '@/types/common'
import type { MoveTaskPayload } from '@/types/kanban'
import { MOCK_TASKS } from '@/lib/mock-data'

// TODO: Supabase 연결 후 실제 API로 교체
// 현재는 목 데이터 기반 인메모리 구현

let tasks = [...MOCK_TASKS]

export async function getTasksByProject(
  projectId: string,
): Promise<ServiceResult<Tables<'tasks'>[]>> {
  const filtered = tasks
    .filter((t) => t.project_id === projectId)
    .sort((a, b) => a.position - b.position)
  return { data: filtered, error: null }
}

export async function createTask(
  input: InsertTables<'tasks'>,
): Promise<ServiceResult<Tables<'tasks'>>> {
  const newTask: Tables<'tasks'> = {
    id: `task-${Date.now()}`,
    project_id: input.project_id,
    column_id: input.column_id,
    title: input.title,
    description: input.description ?? null,
    priority: input.priority ?? 'medium',
    assignee_id: input.assignee_id ?? null,
    position: input.position,
    due_date: input.due_date ?? null,
    created_by: input.created_by,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  tasks.push(newTask)
  return { data: newTask, error: null }
}

export async function updateTask(
  taskId: string,
  input: UpdateTables<'tasks'>,
): Promise<ServiceResult<Tables<'tasks'>>> {
  const index = tasks.findIndex((t) => t.id === taskId)
  if (index === -1) {
    return { data: null, error: { code: 'NOT_FOUND', message: '태스크를 찾을 수 없습니다' } }
  }
  tasks[index] = { ...tasks[index], ...input, updated_at: new Date().toISOString() }
  return { data: tasks[index], error: null }
}

export async function deleteTask(taskId: string): Promise<ServiceResult<null>> {
  tasks = tasks.filter((t) => t.id !== taskId)
  return { data: null, error: null }
}

// 태스크 이동 (DnD): 컬럼 변경 + 위치 재정렬
export async function moveTask(payload: MoveTaskPayload): Promise<ServiceResult<Tables<'tasks'>>> {
  const { taskId, destinationColumnId, newPosition } = payload
  const index = tasks.findIndex((t) => t.id === taskId)
  if (index === -1) {
    return { data: null, error: { code: 'NOT_FOUND', message: '태스크를 찾을 수 없습니다' } }
  }

  // 대상 컬럼의 기존 태스크 위치 재정렬
  const destTasks = tasks
    .filter((t) => t.column_id === destinationColumnId && t.id !== taskId)
    .sort((a, b) => a.position - b.position)

  destTasks.splice(newPosition, 0, tasks[index])
  destTasks.forEach((t, i) => {
    t.position = i
    t.updated_at = new Date().toISOString()
  })

  // 이동된 태스크 업데이트
  tasks[index] = {
    ...tasks[index],
    column_id: destinationColumnId,
    position: newPosition,
    updated_at: new Date().toISOString(),
  }

  return { data: tasks[index], error: null }
}
