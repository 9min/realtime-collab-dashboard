import type { Tables } from './database'

export interface TaskFavorite {
  id: string
  user_id: string
  task_id: string
  created_at: string
}

export interface FavoriteTaskWithProject extends Tables<'tasks'> {
  project_name: string
}
