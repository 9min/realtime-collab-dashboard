import type { SupabaseClient } from '@supabase/supabase-js'

import type { ServiceResult } from '@/types/common'
import type { TaskStatusData, WeeklyProgressData, BurndownData } from '@/types/dashboard'
import type { Database, Tables } from '@/types/database'

type Client = SupabaseClient<Database>
type Task = Tables<'tasks'>
type Column = Tables<'kanban_columns'>

// 컬럼별 태스크 수 (파이 차트)
const COLUMN_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

export async function getTaskStatusData(
  supabase: Client,
  projectId: string,
): Promise<ServiceResult<TaskStatusData[]>> {
  const [columnsResult, tasksResult] = await Promise.all([
    supabase
      .from('kanban_columns')
      .select('*')
      .eq('project_id', projectId)
      .order('position')
      .returns<Column[]>(),
    supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .returns<Task[]>(),
  ])

  if (columnsResult.error) {
    return { data: null, error: { code: columnsResult.error.code, message: columnsResult.error.message } }
  }
  if (tasksResult.error) {
    return { data: null, error: { code: tasksResult.error.code, message: tasksResult.error.message } }
  }

  const columns = columnsResult.data ?? []
  const tasks = tasksResult.data ?? []

  // O(tasks) 1회 순회로 column_id별 카운트 집계
  const countByColumn = new Map<string, number>()
  for (const task of tasks) {
    countByColumn.set(task.column_id, (countByColumn.get(task.column_id) ?? 0) + 1)
  }

  const data: TaskStatusData[] = columns.map((col, i) => ({
    name: col.title,
    value: countByColumn.get(col.id) ?? 0,
    color: COLUMN_COLORS[i % COLUMN_COLORS.length],
  }))

  return { data, error: null }
}

// 주간 진행률 (최근 7일 완료/생성 태스크 수)
const DAYS_RANGE = 7

export async function getWeeklyProgressData(
  supabase: Client,
  projectId: string,
): Promise<ServiceResult<WeeklyProgressData[]>> {
  const now = new Date()
  const startDate = new Date(now)
  startDate.setDate(startDate.getDate() - DAYS_RANGE + 1)
  startDate.setHours(0, 0, 0, 0)

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .returns<Task[]>()

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  // 마지막 컬럼(Done)에 있는 태스크의 updated_at 기준으로 완료 판단
  const { data: columns } = await supabase
    .from('kanban_columns')
    .select('*')
    .eq('project_id', projectId)
    .order('position', { ascending: false })
    .limit(1)
    .returns<Column[]>()

  const doneColumnId = columns?.[0]?.id

  const dateFormatter = new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric' })
  const data: WeeklyProgressData[] = []

  // 타임스탬프 사전 계산 — 루프 내 Date 객체 생성 최소화
  const taskTimestamps = (tasks ?? []).map((t) => ({
    createdAt: new Date(t.created_at).getTime(),
    updatedAt: new Date(t.updated_at).getTime(),
    columnId: t.column_id,
  }))

  for (let i = 0; i < DAYS_RANGE; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    const dayStartTs = new Date(date).setHours(0, 0, 0, 0)
    const dayEndTs = new Date(date).setHours(23, 59, 59, 999)

    let created = 0
    let completed = 0

    for (const t of taskTimestamps) {
      if (t.createdAt >= dayStartTs && t.createdAt <= dayEndTs) {
        created++
      }
      if (doneColumnId && t.columnId === doneColumnId && t.updatedAt >= dayStartTs && t.updatedAt <= dayEndTs) {
        completed++
      }
    }

    data.push({
      date: dateFormatter.format(date),
      completed,
      created,
    })
  }

  return { data, error: null }
}

// 번다운 차트 (남은 태스크 수 추이)
export async function getBurndownData(
  supabase: Client,
  projectId: string,
): Promise<ServiceResult<BurndownData[]>> {
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .returns<Task[]>()

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  const { data: columns } = await supabase
    .from('kanban_columns')
    .select('*')
    .eq('project_id', projectId)
    .order('position', { ascending: false })
    .limit(1)
    .returns<Column[]>()

  const doneColumnId = columns?.[0]?.id
  const totalTasks = tasks?.length ?? 0

  if (totalTasks === 0) {
    return { data: [], error: null }
  }

  const now = new Date()
  const startDate = new Date(now)
  startDate.setDate(startDate.getDate() - DAYS_RANGE + 1)
  startDate.setHours(0, 0, 0, 0)

  const dateFormatter = new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric' })
  const data: BurndownData[] = []

  // 타임스탬프 사전 계산 — 루프 내 Date 객체 생성 최소화
  const doneTaskTimestamps = doneColumnId
    ? (tasks ?? [])
        .filter((t) => t.column_id === doneColumnId)
        .map((t) => new Date(t.updated_at).getTime())
    : []

  for (let i = 0; i < DAYS_RANGE; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    const dayEndTs = new Date(date).setHours(23, 59, 59, 999)

    // 해당 날짜까지 완료된 태스크 수 — 숫자 비교
    let completedByDate = 0
    for (const ts of doneTaskTimestamps) {
      if (ts <= dayEndTs) {
        completedByDate++
      }
    }

    const remaining = totalTasks - completedByDate
    // 이상적 번다운: 선형 감소
    const ideal = Math.max(0, totalTasks - (totalTasks / (DAYS_RANGE - 1)) * i)

    data.push({
      date: dateFormatter.format(date),
      remaining,
      ideal: Math.round(ideal * 10) / 10,
    })
  }

  return { data, error: null }
}
