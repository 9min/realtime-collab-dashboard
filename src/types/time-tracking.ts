export interface TimeEntry {
  id: string
  task_id: string
  project_id: string
  user_id: string
  duration_minutes: number
  description: string | null
  started_at: string | null
  ended_at: string | null
  created_at: string
  updated_at: string
}

export interface CreateTimeEntryInput {
  task_id: string
  project_id: string
  duration_minutes: number
  description?: string
  started_at?: string
  ended_at?: string
}

export interface UpdateTimeEntryInput {
  duration_minutes?: number
  description?: string | null
  started_at?: string | null
  ended_at?: string | null
}

export interface TaskTimeSummary {
  taskId: string
  totalMinutes: number
  estimatedMinutes: number | null
  entryCount: number
}

export interface UserWeeklyTime {
  date: string
  totalMinutes: number
}

export interface WeeklyTimeReport {
  userId: string
  userName: string
  dailyMinutes: UserWeeklyTime[]
  totalMinutes: number
}
