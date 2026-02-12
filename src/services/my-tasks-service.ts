import type { SupabaseClient } from '@supabase/supabase-js'

import type { ServiceResult } from '@/types/common'
import type { Database, Tables } from '@/types/database'

type Client = SupabaseClient<Database>

export interface MyTaskWithProject extends Tables<'tasks'> {
  project_name: string
  column_title: string
}

export async function getMyTasks(
  supabase: Client,
  userId: string,
): Promise<ServiceResult<MyTaskWithProject[]>> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, projects:project_id(name), kanban_columns:column_id(title)')
    .eq('assignee_id', userId)
    .order('due_date', { ascending: true, nullsFirst: false })

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
