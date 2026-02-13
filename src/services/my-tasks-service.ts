import type { SupabaseClient } from '@supabase/supabase-js'

import type { ServiceResult } from '@/types/common'
import type { Database, Tables } from '@/types/database'

type Client = SupabaseClient<Database>

export interface MyTaskWithProject extends Tables<'tasks'> {
  project_name: string
  column_title: string
}

/**
 * 내 태스크 조회
 *
 * 1) task_assignees 테이블에서 해당 유저가 assignee/watcher인 태스크 ID 조회
 * 2) 기존 assignee_id 기반 태스크도 포함 (하위 호환)
 * 3) 두 결과를 합쳐서 중복 제거 후 반환
 */
export async function getMyTasks(
  supabase: Client,
  userId: string,
): Promise<ServiceResult<MyTaskWithProject[]>> {
  // 1. task_assignees 기반 태스크 조회
  const { data: assigneeEntries, error: assigneeError } = await supabase
    .from('task_assignees')
    .select('task_id')
    .eq('user_id', userId)

  if (assigneeError) {
    return { data: null, error: { code: assigneeError.code, message: assigneeError.message } }
  }

  const assignedTaskIds = (assigneeEntries ?? []).map(
    (e) => (e as Record<string, unknown>).task_id as string,
  )

  // 2. 기존 assignee_id 기반 + task_assignees 기반 통합 조회
  // assignee_id = userId OR id IN (assignedTaskIds)
  let query = supabase
    .from('tasks')
    .select('*, projects:project_id(name), kanban_columns:column_id(title)')
    .order('due_date', { ascending: true, nullsFirst: false })

  if (assignedTaskIds.length > 0) {
    query = query.or(`assignee_id.eq.${userId},id.in.(${assignedTaskIds.join(',')})`)
  } else {
    query = query.eq('assignee_id', userId)
  }

  const { data, error } = await query

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  const tasks: MyTaskWithProject[] = (data ?? []).map((t) => {
    const raw = t as unknown as Record<string, unknown>
    const projects = raw.projects as { name: string } | null
    const columns = raw.kanban_columns as { title: string } | null
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
      column_title: columns?.title ?? '알 수 없음',
    } as MyTaskWithProject
  })

  return { data: tasks, error: null }
}
