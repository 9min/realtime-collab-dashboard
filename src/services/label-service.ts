import type { SupabaseClient } from '@supabase/supabase-js'

import type { ServiceResult } from '@/types/common'
import type { Database, Tables, InsertTables, UpdateTables } from '@/types/database'

type Client = SupabaseClient<Database>
type Label = Tables<'labels'>
type TaskLabel = Tables<'task_labels'>

export async function getLabels(
  supabase: Client,
  projectId: string,
): Promise<ServiceResult<Label[]>> {
  const { data, error } = await supabase
    .from('labels')
    .select('*')
    .eq('project_id', projectId)
    .order('name', { ascending: true })
    .returns<Label[]>()

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  return { data, error: null }
}

export async function createLabel(
  supabase: Client,
  input: InsertTables<'labels'>,
): Promise<ServiceResult<Label>> {
  const { data, error } = await supabase
    .from('labels')
    .insert(input)
    .select('*')
    .returns<Label[]>()
    .single()

  if (error || !data) {
    return {
      data: null,
      error: { code: error?.code ?? 'UNKNOWN', message: error?.message ?? '라벨 생성 실패' },
    }
  }

  return { data, error: null }
}

export async function updateLabel(
  supabase: Client,
  labelId: string,
  input: UpdateTables<'labels'>,
): Promise<ServiceResult<Label>> {
  const { data, error } = await supabase
    .from('labels')
    .update(input)
    .eq('id', labelId)
    .select('*')
    .returns<Label[]>()
    .single()

  if (error || !data) {
    return {
      data: null,
      error: { code: error?.code ?? 'UNKNOWN', message: error?.message ?? '라벨 수정 실패' },
    }
  }

  return { data, error: null }
}

export async function deleteLabel(supabase: Client, labelId: string): Promise<ServiceResult<null>> {
  const { error } = await supabase.from('labels').delete().eq('id', labelId)

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  return { data: null, error: null }
}

export async function getTaskLabels(
  supabase: Client,
  projectId: string,
): Promise<ServiceResult<TaskLabel[]>> {
  // labels 테이블 join으로 프로젝트 소속 task_labels만 가져오기
  const { data, error } = await supabase
    .from('task_labels')
    .select('task_id, label_id, labels!inner(project_id)')
    .eq('labels.project_id', projectId)

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  // task_id + label_id만 추출
  const taskLabels: TaskLabel[] = (data ?? []).map((row) => ({
    task_id: (row as Record<string, unknown>).task_id as string,
    label_id: (row as Record<string, unknown>).label_id as string,
  }))

  return { data: taskLabels, error: null }
}

export async function addTaskLabels(
  supabase: Client,
  taskId: string,
  labelIds: string[],
): Promise<ServiceResult<TaskLabel[]>> {
  if (labelIds.length === 0) return { data: [], error: null }

  const { data, error } = await supabase
    .from('task_labels')
    .insert(labelIds.map((labelId) => ({ task_id: taskId, label_id: labelId })))
    .select('*')
    .returns<TaskLabel[]>()

  if (error) {
    return {
      data: null,
      error: { code: error.code, message: error.message },
    }
  }

  return { data: data ?? [], error: null }
}

export async function addTaskLabel(
  supabase: Client,
  taskId: string,
  labelId: string,
): Promise<ServiceResult<TaskLabel>> {
  const { data, error } = await supabase
    .from('task_labels')
    .insert({ task_id: taskId, label_id: labelId })
    .select('*')
    .returns<TaskLabel[]>()
    .single()

  if (error || !data) {
    return {
      data: null,
      error: { code: error?.code ?? 'UNKNOWN', message: error?.message ?? '라벨 할당 실패' },
    }
  }

  return { data, error: null }
}

export async function removeTaskLabel(
  supabase: Client,
  taskId: string,
  labelId: string,
): Promise<ServiceResult<null>> {
  const { error } = await supabase
    .from('task_labels')
    .delete()
    .eq('task_id', taskId)
    .eq('label_id', labelId)

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  return { data: null, error: null }
}
