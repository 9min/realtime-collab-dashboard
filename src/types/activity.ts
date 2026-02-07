import type { Tables } from './database'

// 활동 액션 타입
export const ACTIVITY_ACTION = {
  CREATED: 'created',
  UPDATED: 'updated',
  DELETED: 'deleted',
  MOVED: 'moved',
} as const

// 활동 엔터티 타입
export const ACTIVITY_ENTITY = {
  TASK: 'task',
  COLUMN: 'column',
  MEMBER: 'member',
  COMMENT: 'comment',
} as const

export type ActivityAction = (typeof ACTIVITY_ACTION)[keyof typeof ACTIVITY_ACTION]
export type ActivityEntity = (typeof ACTIVITY_ENTITY)[keyof typeof ACTIVITY_ENTITY]

// activity_logs 테이블 Row + 유저 프로필 조인
export interface ActivityLog {
  id: string
  project_id: string
  user_id: string
  action_type: string
  entity_type: string
  entity_id: string
  metadata: Record<string, unknown>
  created_at: string
}

export interface ActivityLogWithUser extends ActivityLog {
  profiles: Tables<'profiles'>
}
