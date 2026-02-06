import type { SupabaseClient } from '@supabase/supabase-js'

import type { ServiceResult } from '@/types/common'
import type { TaskStatusData, WeeklyProgressData, BurndownData } from '@/types/dashboard'
import type { Database, Tables } from '@/types/database'

type Client = SupabaseClient<Database>
type Task = Tables<'tasks'>
type Column = Tables<'kanban_columns'>

// 컬럼별 태스크 수 (파이 차트)
const COLUMN_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899']

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

  const data: TaskStatusData[] = columns.map((col, i) => ({
    name: col.title,
    value: tasks.filter((t) => t.column_id === col.id).length,
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

  for (let i = 0; i < DAYS_RANGE; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)

    const created = (tasks ?? []).filter((t) => {
      const createdAt = new Date(t.created_at)
      return createdAt >= dayStart && createdAt <= dayEnd
    }).length

    // Done 컬럼에 있고 해당 날짜에 업데이트된 태스크 = 완료
    const completed = doneColumnId
      ? (tasks ?? []).filter((t) => {
          const updatedAt = new Date(t.updated_at)
          return t.column_id === doneColumnId && updatedAt >= dayStart && updatedAt <= dayEnd
        }).length
      : 0

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

  for (let i = 0; i < DAYS_RANGE; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)

    // 해당 날짜까지 완료된 태스크 수
    const completedByDate = doneColumnId
      ? (tasks ?? []).filter((t) => {
          const updatedAt = new Date(t.updated_at)
          return t.column_id === doneColumnId && updatedAt <= dayEnd
        }).length
      : 0

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
