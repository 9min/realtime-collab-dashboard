import type { SupabaseClient } from '@supabase/supabase-js'

import type { ServiceResult } from '@/types/common'
import type { Database } from '@/types/database'
import type {
  TaskRecurrence,
  CreateRecurrenceInput,
  UpdateRecurrenceInput,
} from '@/types/recurrence'

type Client = SupabaseClient<Database>

export async function getRecurrence(
  supabase: Client,
  taskId: string,
): Promise<ServiceResult<TaskRecurrence | null>> {
  const { data, error } = await supabase
    .from('task_recurrences' as never)
    .select('*')
    .eq('task_id', taskId)
    .maybeSingle()

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  return { data: (data as unknown as TaskRecurrence) ?? null, error: null }
}

export async function getProjectRecurrenceTaskIds(
  supabase: Client,
  projectId: string,
): Promise<ServiceResult<string[]>> {
  const { data, error } = await supabase
    .from('task_recurrences' as never)
    .select('task_id')
    .eq('project_id', projectId)
    .eq('is_active', true)

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  const ids = ((data ?? []) as Array<{ task_id: string }>).map((r) => r.task_id)
  return { data: ids, error: null }
}

export async function createRecurrence(
  supabase: Client,
  input: CreateRecurrenceInput,
): Promise<ServiceResult<TaskRecurrence>> {
  const { data, error } = await supabase
    .from('task_recurrences' as never)
    .insert(input as never)
    .select('*')
    .single()

  if (error || !data) {
    return {
      data: null,
      error: { code: error?.code ?? 'UNKNOWN', message: error?.message ?? '반복 설정 생성 실패' },
    }
  }

  return { data: data as unknown as TaskRecurrence, error: null }
}

export async function updateRecurrence(
  supabase: Client,
  recurrenceId: string,
  input: UpdateRecurrenceInput,
): Promise<ServiceResult<TaskRecurrence>> {
  const { data, error } = await supabase
    .from('task_recurrences' as never)
    .update({ ...input, updated_at: new Date().toISOString() } as never)
    .eq('id', recurrenceId)
    .select('*')
    .single()

  if (error || !data) {
    return {
      data: null,
      error: { code: error?.code ?? 'UNKNOWN', message: error?.message ?? '반복 설정 수정 실패' },
    }
  }

  return { data: data as unknown as TaskRecurrence, error: null }
}

export async function deleteRecurrence(
  supabase: Client,
  recurrenceId: string,
): Promise<ServiceResult<null>> {
  const { error } = await supabase
    .from('task_recurrences' as never)
    .delete()
    .eq('id', recurrenceId)

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  return { data: null, error: null }
}
