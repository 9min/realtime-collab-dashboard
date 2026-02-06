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

// 위젯 그리드 설정
export const GRID_COLS = 12 as const
export const GRID_ROW_HEIGHT = 80 as const

// 기본 대시보드 레이아웃 (신규 유저용)
export const DEFAULT_DASHBOARD_LAYOUT = [
  { widget_id: 'default-task-status', type: WIDGET_TYPE.TASK_STATUS, x: 0, y: 0, w: 4, h: 3 },
  { widget_id: 'default-weekly-progress', type: WIDGET_TYPE.WEEKLY_PROGRESS, x: 4, y: 0, w: 4, h: 3 },
  { widget_id: 'default-burndown', type: WIDGET_TYPE.BURNDOWN, x: 8, y: 0, w: 4, h: 3 },
  { widget_id: 'default-member-list', type: WIDGET_TYPE.MEMBER_LIST, x: 0, y: 3, w: 4, h: 3 },
] as const
