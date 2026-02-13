import type { SupabaseClient } from '@supabase/supabase-js'

import type { ServiceResult } from '@/types/common'
import type { Database, Json } from '@/types/database'
import type {
  TaskTemplate,
  CreateTaskTemplateInput,
  UpdateTaskTemplateInput,
  SubtaskTemplate,
} from '@/types/task-template'

type Client = SupabaseClient<Database>

export async function getTaskTemplates(
  supabase: Client,
  projectId: string,
): Promise<ServiceResult<TaskTemplate[]>> {
  const { data, error } = await supabase
    .from('task_templates')
    .select('*')
    .eq('project_id', projectId)
    .order('position', { ascending: true })

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  const templates: TaskTemplate[] = (data ?? []).map((row) => ({
    id: row.id as string,
    project_id: row.project_id as string,
    created_by: row.created_by as string,
    name: row.name as string,
    description_template: (row.description_template as string) ?? null,
    priority: row.priority as TaskTemplate['priority'],
    subtasks_template: (row.subtasks_template as unknown as SubtaskTemplate[]) ?? [],
    labels_template: (row.labels_template as string[]) ?? [],
    is_personal: row.is_personal as boolean,
    position: row.position as number,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }))

  return { data: templates, error: null }
}

export async function createTaskTemplate(
  supabase: Client,
  input: CreateTaskTemplateInput & { created_by: string },
): Promise<ServiceResult<TaskTemplate>> {
  const { data, error } = await supabase
    .from('task_templates')
    .insert({
      project_id: input.project_id,
      created_by: input.created_by,
      name: input.name,
      description_template: input.description_template ?? null,
      priority: input.priority ?? 'medium',
      subtasks_template: (input.subtasks_template ?? []) as unknown as Json,
      labels_template: (input.labels_template ?? []) as unknown as Json,
      is_personal: input.is_personal ?? false,
    })
    .select('*')
    .single()

  if (error || !data) {
    return {
      data: null,
      error: { code: error?.code ?? 'UNKNOWN', message: error?.message ?? '템플릿 생성 실패' },
    }
  }

  const template: TaskTemplate = {
    id: data.id as string,
    project_id: data.project_id as string,
    created_by: data.created_by as string,
    name: data.name as string,
    description_template: (data.description_template as string) ?? null,
    priority: data.priority as TaskTemplate['priority'],
    subtasks_template: (data.subtasks_template as unknown as SubtaskTemplate[]) ?? [],
    labels_template: (data.labels_template as string[]) ?? [],
    is_personal: data.is_personal as boolean,
    position: data.position as number,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  }

  return { data: template, error: null }
}

export async function updateTaskTemplate(
  supabase: Client,
  templateId: string,
  input: UpdateTaskTemplateInput,
): Promise<ServiceResult<TaskTemplate>> {
  const updateData: Record<string, unknown> = {}
  if (input.name !== undefined) updateData.name = input.name
  if (input.description_template !== undefined)
    updateData.description_template = input.description_template
  if (input.priority !== undefined) updateData.priority = input.priority
  if (input.subtasks_template !== undefined) updateData.subtasks_template = input.subtasks_template
  if (input.labels_template !== undefined) updateData.labels_template = input.labels_template
  if (input.is_personal !== undefined) updateData.is_personal = input.is_personal
  if (input.position !== undefined) updateData.position = input.position

  const { data, error } = await supabase
    .from('task_templates')
    .update(updateData)
    .eq('id', templateId)
    .select('*')
    .single()

  if (error || !data) {
    return {
      data: null,
      error: { code: error?.code ?? 'UNKNOWN', message: error?.message ?? '템플릿 수정 실패' },
    }
  }

  const template: TaskTemplate = {
    id: data.id as string,
    project_id: data.project_id as string,
    created_by: data.created_by as string,
    name: data.name as string,
    description_template: (data.description_template as string) ?? null,
    priority: data.priority as TaskTemplate['priority'],
    subtasks_template: (data.subtasks_template as unknown as SubtaskTemplate[]) ?? [],
    labels_template: (data.labels_template as string[]) ?? [],
    is_personal: data.is_personal as boolean,
    position: data.position as number,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  }

  return { data: template, error: null }
}

export async function deleteTaskTemplate(
  supabase: Client,
  templateId: string,
): Promise<ServiceResult<null>> {
  const { error } = await supabase.from('task_templates').delete().eq('id', templateId)

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  return { data: null, error: null }
}

export async function createTaskFromTemplate(
  supabase: Client,
  templateId: string,
  columnId: string,
  userId: string,
  projectId: string,
): Promise<ServiceResult<{ taskId: string }>> {
  // 1. Fetch template
  const { data: templateData, error: templateError } = await supabase
    .from('task_templates')
    .select('*')
    .eq('id', templateId)
    .single()

  if (templateError || !templateData) {
    return {
      data: null,
      error: {
        code: templateError?.code ?? 'NOT_FOUND',
        message: templateError?.message ?? '템플릿을 찾을 수 없습니다',
      },
    }
  }

  const template = templateData as Record<string, unknown>
  const subtasksTemplate = (template.subtasks_template as unknown as SubtaskTemplate[]) ?? []
  const labelsTemplate = (template.labels_template as string[]) ?? []

  // 2. Get current task count in column for position
  const { data: columnTasks } = await supabase.from('tasks').select('id').eq('column_id', columnId)

  const nextPosition = columnTasks?.length ?? 0

  // 3. Create task
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .insert({
      project_id: projectId,
      column_id: columnId,
      title: template.name as string,
      description: (template.description_template as string) ?? undefined,
      priority: template.priority as TaskTemplate['priority'],
      position: nextPosition,
      created_by: userId,
    })
    .select('*')
    .single()

  if (taskError || !task) {
    return {
      data: null,
      error: {
        code: taskError?.code ?? 'UNKNOWN',
        message: taskError?.message ?? '템플릿에서 태스크 생성 실패',
      },
    }
  }

  const taskId = (task as Record<string, unknown>).id as string

  // 4. Create subtasks
  if (subtasksTemplate.length > 0) {
    const subtaskInserts = subtasksTemplate.map((st) => ({
      task_id: taskId,
      project_id: projectId,
      title: st.title,
      position: st.position,
      completed: false,
      created_by: userId,
    }))

    const { error: subtaskError } = await supabase.from('subtasks').insert(subtaskInserts)
    if (subtaskError) {
      return {
        data: null,
        error: {
          code: subtaskError.code,
          message: '템플릿 서브태스크 생성 실패: ' + subtaskError.message,
        },
      }
    }
  }

  // 5. Add labels
  if (labelsTemplate.length > 0) {
    const labelInserts = labelsTemplate.map((labelId) => ({
      task_id: taskId,
      label_id: labelId,
    }))

    const { error: labelError } = await supabase.from('task_labels').insert(labelInserts)
    if (labelError) {
      return {
        data: null,
        error: { code: labelError.code, message: '템플릿 라벨 연결 실패: ' + labelError.message },
      }
    }
  }

  return { data: { taskId }, error: null }
}
