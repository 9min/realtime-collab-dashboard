import type { SupabaseClient } from '@supabase/supabase-js'

import type { ServiceResult } from '@/types/common'
import type { Database } from '@/types/database'
import type { TaskAssignee, TaskAssigneeRole, TaskAssigneeWithProfile } from '@/types/task-assignee'

type Client = SupabaseClient<Database>

// 태스크의 담당자/워처 목록 조회 (프로필 포함)
export async function getTaskAssignees(
  supabase: Client,
  taskId: string,
): Promise<ServiceResult<TaskAssigneeWithProfile[]>> {
  const { data, error } = await supabase
    .from('task_assignees')
    .select('*, profiles:user_id(full_name, email, avatar_url)')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  const assignees: TaskAssigneeWithProfile[] = (data ?? []).map((row) => {
    const raw = row as unknown as Record<string, unknown>
    const profiles = raw.profiles as {
      full_name: string | null
      email: string
      avatar_url: string | null
    }
    return {
      id: raw.id as string,
      task_id: raw.task_id as string,
      user_id: raw.user_id as string,
      role: raw.role as TaskAssigneeRole,
      created_at: raw.created_at as string,
      profiles,
    }
  })

  return { data: assignees, error: null }
}

// 프로젝트의 모든 태스크 담당자 매핑 조회 (프로필 포함)
export async function getProjectTaskAssignees(
  supabase: Client,
  projectId: string,
): Promise<ServiceResult<TaskAssigneeWithProfile[]>> {
  const { data, error } = await supabase
    .from('task_assignees')
    .select('*, profiles:user_id(full_name, email, avatar_url), tasks!inner(project_id)')
    .eq('tasks.project_id', projectId)

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  const assignees: TaskAssigneeWithProfile[] = (data ?? []).map((row) => {
    const raw = row as unknown as Record<string, unknown>
    const profiles = raw.profiles as {
      full_name: string | null
      email: string
      avatar_url: string | null
    }
    return {
      id: raw.id as string,
      task_id: raw.task_id as string,
      user_id: raw.user_id as string,
      role: raw.role as TaskAssigneeRole,
      created_at: raw.created_at as string,
      profiles,
    }
  })

  return { data: assignees, error: null }
}

// 담당자/워처 추가
export async function addTaskAssignee(
  supabase: Client,
  taskId: string,
  userId: string,
  role: TaskAssigneeRole = 'assignee',
): Promise<ServiceResult<TaskAssignee>> {
  const { data, error } = await supabase
    .from('task_assignees')
    .insert({ task_id: taskId, user_id: userId, role })
    .select('*')
    .returns<TaskAssignee[]>()
    .single()

  if (error || !data) {
    return {
      data: null,
      error: { code: error?.code ?? 'UNKNOWN', message: error?.message ?? '담당자 추가 실패' },
    }
  }

  return { data, error: null }
}

// 담당자/워처 제거
export async function removeTaskAssignee(
  supabase: Client,
  taskId: string,
  userId: string,
): Promise<ServiceResult<null>> {
  const { error } = await supabase
    .from('task_assignees')
    .delete()
    .eq('task_id', taskId)
    .eq('user_id', userId)

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  return { data: null, error: null }
}

// 역할 변경 (assignee ↔ watcher)
export async function updateTaskAssigneeRole(
  supabase: Client,
  taskId: string,
  userId: string,
  role: TaskAssigneeRole,
): Promise<ServiceResult<TaskAssignee>> {
  const { data, error } = await supabase
    .from('task_assignees')
    .update({ role })
    .eq('task_id', taskId)
    .eq('user_id', userId)
    .select('*')
    .returns<TaskAssignee[]>()
    .single()

  if (error || !data) {
    return {
      data: null,
      error: { code: error?.code ?? 'UNKNOWN', message: error?.message ?? '역할 변경 실패' },
    }
  }

  return { data, error: null }
}
