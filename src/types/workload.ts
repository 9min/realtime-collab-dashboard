export const WORKLOAD_THRESHOLDS = {
  GREEN_MAX: 3,
  YELLOW_MAX: 6,
} as const

export interface MemberWorkload {
  userId: string
  userName: string
  avatarUrl: string | null
  tasksByPriority: { low: number; medium: number; high: number; urgent: number }
  totalTasks: number
}

export type WorkloadZone = 'green' | 'yellow' | 'red'

export function getWorkloadZone(total: number): WorkloadZone {
  if (total <= WORKLOAD_THRESHOLDS.GREEN_MAX) return 'green'
  if (total <= WORKLOAD_THRESHOLDS.YELLOW_MAX) return 'yellow'
  return 'red'
}
