export const TASK_ASSIGNEE_ROLE = {
  ASSIGNEE: 'assignee',
  WATCHER: 'watcher',
} as const

export type TaskAssigneeRole = (typeof TASK_ASSIGNEE_ROLE)[keyof typeof TASK_ASSIGNEE_ROLE]

export interface TaskAssignee {
  id: string
  task_id: string
  user_id: string
  role: TaskAssigneeRole
  created_at: string
}

export interface TaskAssigneeWithProfile extends TaskAssignee {
  profiles: {
    full_name: string | null
    email: string
    avatar_url: string | null
  }
}
