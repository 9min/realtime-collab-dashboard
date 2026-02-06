// 태스크 우선순위
export const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const

// 멤버 역할
export const MEMBER_ROLE = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
  VIEWER: 'viewer',
} as const

// 기본 칸반 컬럼
export const DEFAULT_COLUMNS = [
  { title: 'To Do', position: 0 },
  { title: 'In Progress', position: 1 },
  { title: 'Done', position: 2 },
] as const

// Realtime 채널 접두사
export const CHANNEL_PREFIX = 'project' as const

// TanStack Query 기본 설정
export const QUERY_CONFIG = {
  STALE_TIME: 1000 * 60 * 5, // 5분
  GC_TIME: 1000 * 60 * 30, // 30분
} as const

// 페이지네이션
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const

// 위젯 타입
export const WIDGET_TYPE = {
  TASK_STATUS: 'task-status',
  WEEKLY_PROGRESS: 'weekly-progress',
  BURNDOWN: 'burndown',
  MEMBER_LIST: 'member-list',
} as const
