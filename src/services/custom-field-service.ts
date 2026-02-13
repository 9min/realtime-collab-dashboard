import type { SupabaseClient } from '@supabase/supabase-js'

import type { ServiceResult } from '@/types/common'
import type { Database } from '@/types/database'
import type {
  CustomFieldDefinition,
  TaskCustomFieldValue,
  CreateCustomFieldInput,
  UpdateCustomFieldInput,
} from '@/types/custom-field'

type Client = SupabaseClient<Database>

export async function getCustomFieldDefinitions(
  supabase: Client,
  projectId: string,
): Promise<ServiceResult<CustomFieldDefinition[]>> {
  const { data, error } = await supabase
    .from('custom_field_definitions')
    .select('*')
    .eq('project_id', projectId)
    .order('position', { ascending: true })
    .returns<CustomFieldDefinition[]>()

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  return { data: data ?? [], error: null }
}

export async function createCustomFieldDefinition(
  supabase: Client,
  input: CreateCustomFieldInput,
): Promise<ServiceResult<CustomFieldDefinition>> {
  const { data, error } = await supabase
    .from('custom_field_definitions')
    .insert({
      project_id: input.project_id,
      name: input.name,
      field_type: input.field_type,
      options: input.options ?? null,
      is_required: input.is_required ?? false,
    })
    .select('*')
    .returns<CustomFieldDefinition[]>()
    .single()

  if (error || !data) {
    return {
      data: null,
      error: {
        code: error?.code ?? 'UNKNOWN',
        message: error?.message ?? '커스텀 필드 생성 실패',
      },
    }
  }

  return { data, error: null }
}

export async function updateCustomFieldDefinition(
  supabase: Client,
  fieldId: string,
  input: UpdateCustomFieldInput,
): Promise<ServiceResult<CustomFieldDefinition>> {
  const { data, error } = await supabase
    .from('custom_field_definitions')
    .update(input)
    .eq('id', fieldId)
    .select('*')
    .returns<CustomFieldDefinition[]>()
    .single()

  if (error || !data) {
    return {
      data: null,
      error: {
        code: error?.code ?? 'UNKNOWN',
        message: error?.message ?? '커스텀 필드 수정 실패',
      },
    }
  }

  return { data, error: null }
}

export async function deleteCustomFieldDefinition(
  supabase: Client,
  fieldId: string,
): Promise<ServiceResult<null>> {
  const { error } = await supabase.from('custom_field_definitions').delete().eq('id', fieldId)

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  return { data: null, error: null }
}

export async function getTaskCustomFieldValues(
  supabase: Client,
  projectId: string,
): Promise<ServiceResult<TaskCustomFieldValue[]>> {
  const { data, error } = await supabase
    .from('task_custom_field_values')
    .select('*, custom_field_definitions!inner(project_id)')
    .eq('custom_field_definitions.project_id', projectId)

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  const values: TaskCustomFieldValue[] = (data ?? []).map((row) => ({
    id: (row as Record<string, unknown>).id as string,
    task_id: (row as Record<string, unknown>).task_id as string,
    field_id: (row as Record<string, unknown>).field_id as string,
    value: (row as Record<string, unknown>).value as string | null,
    created_at: (row as Record<string, unknown>).created_at as string,
    updated_at: (row as Record<string, unknown>).updated_at as string,
  }))

  return { data: values, error: null }
}

export async function setTaskCustomFieldValue(
  supabase: Client,
  taskId: string,
  fieldId: string,
  value: string | null,
): Promise<ServiceResult<TaskCustomFieldValue>> {
  const { data, error } = await supabase
    .from('task_custom_field_values')
    .upsert({ task_id: taskId, field_id: fieldId, value }, { onConflict: 'task_id,field_id' })
    .select('*')
    .returns<TaskCustomFieldValue[]>()
    .single()

  if (error || !data) {
    return {
      data: null,
      error: {
        code: error?.code ?? 'UNKNOWN',
        message: error?.message ?? '커스텀 필드 값 설정 실패',
      },
    }
  }

  return { data, error: null }
}
