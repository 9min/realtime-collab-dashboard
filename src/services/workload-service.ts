import type { SupabaseClient } from '@supabase/supabase-js'

import type { ServiceResult } from '@/types/common'
import type { Database } from '@/types/database'
import type { MemberWorkload } from '@/types/workload'

type Client = SupabaseClient<Database>

export async function getWorkload(
  supabase: Client,
  projectId: string,
): Promise<ServiceResult<MemberWorkload[]>> {
  // 1. 프로젝트 멤버 조회
  const { data: members, error: membersError } = await supabase
    .from('project_members')
    .select('user_id, profiles:user_id(full_name, email, avatar_url)')
    .eq('project_id', projectId)

  if (membersError) {
    return { data: null, error: { code: membersError.code, message: membersError.message } }
  }

  // 2. 완료되지 않은 태스크 조회 (is_done_column이 아닌 컬럼의 태스크)
  const { data: doneColumns } = await supabase
    .from('kanban_columns')
    .select('id')
    .eq('project_id', projectId)
    .eq('is_done_column', true)

  const doneColumnIds = (doneColumns ?? []).map((c) => c.id)

  let taskQuery = supabase
    .from('tasks')
    .select('assignee_id, priority')
    .eq('project_id', projectId)
    .not('assignee_id', 'is', null)

  if (doneColumnIds.length > 0) {
    // 필터: 완료 컬럼에 있지 않은 태스크만
    for (const colId of doneColumnIds) {
      taskQuery = taskQuery.neq('column_id', colId)
    }
  }

  const { data: tasks, error: tasksError } = await taskQuery

  if (tasksError) {
    return { data: null, error: { code: tasksError.code, message: tasksError.message } }
  }

  // 3. 멤버별 태스크 집계
  const workloadMap = new Map<string, MemberWorkload>()

  for (const member of members ?? []) {
    const raw = member as Record<string, unknown>
    const profiles = raw.profiles as {
      full_name: string | null
      email: string
      avatar_url: string | null
    } | null

    workloadMap.set(member.user_id, {
      userId: member.user_id,
      userName: profiles?.full_name ?? profiles?.email ?? '알 수 없음',
      avatarUrl: profiles?.avatar_url ?? null,
      tasksByPriority: { low: 0, medium: 0, high: 0, urgent: 0 },
      totalTasks: 0,
    })
  }

  for (const task of tasks ?? []) {
    const assigneeId = task.assignee_id as string
    const entry = workloadMap.get(assigneeId)
    if (entry) {
      const priority = task.priority as keyof MemberWorkload['tasksByPriority']
      entry.tasksByPriority[priority]++
      entry.totalTasks++
    }
  }

  const result = Array.from(workloadMap.values()).sort((a, b) => b.totalTasks - a.totalTasks)

  return { data: result, error: null }
}
