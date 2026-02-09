import type { SupabaseClient } from '@supabase/supabase-js'

import type { ServiceResult } from '@/types/common'
import type { Database, Tables, InsertTables, UpdateTables } from '@/types/database'
import type { MoveTaskPayload } from '@/types/kanban'

type Client = SupabaseClient<Database>
type Task = Tables<'tasks'>

// 프로젝트의 전체 태스크 조회
export async function getTasksByProject(
  supabase: Client,
  projectId: string,
): Promise<ServiceResult<Task[]>> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('position', { ascending: true })
    .returns<Task[]>()

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  return { data, error: null }
}

// 태스크 생성
export async function createTask(
  supabase: Client,
  input: InsertTables<'tasks'>,
): Promise<ServiceResult<Task>> {
  const { data, error } = await supabase
    .from('tasks')
    .insert(input)
    .select('*')
    .returns<Task[]>()
    .single()

  if (error || !data) {
    return {
      data: null,
      error: { code: error?.code ?? 'UNKNOWN', message: error?.message ?? '태스크 생성 실패' },
    }
  }

  return { data, error: null }
}

// 태스크 수정
export async function updateTask(
  supabase: Client,
  taskId: string,
  input: UpdateTables<'tasks'>,
): Promise<ServiceResult<Task>> {
  const { data, error } = await supabase
    .from('tasks')
    .update(input)
    .eq('id', taskId)
    .select('*')
    .returns<Task[]>()
    .single()

  if (error || !data) {
    return {
      data: null,
      error: { code: error?.code ?? 'UNKNOWN', message: error?.message ?? '태스크 수정 실패' },
    }
  }

  return { data, error: null }
}

// 태스크 삭제
export async function deleteTask(
  supabase: Client,
  taskId: string,
): Promise<ServiceResult<null>> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  return { data: null, error: null }
}

// 기준 날짜 이전에 생성된 태스크 일괄 삭제
export async function deleteTasksBefore(
  supabase: Client,
  projectId: string,
  beforeDate: string,
): Promise<ServiceResult<{ deletedCount: number }>> {
  const { data, error } = await supabase
    .from('tasks')
    .delete()
    .eq('project_id', projectId)
    .lt('created_at', beforeDate)
    .select('id')

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  return { data: { deletedCount: data?.length ?? 0 }, error: null }
}

// 태스크 이동 (DnD): 컬럼 변경 + 위치 재정렬
export async function moveTask(
  supabase: Client,
  payload: MoveTaskPayload,
): Promise<ServiceResult<Task>> {
  const { taskId, destinationColumnId, newPosition } = payload

  // 1. 대상 컬럼의 기존 태스크 position 재정렬
  const { data: destTasks } = await supabase
    .from('tasks')
    .select('id, position')
    .eq('column_id', destinationColumnId)
    .neq('id', taskId)
    .order('position', { ascending: true })
    .returns<Pick<Task, 'id' | 'position'>[]>()

  if (destTasks) {
    // 새 위치에 공간 확보를 위해 position 재배치
    const reorderUpdates = destTasks.map((t, i) => {
      const pos = i >= newPosition ? i + 1 : i
      return supabase.from('tasks').update({ position: pos }).eq('id', t.id)
    })
    await Promise.all(reorderUpdates)
  }

  // 2. 이동 대상 태스크 업데이트
  const { data, error } = await supabase
    .from('tasks')
    .update({ column_id: destinationColumnId, position: newPosition })
    .eq('id', taskId)
    .select('*')
    .returns<Task[]>()
    .single()

  if (error || !data) {
    return {
      data: null,
      error: { code: error?.code ?? 'UNKNOWN', message: error?.message ?? '태스크 이동 실패' },
    }
  }

  return { data, error: null }
}
