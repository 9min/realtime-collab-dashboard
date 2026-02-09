/**
 * E2E 테스트용 Mock 데이터
 */

// ── 유저 ──
export const MOCK_USER = {
  id: 'e2e-user-001',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'e2e-tester@example.com',
  email_confirmed_at: '2025-01-01T00:00:00Z',
  app_metadata: { provider: 'github', providers: ['github'] },
  user_metadata: { full_name: 'E2E Tester', avatar_url: '' },
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
} as const

export const MOCK_PROFILE = {
  id: MOCK_USER.id,
  email: MOCK_USER.email,
  full_name: 'E2E Tester',
  avatar_url: null,
  is_admin: true,
  created_at: '2025-01-01T00:00:00.000Z',
  updated_at: '2025-01-01T00:00:00.000Z',
} as const

// ── 프로젝트 ──
export const MOCK_PROJECT = {
  id: 'project-001',
  name: '테스트 프로젝트',
  description: 'E2E 테스트용 프로젝트입니다',
  owner_id: MOCK_USER.id,
  created_at: '2025-01-10T00:00:00.000Z',
  updated_at: '2025-01-10T00:00:00.000Z',
} as const

export const MOCK_PROJECTS_WITH_COUNT = [
  { ...MOCK_PROJECT, member_count: 3 },
  {
    id: 'project-002',
    name: '두 번째 프로젝트',
    description: '또 다른 프로젝트',
    owner_id: MOCK_USER.id,
    created_at: '2025-02-01T00:00:00.000Z',
    updated_at: '2025-02-01T00:00:00.000Z',
    member_count: 1,
  },
] as const

export const MOCK_MEMBERS = [
  {
    id: 'member-001',
    project_id: MOCK_PROJECT.id,
    user_id: MOCK_USER.id,
    role: 'owner',
    joined_at: '2025-01-10T00:00:00.000Z',
    profiles: MOCK_PROFILE,
  },
] as const

// ── 칸반 컬럼 ──
export const MOCK_COLUMNS = [
  {
    id: 'col-todo',
    project_id: MOCK_PROJECT.id,
    title: 'Todo',
    description: null,
    position: 0,
    created_at: '2025-01-10T00:00:00.000Z',
    updated_at: '2025-01-10T00:00:00.000Z',
  },
  {
    id: 'col-progress',
    project_id: MOCK_PROJECT.id,
    title: 'In Progress',
    description: null,
    position: 1,
    created_at: '2025-01-10T00:00:00.000Z',
    updated_at: '2025-01-10T00:00:00.000Z',
  },
  {
    id: 'col-done',
    project_id: MOCK_PROJECT.id,
    title: 'Done',
    description: null,
    position: 2,
    created_at: '2025-01-10T00:00:00.000Z',
    updated_at: '2025-01-10T00:00:00.000Z',
  },
] as const

// ── 태스크 ──
function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const MOCK_TASKS = [
  {
    id: 'task-001',
    project_id: MOCK_PROJECT.id,
    column_id: 'col-todo',
    title: '로그인 페이지 디자인',
    description: '로그인 폼 UI 구현',
    priority: 'high',
    assignee_id: MOCK_USER.id,
    due_date: todayStr(),
    position: 0,
    created_by: MOCK_USER.id,
    created_at: '2025-01-11T00:00:00.000Z',
    updated_at: '2025-01-11T00:00:00.000Z',
  },
  {
    id: 'task-002',
    project_id: MOCK_PROJECT.id,
    column_id: 'col-todo',
    title: 'API 엔드포인트 설계',
    description: 'REST API 스펙 작성',
    priority: 'medium',
    assignee_id: null,
    due_date: todayStr(),
    position: 1,
    created_by: MOCK_USER.id,
    created_at: '2025-01-12T00:00:00.000Z',
    updated_at: '2025-01-12T00:00:00.000Z',
  },
  {
    id: 'task-003',
    project_id: MOCK_PROJECT.id,
    column_id: 'col-progress',
    title: '데이터베이스 스키마 설계',
    description: 'ERD 작성 및 테이블 생성',
    priority: 'urgent',
    assignee_id: MOCK_USER.id,
    due_date: null,
    position: 0,
    created_by: MOCK_USER.id,
    created_at: '2025-01-13T00:00:00.000Z',
    updated_at: '2025-01-13T00:00:00.000Z',
  },
  {
    id: 'task-004',
    project_id: MOCK_PROJECT.id,
    column_id: 'col-done',
    title: '프로젝트 초기 설정',
    description: 'Next.js + Supabase 셋업',
    priority: 'low',
    assignee_id: MOCK_USER.id,
    due_date: '2025-01-15',
    position: 0,
    created_by: MOCK_USER.id,
    created_at: '2025-01-09T00:00:00.000Z',
    updated_at: '2025-01-15T00:00:00.000Z',
  },
] as const

// ── 라벨 ──
export const MOCK_LABELS = [
  {
    id: 'label-001',
    project_id: MOCK_PROJECT.id,
    name: 'Bug',
    color: '#ef4444',
    created_at: '2025-01-10T00:00:00.000Z',
    updated_at: '2025-01-10T00:00:00.000Z',
  },
  {
    id: 'label-002',
    project_id: MOCK_PROJECT.id,
    name: 'Feature',
    color: '#3b82f6',
    created_at: '2025-01-10T00:00:00.000Z',
    updated_at: '2025-01-10T00:00:00.000Z',
  },
] as const

export const MOCK_TASK_LABELS = [
  { task_id: 'task-001', label_id: 'label-002' },
] as const

// ── 알림 ──
export const MOCK_NOTIFICATIONS = [
  {
    id: 'notif-001',
    user_id: MOCK_USER.id,
    actor_id: MOCK_USER.id,
    title: '새 태스크 할당',
    content: '로그인 페이지 디자인이 할당되었습니다',
    link: `/projects/${MOCK_PROJECT.id}/board?taskId=task-001`,
    is_read: false,
    created_at: '2025-01-15T10:00:00.000Z',
    updated_at: '2025-01-15T10:00:00.000Z',
    actor: MOCK_PROFILE,
  },
] as const

// ── 대시보드 레이아웃 ──
export const MOCK_DASHBOARD_LAYOUT = {
  id: 'layout-001',
  project_id: MOCK_PROJECT.id,
  user_id: MOCK_USER.id,
  layout: [
    { widget_id: 'task-status', x: 0, y: 0, w: 6, h: 4 },
    { widget_id: 'weekly-progress', x: 6, y: 0, w: 6, h: 4 },
  ],
  created_at: '2025-01-10T00:00:00.000Z',
  updated_at: '2025-01-10T00:00:00.000Z',
} as const

// ── 활동 로그 ──
export const MOCK_ACTIVITY_LOGS = [
  {
    id: 'log-001',
    project_id: MOCK_PROJECT.id,
    user_id: MOCK_USER.id,
    action_type: 'create',
    entity_type: 'task',
    entity_id: 'task-001',
    metadata: { title: '로그인 페이지 디자인' },
    created_at: '2025-01-15T09:00:00.000Z',
    profiles: MOCK_PROFILE,
  },
] as const
