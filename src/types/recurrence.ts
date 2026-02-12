export const RECURRENCE_FREQUENCY = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  CUSTOM: 'custom',
} as const

export type RecurrenceFrequency = (typeof RECURRENCE_FREQUENCY)[keyof typeof RECURRENCE_FREQUENCY]

export const FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
  daily: '매일',
  weekly: '매주',
  monthly: '매월',
  custom: '사용자 지정',
} as const

export const DAY_OF_WEEK_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const

export interface TaskRecurrence {
  id: string
  task_id: string
  project_id: string
  frequency: RecurrenceFrequency
  interval_value: number
  day_of_week: number | null
  day_of_month: number | null
  next_due_date: string
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface CreateRecurrenceInput {
  task_id: string
  project_id: string
  frequency: RecurrenceFrequency
  interval_value?: number
  day_of_week?: number | null
  day_of_month?: number | null
  next_due_date: string
  created_by: string
}

export interface UpdateRecurrenceInput {
  frequency?: RecurrenceFrequency
  interval_value?: number
  day_of_week?: number | null
  day_of_month?: number | null
  next_due_date?: string
  is_active?: boolean
}
