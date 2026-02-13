import type { SupabaseClient } from '@supabase/supabase-js'

import type { ServiceResult } from '@/types/common'
import type { Database, Tables, InsertTables, UpdateTables } from '@/types/database'

type Client = SupabaseClient<Database>
type Subtask = Tables<'subtasks'>

export async function getSubtasks(
  supabase: Client,
  taskId: string,
): Promise<ServiceResult<Subtask[]>> {
  const { data, error } = await supabase
    .from('subtasks')
    .select('*')
    .eq('task_id', taskId)
    .order('position', { ascending: true })
    .returns<Subtask[]>()

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  return { data, error: null }
}

export async function createSubtask(
  supabase: Client,
  input: InsertTables<'subtasks'>,
): Promise<ServiceResult<Subtask>> {
  const { data, error } = await supabase
    .from('subtasks')
    .insert(input)
    .select('*')
    .returns<Subtask[]>()
    .single()

  if (error || !data) {
    return {
      data: null,
      error: { code: error?.code ?? 'UNKNOWN', message: error?.message ?? '서브태스크 생성 실패' },
    }
  }

  return { data, error: null }
}

export async function updateSubtask(
  supabase: Client,
  subtaskId: string,
  input: UpdateTables<'subtasks'>,
): Promise<ServiceResult<Subtask>> {
  const { data, error } = await supabase
    .from('subtasks')
    .update(input)
    .eq('id', subtaskId)
    .select('*')
    .returns<Subtask[]>()
    .single()

  if (error || !data) {
    return {
      data: null,
      error: { code: error?.code ?? 'UNKNOWN', message: error?.message ?? '서브태스크 수정 실패' },
    }
  }

  return { data, error: null }
}

export async function deleteSubtask(
  supabase: Client,
  subtaskId: string,
): Promise<ServiceResult<null>> {
  const { error } = await supabase.from('subtasks').delete().eq('id', subtaskId)

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  return { data: null, error: null }
}
