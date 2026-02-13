export const SPRINT_STATUS = {
  PLANNED: 'planned',
  ACTIVE: 'active',
  COMPLETED: 'completed',
} as const

export type SprintStatus = (typeof SPRINT_STATUS)[keyof typeof SPRINT_STATUS]

export interface Sprint {
  id: string
  project_id: string
  name: string
  goal: string | null
  start_date: string
  end_date: string
  status: SprintStatus
  created_by: string
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface SprintWithStats extends Sprint {
  totalTasks: number
  completedTasks: number
}

export interface CreateSprintInput {
  project_id: string
  name: string
  goal?: string
  start_date: string
  end_date: string
}

export interface UpdateSprintInput {
  name?: string
  goal?: string | null
  start_date?: string
  end_date?: string
}

export interface VelocityDataPoint {
  sprintName: string
  completedTasks: number
  totalTasks: number
}
