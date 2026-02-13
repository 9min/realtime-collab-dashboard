import type { SupabaseClient } from '@supabase/supabase-js'

import type { ServiceResult } from '@/types/common'
import type { Database } from '@/types/database'
import type {
  Sprint,
  SprintWithStats,
  CreateSprintInput,
  UpdateSprintInput,
  VelocityDataPoint,
} from '@/types/sprint'

type Client = SupabaseClient<Database>

export async function getSprints(
  supabase: Client,
  projectId: string,
): Promise<ServiceResult<SprintWithStats[]>> {
  const { data: sprints, error } = await supabase
    .from('sprints')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .returns<Sprint[]>()

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  // 각 스프린트별 태스크 통계 집계
  const sprintIds = (sprints ?? []).map((s) => s.id)

  if (sprintIds.length === 0) {
    return { data: [], error: null }
  }

  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('sprint_id, column_id')
    .in('sprint_id', sprintIds)

  if (tasksError) {
    return { data: null, error: { code: tasksError.code, message: tasksError.message } }
  }

  // done 컬럼 조회
  const { data: doneColumns } = await supabase
    .from('kanban_columns')
    .select('id')
    .eq('project_id', projectId)
    .eq('is_done_column', true)

  const doneColumnIds = new Set((doneColumns ?? []).map((c) => c.id))

  const statsMap = new Map<string, { total: number; completed: number }>()
  for (const task of tasks ?? []) {
    const sprintId = task.sprint_id as string
    const stat = statsMap.get(sprintId) ?? { total: 0, completed: 0 }
    stat.total += 1
    if (doneColumnIds.has(task.column_id)) {
      stat.completed += 1
    }
    statsMap.set(sprintId, stat)
  }

  const result: SprintWithStats[] = (sprints ?? []).map((sprint) => {
    const stat = statsMap.get(sprint.id) ?? { total: 0, completed: 0 }
    return {
      ...sprint,
      totalTasks: stat.total,
      completedTasks: stat.completed,
    }
  })

  return { data: result, error: null }
}

export async function createSprint(
  supabase: Client,
  input: CreateSprintInput & { created_by: string },
): Promise<ServiceResult<Sprint>> {
  const { data, error } = await supabase
    .from('sprints')
    .insert({
      project_id: input.project_id,
      name: input.name,
      goal: input.goal ?? null,
      start_date: input.start_date,
      end_date: input.end_date,
      created_by: input.created_by,
    })
    .select('*')
    .returns<Sprint[]>()
    .single()

  if (error || !data) {
    return {
      data: null,
      error: { code: error?.code ?? 'UNKNOWN', message: error?.message ?? '스프린트 생성 실패' },
    }
  }

  return { data, error: null }
}

export async function updateSprint(
  supabase: Client,
  sprintId: string,
  input: UpdateSprintInput,
): Promise<ServiceResult<Sprint>> {
  const { data, error } = await supabase
    .from('sprints')
    .update(input)
    .eq('id', sprintId)
    .select('*')
    .returns<Sprint[]>()
    .single()

  if (error || !data) {
    return {
      data: null,
      error: { code: error?.code ?? 'UNKNOWN', message: error?.message ?? '스프린트 수정 실패' },
    }
  }

  return { data, error: null }
}

export async function deleteSprint(
  supabase: Client,
  sprintId: string,
): Promise<ServiceResult<null>> {
  const { error } = await supabase.from('sprints').delete().eq('id', sprintId)

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  return { data: null, error: null }
}

export async function startSprint(
  supabase: Client,
  sprintId: string,
): Promise<ServiceResult<Sprint>> {
  const { data, error } = await supabase
    .from('sprints')
    .update({ status: 'active' })
    .eq('id', sprintId)
    .select('*')
    .returns<Sprint[]>()
    .single()

  if (error || !data) {
    return {
      data: null,
      error: { code: error?.code ?? 'UNKNOWN', message: error?.message ?? '스프린트 시작 실패' },
    }
  }

  return { data, error: null }
}

