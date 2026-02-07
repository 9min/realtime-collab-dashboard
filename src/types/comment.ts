import type { Tables } from './database'

export interface TaskComment {
  id: string
  task_id: string
  project_id: string
  user_id: string
  content: string
  mentions: string[] | null
  created_at: string
  updated_at: string
}

export interface TaskCommentWithUser extends TaskComment {
  profiles: Tables<'profiles'>
}
