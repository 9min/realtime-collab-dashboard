import type { Tables } from './database'

export const NOTIFICATION_TYPE = {
  TASK_ASSIGNED: 'task_assigned',
  COMMENTED: 'commented',
  MENTIONED: 'mentioned',
  DUE_SOON: 'due_soon',
} as const

export type NotificationType = (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE]

export interface Notification {
  id: string
  project_id: string
  user_id: string
  actor_id: string | null
  type: string
  title: string
  message: string
  entity_type: string | null
  entity_id: string | null
  is_read: boolean
  created_at: string
}

export interface NotificationWithActor extends Notification {
  actor: Tables<'profiles'> | null
}