export async function completeSprint(
  supabase: Client,
  sprintId: string,
  moveUnfinishedTo: 'backlog' | string,
): Promise<ServiceResult<Sprint>> {
  // 완료 처리
  const { data: sprint, error: updateError } = await supabase
    .from('sprints')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', sprintId)
    .select('*')
    .returns<Sprint[]>()
    .single()

  if (updateError || !sprint) {
    return {
      data: null,
      error: {
        code: updateError?.code ?? 'UNKNOWN',
        message: updateError?.message ?? '스프린트 완료 실패',
      },
    }
  }

  // done 컬럼에 있지 않은 태스크 이동
  const { data: doneColumns } = await supabase
    .from('kanban_columns')
    .select('id')
    .eq('project_id', sprint.project_id)
    .eq('is_done_column', true)

  const doneColumnIds = (doneColumns ?? []).map((c) => c.id)

  // done 컬럼이 없으면 미완료 태스크 이동 건너뜀 (어떤 태스크가 완료인지 판단 불가)
  if (doneColumnIds.length === 0) {
    return { data: sprint, error: null }
  }

  // 미완료 태스크: sprint에 속하고 done 컬럼이 아닌 것
  const { data: unfinished } = await supabase
    .from('tasks')
    .select('id')
    .eq('sprint_id', sprintId)
    .not('column_id', 'in', `(${doneColumnIds.join(',')})`)

  if (unfinished && unfinished.length > 0) {
    const unfinishedIds = unfinished.map((t) => t.id)
    const newSprintId = moveUnfinishedTo === 'backlog' ? null : moveUnfinishedTo

    await supabase.from('tasks').update({ sprint_id: newSprintId }).in('id', unfinishedIds)
  }

  return { data: sprint, error: null }
}

export async function reopenSprint(
  supabase: Client,
  sprintId: string,
): Promise<ServiceResult<Sprint>> {
  // 이미 활성 스프린트가 있는지 확인
  const { data: sprint } = await supabase
    .from('sprints')
    .select('project_id')
    .eq('id', sprintId)
    .single()

  if (sprint) {
    const { data: activeSprints } = await supabase
      .from('sprints')
      .select('id')
      .eq('project_id', sprint.project_id)
      .eq('status', 'active')

    if (activeSprints && activeSprints.length > 0) {
      return {
        data: null,
        error: { code: 'CONFLICT', message: '이미 활성 스프린트가 있습니다. 먼저 완료해주세요.' },
      }
    }
  }

  const { data, error } = await supabase
    .from('sprints')
    .update({ status: 'active', completed_at: null })
    .eq('id', sprintId)
    .select('*')
    .returns<Sprint[]>()
    .single()

  if (error || !data) {
    return {
      data: null,
      error: { code: error?.code ?? 'UNKNOWN', message: error?.message ?? '스프린트 재오픈 실패' },
    }
  }

  return { data, error: null }
}

export async function getVelocityData(
  supabase: Client,
  projectId: string,
): Promise<ServiceResult<VelocityDataPoint[]>> {
  const { data: completedSprints, error } = await supabase
    .from('sprints')
    .select('id, name')
    .eq('project_id', projectId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: true })
    .returns<Array<{ id: string; name: string }>>()

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  if (!completedSprints || completedSprints.length === 0) {
    return { data: [], error: null }
  }

  const sprintIds = completedSprints.map((s) => s.id)

  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('sprint_id, column_id')
    .in('sprint_id', sprintIds)

  if (tasksError) {
    return { data: null, error: { code: tasksError.code, message: tasksError.message } }
  }

  const { data: doneColumns } = await supabase
    .from('kanban_columns')
    .select('id')
    .eq('project_id', projectId)
    .eq('is_done_column', true)

  const doneColumnIds = new Set((doneColumns ?? []).map((c) => c.id))

  const statsMap = new Map<string, { total: number; completed: number }>()
  for (const task of tasks ?? []) {
    const sid = task.sprint_id as string
    const stat = statsMap.get(sid) ?? { total: 0, completed: 0 }
    stat.total += 1
    if (doneColumnIds.has(task.column_id)) {
      stat.completed += 1
    }
    statsMap.set(sid, stat)
  }

  const velocityData: VelocityDataPoint[] = completedSprints.map((sprint) => {
    const stat = statsMap.get(sprint.id) ?? { total: 0, completed: 0 }
    return {
      sprintName: sprint.name,
      completedTasks: stat.completed,
      totalTasks: stat.total,
    }
  })

  return { data: velocityData, error: null }
}
