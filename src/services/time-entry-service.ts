import type { SupabaseClient } from '@supabase/supabase-js'

import type { ServiceResult } from '@/types/common'
import type { Database } from '@/types/database'
import type {
  TimeEntry,
  CreateTimeEntryInput,
  UpdateTimeEntryInput,
  TaskTimeSummary,
  WeeklyTimeReport,
  UserWeeklyTime,
} from '@/types/time-tracking'

type Client = SupabaseClient<Database>

export async function getTimeEntriesByTask(
  supabase: Client,
  taskId: string,
): Promise<ServiceResult<TimeEntry[]>> {
  const { data, error } = await supabase
    .from('time_entries')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false })
    .returns<TimeEntry[]>()

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  return { data: data ?? [], error: null }
}

export async function getTimeEntriesByProject(
  supabase: Client,
  projectId: string,
): Promise<ServiceResult<TimeEntry[]>> {
  const { data, error } = await supabase
    .from('time_entries')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .returns<TimeEntry[]>()

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  return { data: data ?? [], error: null }
}

export async function createTimeEntry(
  supabase: Client,
  input: CreateTimeEntryInput & { user_id: string },
): Promise<ServiceResult<TimeEntry>> {
  const { data, error } = await supabase
    .from('time_entries')
    .insert(input)
    .select('*')
    .returns<TimeEntry[]>()
    .single()

  if (error || !data) {
    return {
      data: null,
      error: { code: error?.code ?? 'UNKNOWN', message: error?.message ?? '시간 기록 생성 실패' },
    }
  }

  return { data, error: null }
}

export async function updateTimeEntry(
  supabase: Client,
  entryId: string,
  input: UpdateTimeEntryInput,
): Promise<ServiceResult<TimeEntry>> {
  const { data, error } = await supabase
    .from('time_entries')
    .update(input)
    .eq('id', entryId)
    .select('*')
    .returns<TimeEntry[]>()
    .single()

  if (error || !data) {
    return {
      data: null,
      error: { code: error?.code ?? 'UNKNOWN', message: error?.message ?? '시간 기록 수정 실패' },
    }
  }

  return { data, error: null }
}

export async function deleteTimeEntry(
  supabase: Client,
  entryId: string,
): Promise<ServiceResult<null>> {
  const { error } = await supabase.from('time_entries').delete().eq('id', entryId)

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  return { data: null, error: null }
}

export async function getTaskTimeSummary(
  supabase: Client,
  taskId: string,
): Promise<ServiceResult<TaskTimeSummary>> {
  // Get time entries for the task
  const { data: entries, error: entriesError } = await supabase
    .from('time_entries')
    .select('duration_minutes')
    .eq('task_id', taskId)
    .returns<{ duration_minutes: number }[]>()

  if (entriesError) {
    return { data: null, error: { code: entriesError.code, message: entriesError.message } }
  }

  // Get task estimated_minutes
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('estimated_minutes')
    .eq('id', taskId)
    .returns<{ estimated_minutes: number | null }[]>()
    .single()

  if (taskError) {
    return { data: null, error: { code: taskError.code, message: taskError.message } }
  }

  const totalMinutes = (entries ?? []).reduce((sum, e) => sum + e.duration_minutes, 0)

  return {
    data: {
      taskId,
      totalMinutes,
      estimatedMinutes: task?.estimated_minutes ?? null,
      entryCount: (entries ?? []).length,
    },
    error: null,
  }
}

export async function getWeeklyTimeReport(
  supabase: Client,
  projectId: string,
  weekStartDate: string,
): Promise<ServiceResult<WeeklyTimeReport[]>> {
  // Calculate week end date (7 days from start)
  const start = new Date(weekStartDate)
  const end = new Date(start)
  end.setDate(end.getDate() + 7)

  const { data: entries, error: entriesError } = await supabase
    .from('time_entries')
    .select('user_id, duration_minutes, created_at')
    .eq('project_id', projectId)
    .gte('created_at', start.toISOString())
    .lt('created_at', end.toISOString())
    .returns<{ user_id: string; duration_minutes: number; created_at: string }[]>()

  if (entriesError) {
    return { data: null, error: { code: entriesError.code, message: entriesError.message } }
  }

  // Get member profiles
  const { data: members, error: membersError } = await supabase
    .from('project_members')
    .select('user_id, profiles(full_name)')
    .eq('project_id', projectId)
    .returns<{ user_id: string; profiles: { full_name: string } | null }[]>()

  if (membersError) {
    return { data: null, error: { code: membersError.code, message: membersError.message } }
  }

  // Build user name map
  const userNames = new Map<string, string>()
  for (const m of members ?? []) {
    userNames.set(m.user_id, m.profiles?.full_name ?? '알 수 없음')
  }

  // Group entries by user and date
  const userDailyMap = new Map<string, Map<string, number>>()
  for (const entry of entries ?? []) {
    const dateKey = entry.created_at.slice(0, 10) // YYYY-MM-DD
    if (!userDailyMap.has(entry.user_id)) {
      userDailyMap.set(entry.user_id, new Map())
    }
    const dailyMap = userDailyMap.get(entry.user_id)!
    dailyMap.set(dateKey, (dailyMap.get(dateKey) ?? 0) + entry.duration_minutes)
  }

  // Build reports for all members
  const reports: WeeklyTimeReport[] = []
  const allUserIds = new Set([...userDailyMap.keys(), ...(members ?? []).map((m) => m.user_id)])

  for (const userId of allUserIds) {
    const dailyMap = userDailyMap.get(userId) ?? new Map<string, number>()
    const dailyMinutes: UserWeeklyTime[] = []
    let totalMinutes = 0

    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      const dateStr = d.toISOString().slice(0, 10)
      const minutes = dailyMap.get(dateStr) ?? 0
      dailyMinutes.push({ date: dateStr, totalMinutes: minutes })
      totalMinutes += minutes
    }

    reports.push({
      userId,
      userName: userNames.get(userId) ?? '알 수 없음',
      dailyMinutes,
      totalMinutes,
    })
  }

  return { data: reports, error: null }
}
