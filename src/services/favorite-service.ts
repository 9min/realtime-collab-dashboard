import type { SupabaseClient } from '@supabase/supabase-js'

import type { ServiceResult } from '@/types/common'
import type { Database } from '@/types/database'
import type { TaskFavorite, FavoriteTaskWithProject } from '@/types/favorite'

type Client = SupabaseClient<Database>

export async function getMyFavoriteIds(
  supabase: Client,
  userId: string,
): Promise<ServiceResult<string[]>> {
  const { data, error } = await supabase
    .from('task_favorites' as never)
    .select('task_id')
    .eq('user_id', userId)

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  const ids = ((data ?? []) as Array<{ task_id: string }>).map((r) => r.task_id)
  return { data: ids, error: null }
}

export async function addFavorite(
  supabase: Client,
  userId: string,
  taskId: string,
): Promise<ServiceResult<TaskFavorite>> {
  const { data, error } = await supabase
    .from('task_favorites' as never)
    .insert({ user_id: userId, task_id: taskId } as never)
    .select('*')
    .single()

  if (error || !data) {
    return {
      data: null,
      error: { code: error?.code ?? 'UNKNOWN', message: error?.message ?? '즐겨찾기 추가 실패' },
    }
  }

  return { data: data as unknown as TaskFavorite, error: null }
}

export async function removeFavorite(
  supabase: Client,
  userId: string,
  taskId: string,
): Promise<ServiceResult<null>> {
  const { error } = await supabase
    .from('task_favorites' as never)
    .delete()
    .eq('user_id', userId)
    .eq('task_id', taskId)

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  return { data: null, error: null }
}

export async function getFavoriteTasks(
  supabase: Client,
  userId: string,
): Promise<ServiceResult<FavoriteTaskWithProject[]>> {
  const { data: favorites, error: favError } = await supabase
    .from('task_favorites' as never)
    .select('task_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (favError) {
    return { data: null, error: { code: favError.code, message: favError.message } }
  }

  const taskIds = ((favorites ?? []) as Array<{ task_id: string }>).map((r) => r.task_id)
  if (taskIds.length === 0) {
    return { data: [], error: null }
  }

  const { data: tasks, error: taskError } = await supabase
    .from('tasks')
    .select('*, projects:project_id(name)')
    .in('id', taskIds)

  if (taskError) {
    return { data: null, error: { code: taskError.code, message: taskError.message } }
  }

  const result: FavoriteTaskWithProject[] = (tasks ?? []).map((t) => {
    const raw = t as unknown as Record<string, unknown>
    const projects = raw.projects as { name: string } | null
    return {
      id: raw.id,
      project_id: raw.project_id,
      column_id: raw.column_id,
      title: raw.title,
      description: raw.description,
      priority: raw.priority,
      assignee_id: raw.assignee_id,
      position: raw.position,
      due_date: raw.due_date,
      created_by: raw.created_by,
      created_at: raw.created_at,
      updated_at: raw.updated_at,
      project_name: projects?.name ?? '알 수 없음',
    } as FavoriteTaskWithProject
  })

  return { data: result, error: null }
}
