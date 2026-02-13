import type { SupabaseClient } from '@supabase/supabase-js'

import type { ServiceResult, CursorPaginatedResult } from '@/types/common'
import type { Database, Tables, InsertTables, UpdateTables } from '@/types/database'
import type { MoveTaskPayload } from '@/types/kanban'

type Client = SupabaseClient<Database>
type Task = Tables<'tasks'>

const TASKS_PAGE_SIZE = 50

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

// 커서 기반 페이지네이션 태스크 조회
export async function getTasksByProjectPaginated(
  supabase: Client,
  projectId: string,
  options: { cursor?: string | null; limit?: number } = {},
): Promise<ServiceResult<CursorPaginatedResult<Task>>> {
  const limit = options.limit ?? TASKS_PAGE_SIZE

  let query = supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1)

  if (options.cursor) {
    query = query.lt('created_at', options.cursor)
  }

  const { data, error } = await query.returns<Task[]>()

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  const hasMore = (data?.length ?? 0) > limit
  const items = hasMore ? data!.slice(0, limit) : (data ?? [])
  const nextCursor = hasMore ? items[items.length - 1].created_at : null

  return {
    data: { data: items, nextCursor, hasMore },
    error: null,
  }
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

// 태스크 삭제 (Storage 첨부파일 정리 포함)
export async function deleteTask(supabase: Client, taskId: string): Promise<ServiceResult<null>> {
  // 1. 해당 태스크의 모든 첨부파일 file_path 조회
  const { data: attachments } = await supabase
    .from('task_attachments')
    .select('file_path')
    .eq('task_id', taskId)
    .returns<Pick<Tables<'task_attachments'>, 'file_path'>[]>()

  // 2. Storage에서 파일 일괄 삭제 (첨부파일이 있을 때만)
  const filePaths = attachments?.map((a) => a.file_path).filter(Boolean) ?? []
  if (filePaths.length > 0) {
    await supabase.storage.from('task-attachments').remove(filePaths)
    // Storage 삭제 실패는 태스크 삭제를 막지 않음 (best-effort)
  }

  // 3. 태스크 삭제
  const { error } = await supabase.from('tasks').delete().eq('id', taskId)

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
