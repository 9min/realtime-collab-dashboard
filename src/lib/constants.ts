// 태스크 우선순위
export const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const

// 우선순위 라벨 (한국어)
export const PRIORITY_LABELS = {
  low: '낮음',
  medium: '보통',
  high: '높음',
  urgent: '긴급',
} as const

// 우선순위 도트 색상 (Tailwind class)
export const PRIORITY_DOT_COLORS = {
  low: 'bg-emerald-500',
  medium: 'bg-blue-500',
  high: 'bg-amber-500',
  urgent: 'bg-rose-500',
} as const

// 우선순위 배지 스타일 (배경색 + 텍스트 색상)
export const PRIORITY_BADGE_STYLES = {
  low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  high: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  urgent: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
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
  { title: '할 일', position: 0 },
  { title: '진행 중', position: 1 },
  { title: '완료', position: 2 },
  { title: '논의 필요', position: 3 },
] as const

// 컬럼 헤더 색상 (타이틀 기반 매핑)
export const COLUMN_COLORS: Record<string, { gradient: string; badge: string }> = {
  '할 일': {
    gradient: 'from-blue-50 to-sky-50 dark:from-blue-900/40 dark:to-sky-900/40',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  },
  '진행 중': {
    gradient: 'from-amber-50 to-yellow-50 dark:from-amber-900/40 dark:to-yellow-900/40',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  },
  완료: {
    gradient: 'from-green-50 to-emerald-50 dark:from-green-900/40 dark:to-emerald-900/40',
    badge: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  },
  '논의 필요': {
    gradient: 'from-rose-50 to-red-50 dark:from-rose-900/40 dark:to-red-900/40',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
  },
} as const

// 컬럼 기본 색상 (매핑에 없는 커스텀 컬럼용)
export const COLUMN_DEFAULT_COLORS = {
  gradient: 'from-slate-50 to-gray-50 dark:from-slate-900/40 dark:to-gray-900/40',
  badge: 'bg-slate-100 text-slate-700 dark:bg-slate-900/50 dark:text-slate-300',
} as const

// Realtime 채널 접두사
export const CHANNEL_PREFIX = 'project' as const

// TanStack Query 기본 설정
export const QUERY_CONFIG = {
  STALE_TIME: 1000 * 60 * 5, // 5분
  GC_TIME: 1000 * 60 * 30, // 30분
  REALTIME_POLL_INTERVAL: 1000 * 5, // 5초 — Realtime WebSocket 폴백용
} as const

// 페이지네이션
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const

// 아바타 업로드 설정
export const AVATAR = {
  BUCKET_NAME: 'avatars',
  MAX_FILE_SIZE: 2 * 1024 * 1024, // 2MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
} as const

// 프로필 설정
export const PROFILE = {
  NAME_MIN_LENGTH: 1,
  NAME_MAX_LENGTH: 30,
} as const

// 라벨 색상 팔레트
export const LABEL_COLORS = [
  { name: '빨강', value: '#EF4444' },
  { name: '주황', value: '#F97316' },
  { name: '노랑', value: '#EAB308' },
  { name: '초록', value: '#22C55E' },
  { name: '하늘', value: '#06B6D4' },
  { name: '파랑', value: '#3B82F6' },
  { name: '보라', value: '#8B5CF6' },
  { name: '분홍', value: '#EC4899' },
  { name: '회색', value: '#6B7280' },
  { name: '갈색', value: '#92400E' },
] as const

// 의존성 방향
export const DEPENDENCY_DIRECTION = {
  BLOCKS: 'blocks',
  BLOCKED_BY: 'blocked_by',
} as const

// 스윔레인 모드
export const SWIMLANE_MODE = {
  NONE: 'none',
  ASSIGNEE: 'assignee',
  PRIORITY: 'priority',
} as const

// 위젯 타입
export const WIDGET_TYPE = {
  TASK_STATUS: 'task-status',
  WEEKLY_PROGRESS: 'weekly-progress',
  BURNDOWN: 'burndown',
  MEMBER_LIST: 'member-list',
  MY_FAVORITES: 'my-favorites',
} as const

// 위젯 그리드 설정
export const GRID_COLS = 12 as const
export const GRID_ROW_HEIGHT = 80 as const

// 기본 대시보드 레이아웃 (신규 유저용)
export const DEFAULT_DASHBOARD_LAYOUT = [
  { widget_id: 'default-task-status', type: WIDGET_TYPE.TASK_STATUS, x: 0, y: 0, w: 4, h: 3 },
  {
    widget_id: 'default-weekly-progress',
    type: WIDGET_TYPE.WEEKLY_PROGRESS,
    x: 4,
    y: 0,
    w: 4,
    h: 3,
  },
  { widget_id: 'default-burndown', type: WIDGET_TYPE.BURNDOWN, x: 8, y: 0, w: 4, h: 3 },
  { widget_id: 'default-member-list', type: WIDGET_TYPE.MEMBER_LIST, x: 0, y: 3, w: 4, h: 3 },
] as const

// API Rate Limiting
export const RATE_LIMIT = {
  DEFAULT_INTERVAL: 60 * 1000, // 1분
  DEFAULT_MAX_REQUESTS: 60, // 분당 60회
  STRICT_MAX_REQUESTS: 10, // 분당 10회 (민감한 API)
  CLEANUP_INTERVAL: 5 * 60 * 1000, // 5분마다 만료 엔트리 정리
} as const
