import {
  DEMO_USER_ID,
  DEMO_PROJECT_ID,
  DEMO_MEMBER_IDS,
  DEMO_COLUMN_IDS,
  DEMO_LABEL_IDS,
} from './constants'

// ── 날짜 헬퍼 ──

function daysFromNow(offset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10) // YYYY-MM-DD
}

function isoAgo(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString()
}

const NOW = new Date().toISOString()

// ── Profiles ──

export const DEMO_PROFILES = [
  {
    id: DEMO_USER_ID,
    email: 'demo@example.com',
    full_name: '데모 사용자',
    avatar_url: null,
    is_admin: true,
    created_at: isoAgo(30),
    updated_at: NOW,
  },
  {
    id: DEMO_MEMBER_IDS.ALICE,
    email: 'alice@example.com',
    full_name: '김민지',
    avatar_url: null,
    is_admin: false,
    created_at: isoAgo(28),
    updated_at: NOW,
  },
  {
    id: DEMO_MEMBER_IDS.BOB,
    email: 'bob@example.com',
    full_name: '이준호',
    avatar_url: null,
    is_admin: false,
    created_at: isoAgo(25),
    updated_at: NOW,
  },
  {
    id: DEMO_MEMBER_IDS.CHARLIE,
    email: 'charlie@example.com',
    full_name: '박서연',
    avatar_url: null,
    is_admin: false,
    created_at: isoAgo(20),
    updated_at: NOW,
  },
]

// ── Projects ──

export const DEMO_PROJECTS = [
  {
    id: DEMO_PROJECT_ID,
    name: '협업 대시보드 데모',
    description: '실시간 협업 대시보드의 주요 기능을 체험해보세요!',
    owner_id: DEMO_USER_ID,
    feature_labels: true,
    feature_subtasks: true,
    feature_dependencies: true,
    feature_attachments: true,
    feature_comments: true,
    created_at: isoAgo(14),
    updated_at: NOW,
  },
]

// ── Project Members ──

export const DEMO_PROJECT_MEMBERS = [
  {
    id: 'demo-pm-001',
    project_id: DEMO_PROJECT_ID,
    user_id: DEMO_USER_ID,
    role: 'owner' as const,
    joined_at: isoAgo(14),
  },
  {
    id: 'demo-pm-002',
    project_id: DEMO_PROJECT_ID,
    user_id: DEMO_MEMBER_IDS.ALICE,
    role: 'admin' as const,
    joined_at: isoAgo(13),
  },
  {
    id: 'demo-pm-003',
    project_id: DEMO_PROJECT_ID,
    user_id: DEMO_MEMBER_IDS.BOB,
    role: 'member' as const,
    joined_at: isoAgo(12),
  },
  {
    id: 'demo-pm-004',
    project_id: DEMO_PROJECT_ID,
    user_id: DEMO_MEMBER_IDS.CHARLIE,
    role: 'member' as const,
    joined_at: isoAgo(10),
  },
]

// ── Kanban Columns ──

export const DEMO_KANBAN_COLUMNS = [
  {
    id: DEMO_COLUMN_IDS.TODO,
    project_id: DEMO_PROJECT_ID,
    title: '할 일',
    position: 0,
    wip_limit: null,
    is_done_column: false,
    created_at: isoAgo(14),
    updated_at: NOW,
  },
  {
    id: DEMO_COLUMN_IDS.IN_PROGRESS,
    project_id: DEMO_PROJECT_ID,
    title: '진행 중',
    position: 1,
    wip_limit: 5,
    is_done_column: false,
    created_at: isoAgo(14),
    updated_at: NOW,
  },
  {
    id: DEMO_COLUMN_IDS.DONE,
    project_id: DEMO_PROJECT_ID,
    title: '완료',
    position: 2,
    wip_limit: null,
    is_done_column: true,
    created_at: isoAgo(14),
    updated_at: NOW,
  },
  {
    id: DEMO_COLUMN_IDS.DISCUSSION,
    project_id: DEMO_PROJECT_ID,
    title: '논의 필요',
    position: 3,
    wip_limit: null,
    is_done_column: false,
    created_at: isoAgo(14),
    updated_at: NOW,
  },
]

// ── Tasks (10개) ──

export const DEMO_TASKS = [
  // To Do (4개)
  {
    id: 'demo-task-001',
    project_id: DEMO_PROJECT_ID,
    column_id: DEMO_COLUMN_IDS.TODO,
    title: '사용자 프로필 페이지 디자인',
    description: '프로필 수정, 아바타 업로드, 비밀번호 변경 등의 UI 디자인',
    priority: 'high' as const,
    assignee_id: DEMO_USER_ID,
    due_date: daysFromNow(3),
    position: 0,
    created_by: DEMO_USER_ID,
    created_at: isoAgo(7),
    updated_at: isoAgo(7),
  },
  {
    id: 'demo-task-002',
    project_id: DEMO_PROJECT_ID,
    column_id: DEMO_COLUMN_IDS.TODO,
    title: 'API 문서 작성',
    description: 'REST API 엔드포인트 명세서를 Swagger로 작성',
    priority: 'medium' as const,
    assignee_id: DEMO_MEMBER_IDS.BOB,
    due_date: daysFromNow(5),
    position: 1,
    created_by: DEMO_USER_ID,
    created_at: isoAgo(6),
    updated_at: isoAgo(6),
  },
  {
    id: 'demo-task-003',
    project_id: DEMO_PROJECT_ID,
    column_id: DEMO_COLUMN_IDS.TODO,
    title: '이메일 알림 시스템 구현',
    description: '태스크 할당, 마감일 임박 시 이메일 알림 발송',
    priority: 'low' as const,
    assignee_id: null,
    due_date: daysFromNow(10),
    position: 2,
    created_by: DEMO_MEMBER_IDS.ALICE,
    created_at: isoAgo(5),
    updated_at: isoAgo(5),
  },
  {
    id: 'demo-task-004',
    project_id: DEMO_PROJECT_ID,
    column_id: DEMO_COLUMN_IDS.DISCUSSION,
    title: '다크 모드 색상 체계 개선',
    description: '현재 다크 모드에서 가독성이 떨어지는 요소들의 색상 조정',
    priority: 'urgent' as const,
    assignee_id: DEMO_MEMBER_IDS.CHARLIE,
    due_date: daysFromNow(1),
    position: 0,
    created_by: DEMO_USER_ID,
    created_at: isoAgo(3),
    updated_at: isoAgo(3),
  },
  // In Progress (3개)
  {
    id: 'demo-task-005',
    project_id: DEMO_PROJECT_ID,
    column_id: DEMO_COLUMN_IDS.IN_PROGRESS,
    title: '실시간 알림 기능 구현',
    description: 'WebSocket 기반의 실시간 알림 시스템 구축',
    priority: 'high' as const,
    assignee_id: DEMO_MEMBER_IDS.ALICE,
    due_date: daysFromNow(2),
    position: 0,
    created_by: DEMO_USER_ID,
    created_at: isoAgo(10),
    updated_at: isoAgo(2),
  },
  {
    id: 'demo-task-006',
    project_id: DEMO_PROJECT_ID,
    column_id: DEMO_COLUMN_IDS.IN_PROGRESS,
    title: '간트 차트 뷰 개발',
    description: '태스크를 타임라인 형태로 시각화하는 간트 차트 구현',
    priority: 'medium' as const,
    assignee_id: DEMO_USER_ID,
    due_date: daysFromNow(4),
    position: 1,
    created_by: DEMO_USER_ID,
    created_at: isoAgo(8),
    updated_at: isoAgo(1),
  },
  {
    id: 'demo-task-007',
    project_id: DEMO_PROJECT_ID,
    column_id: DEMO_COLUMN_IDS.IN_PROGRESS,
    title: '검색 기능 고도화',
    description: '태스크 제목, 설명, 라벨, 담당자 기반의 통합 검색',
    priority: 'medium' as const,
    assignee_id: DEMO_MEMBER_IDS.BOB,
    due_date: daysFromNow(6),
    position: 2,
    created_by: DEMO_MEMBER_IDS.ALICE,
    created_at: isoAgo(9),
    updated_at: isoAgo(1),
  },
  // Done (3개)
  {
    id: 'demo-task-008',
    project_id: DEMO_PROJECT_ID,
    column_id: DEMO_COLUMN_IDS.DONE,
    title: '프로젝트 초기 설정',
    description: 'Next.js + Supabase 프로젝트 스캐폴딩 완료',
    priority: 'high' as const,
    assignee_id: DEMO_USER_ID,
    due_date: daysFromNow(-10),
    position: 0,
    created_by: DEMO_USER_ID,
    created_at: isoAgo(14),
    updated_at: isoAgo(12),
  },
  {
    id: 'demo-task-009',
    project_id: DEMO_PROJECT_ID,
    column_id: DEMO_COLUMN_IDS.DONE,
    title: 'OAuth 로그인 구현',
    description: 'Google, Kakao 소셜 로그인 연동 완료',
    priority: 'urgent' as const,
    assignee_id: DEMO_MEMBER_IDS.ALICE,
    due_date: daysFromNow(-7),
    position: 1,
    created_by: DEMO_USER_ID,
    created_at: isoAgo(13),
    updated_at: isoAgo(8),
  },
  {
    id: 'demo-task-010',
    project_id: DEMO_PROJECT_ID,
    column_id: DEMO_COLUMN_IDS.DONE,
    title: '데이터베이스 스키마 설계',
    description: 'ERD 작성 및 Supabase 마이그레이션 완료',
    priority: 'high' as const,
    assignee_id: DEMO_MEMBER_IDS.BOB,
    due_date: daysFromNow(-5),
    position: 2,
    created_by: DEMO_USER_ID,
    created_at: isoAgo(12),
    updated_at: isoAgo(6),
  },
]

// ── Labels ──

export const DEMO_LABELS = [
  {
    id: DEMO_LABEL_IDS.BUG,
    project_id: DEMO_PROJECT_ID,
    name: 'Bug',
    color: '#EF4444',
    created_at: isoAgo(14),
  },
  {
    id: DEMO_LABEL_IDS.FEATURE,
    project_id: DEMO_PROJECT_ID,
    name: 'Feature',
    color: '#3B82F6',
    created_at: isoAgo(14),
  },
  {
    id: DEMO_LABEL_IDS.DESIGN,
    project_id: DEMO_PROJECT_ID,
    name: 'Design',
    color: '#8B5CF6',
    created_at: isoAgo(14),
  },
  {
    id: DEMO_LABEL_IDS.DOCS,
    project_id: DEMO_PROJECT_ID,
    name: 'Docs',
    color: '#22C55E',
    created_at: isoAgo(14),
  },
]

// ── Task Labels ──

export const DEMO_TASK_LABELS = [
  { task_id: 'demo-task-001', label_id: DEMO_LABEL_IDS.DESIGN },
  { task_id: 'demo-task-002', label_id: DEMO_LABEL_IDS.DOCS },
  { task_id: 'demo-task-003', label_id: DEMO_LABEL_IDS.FEATURE },
  { task_id: 'demo-task-004', label_id: DEMO_LABEL_IDS.BUG },
  { task_id: 'demo-task-005', label_id: DEMO_LABEL_IDS.FEATURE },
  { task_id: 'demo-task-006', label_id: DEMO_LABEL_IDS.FEATURE },
  { task_id: 'demo-task-007', label_id: DEMO_LABEL_IDS.FEATURE },
]

// ── Subtasks ──

export const DEMO_SUBTASKS = [
  {
    id: 'demo-sub-001',
    task_id: 'demo-task-001',
    project_id: DEMO_PROJECT_ID,
    title: '와이어프레임 작성',
    completed: true,
    position: 0,
    created_by: DEMO_USER_ID,
    created_at: isoAgo(7),
    updated_at: isoAgo(5),
  },
  {
    id: 'demo-sub-002',
    task_id: 'demo-task-001',
    project_id: DEMO_PROJECT_ID,
    title: 'UI 컴포넌트 구현',
    completed: false,
    position: 1,
    created_by: DEMO_USER_ID,
    created_at: isoAgo(7),
    updated_at: isoAgo(7),
  },
  {
    id: 'demo-sub-003',
    task_id: 'demo-task-005',
    project_id: DEMO_PROJECT_ID,
    title: 'WebSocket 연결 설정',
    completed: true,
    position: 0,
    created_by: DEMO_MEMBER_IDS.ALICE,
    created_at: isoAgo(10),
    updated_at: isoAgo(4),
  },
  {
    id: 'demo-sub-004',
    task_id: 'demo-task-005',
    project_id: DEMO_PROJECT_ID,
    title: '알림 UI 컴포넌트',
    completed: false,
    position: 1,
    created_by: DEMO_MEMBER_IDS.ALICE,
    created_at: isoAgo(10),
    updated_at: isoAgo(10),
  },
  {
    id: 'demo-sub-005',
    task_id: 'demo-task-006',
    project_id: DEMO_PROJECT_ID,
    title: '타임라인 렌더링 엔진',
    completed: true,
    position: 0,
    created_by: DEMO_USER_ID,
    created_at: isoAgo(8),
    updated_at: isoAgo(3),
  },
]

// ── Task Comments ──

export const DEMO_TASK_COMMENTS = [
  {
    id: 'demo-comment-001',
    task_id: 'demo-task-001',
    project_id: DEMO_PROJECT_ID,
    user_id: DEMO_USER_ID,
    content: '디자인 시안 검토 부탁드립니다.',
    mentions: null,
    created_at: isoAgo(6),
    updated_at: isoAgo(6),
  },
  {
    id: 'demo-comment-002',
    task_id: 'demo-task-001',
    project_id: DEMO_PROJECT_ID,
    user_id: DEMO_MEMBER_IDS.ALICE,
    content: '색상 팔레트를 좀 더 밝게 하면 좋을 것 같아요!',
    mentions: null,
    created_at: isoAgo(5),
    updated_at: isoAgo(5),
  },
  {
    id: 'demo-comment-003',
    task_id: 'demo-task-005',
    project_id: DEMO_PROJECT_ID,
    user_id: DEMO_MEMBER_IDS.ALICE,
    content: 'WebSocket 연결 테스트 완료했습니다.',
    mentions: null,
    created_at: isoAgo(3),
    updated_at: isoAgo(3),
  },
  {
    id: 'demo-comment-004',
    task_id: 'demo-task-006',
    project_id: DEMO_PROJECT_ID,
    user_id: DEMO_MEMBER_IDS.BOB,
    content: '의존성 화살표 렌더링 로직 참고할게요.',
    mentions: null,
    created_at: isoAgo(2),
    updated_at: isoAgo(2),
  },
]

// ── Task Attachments ──

export const DEMO_TASK_ATTACHMENTS = [
  {
    id: 'demo-attach-001',
    task_id: 'demo-task-001',
    project_id: DEMO_PROJECT_ID,
    user_id: DEMO_USER_ID,
    file_name: 'design-spec.pdf',
    file_path: `${DEMO_PROJECT_ID}/demo-task-001/design-spec.pdf`,
    file_size: 2048,
    content_type: 'application/pdf',
    created_at: isoAgo(6),
  },
  {
    id: 'demo-attach-002',
    task_id: 'demo-task-001',
    project_id: DEMO_PROJECT_ID,
    user_id: DEMO_MEMBER_IDS.ALICE,
    file_name: 'wireframe.png',
    file_path: `${DEMO_PROJECT_ID}/demo-task-001/wireframe.png`,
    file_size: 4096,
    content_type: 'image/png',
    created_at: isoAgo(5),
  },
]

// ── Task Dependencies ──

export const DEMO_TASK_DEPENDENCIES = [
  {
    id: 'demo-dep-001',
    project_id: DEMO_PROJECT_ID,
    blocking_task_id: 'demo-task-008',
    blocked_task_id: 'demo-task-005',
    created_by: DEMO_USER_ID,
    created_at: isoAgo(10),
  },
  {
    id: 'demo-dep-002',
    project_id: DEMO_PROJECT_ID,
    blocking_task_id: 'demo-task-009',
    blocked_task_id: 'demo-task-001',
    created_by: DEMO_USER_ID,
    created_at: isoAgo(8),
  },
]

// ── Notifications ──

export const DEMO_NOTIFICATIONS = [
  {
    id: 'demo-notif-001',
    project_id: DEMO_PROJECT_ID,
    user_id: DEMO_USER_ID,
    actor_id: DEMO_MEMBER_IDS.ALICE,
    type: 'task_assigned',
    title: '새 태스크 할당',
    message: '김민지님이 "실시간 알림 기능 구현"을 완료 표시했습니다.',
    entity_type: 'task',
    entity_id: 'demo-task-005',
    is_read: false,
    created_at: isoAgo(1),
  },
  {
    id: 'demo-notif-002',
    project_id: DEMO_PROJECT_ID,
    user_id: DEMO_USER_ID,
    actor_id: DEMO_MEMBER_IDS.BOB,
    type: 'comment_added',
    title: '새 댓글',
    message: '이준호님이 "간트 차트 뷰 개발"에 댓글을 남겼습니다.',
    entity_type: 'task',
    entity_id: 'demo-task-006',
    is_read: false,
    created_at: isoAgo(2),
  },
  {
    id: 'demo-notif-003',
    project_id: DEMO_PROJECT_ID,
    user_id: DEMO_USER_ID,
    actor_id: DEMO_MEMBER_IDS.CHARLIE,
    type: 'task_assigned',
    title: '태스크 할당',
    message: '박서연님이 "다크 모드 색상 체계 개선"에 할당되었습니다.',
    entity_type: 'task',
    entity_id: 'demo-task-004',
    is_read: true,
    created_at: isoAgo(3),
  },
]

// ── Activity Logs ──

export const DEMO_ACTIVITY_LOGS = [
  {
    id: 'demo-log-001',
    project_id: DEMO_PROJECT_ID,
    user_id: DEMO_USER_ID,
    action_type: 'create',
    entity_type: 'project',
    entity_id: DEMO_PROJECT_ID,
    metadata: { title: '협업 대시보드 데모' },
    created_at: isoAgo(14),
  },
  {
    id: 'demo-log-002',
    project_id: DEMO_PROJECT_ID,
    user_id: DEMO_USER_ID,
    action_type: 'create',
    entity_type: 'task',
    entity_id: 'demo-task-001',
    metadata: { title: '사용자 프로필 페이지 디자인' },
    created_at: isoAgo(7),
  },
  {
    id: 'demo-log-003',
    project_id: DEMO_PROJECT_ID,
    user_id: DEMO_MEMBER_IDS.ALICE,
    action_type: 'update',
    entity_type: 'task',
    entity_id: 'demo-task-005',
    metadata: { title: '실시간 알림 기능 구현', field: 'column', from: '할 일', to: '진행 중' },
    created_at: isoAgo(5),
  },
  {
    id: 'demo-log-004',
    project_id: DEMO_PROJECT_ID,
    user_id: DEMO_USER_ID,
    action_type: 'update',
    entity_type: 'task',
    entity_id: 'demo-task-008',
    metadata: { title: '프로젝트 초기 설정', field: 'column', from: '진행 중', to: '완료' },
    created_at: isoAgo(12),
  },
  {
    id: 'demo-log-005',
    project_id: DEMO_PROJECT_ID,
    user_id: DEMO_MEMBER_IDS.BOB,
    action_type: 'create',
    entity_type: 'task',
    entity_id: 'demo-task-010',
    metadata: { title: '데이터베이스 스키마 설계' },
    created_at: isoAgo(12),
  },
  {
    id: 'demo-log-006',
    project_id: DEMO_PROJECT_ID,
    user_id: DEMO_MEMBER_IDS.ALICE,
    action_type: 'update',
    entity_type: 'task',
    entity_id: 'demo-task-009',
    metadata: { title: 'OAuth 로그인 구현', field: 'column', from: '진행 중', to: '완료' },
    created_at: isoAgo(8),
  },
  {
    id: 'demo-log-007',
    project_id: DEMO_PROJECT_ID,
    user_id: DEMO_MEMBER_IDS.CHARLIE,
    action_type: 'create',
    entity_type: 'comment',
    entity_id: 'demo-comment-004',
    metadata: { task_title: '간트 차트 뷰 개발' },
    created_at: isoAgo(2),
  },
  {
    id: 'demo-log-008',
    project_id: DEMO_PROJECT_ID,
    user_id: DEMO_USER_ID,
    action_type: 'update',
    entity_type: 'task',
    entity_id: 'demo-task-006',
    metadata: { title: '간트 차트 뷰 개발', field: 'priority', from: 'low', to: 'medium' },
    created_at: isoAgo(1),
  },
]

// ── Dashboard Layouts ──

export const DEMO_DASHBOARD_LAYOUTS = [
  {
    id: 'demo-layout-001',
    project_id: DEMO_PROJECT_ID,
    user_id: DEMO_USER_ID,
    layout: [
      { widget_id: 'default-task-status', type: 'task-status', x: 0, y: 0, w: 4, h: 3 },
      { widget_id: 'default-weekly-progress', type: 'weekly-progress', x: 4, y: 0, w: 4, h: 3 },
      { widget_id: 'default-burndown', type: 'burndown', x: 8, y: 0, w: 4, h: 3 },
      { widget_id: 'default-member-list', type: 'member-list', x: 0, y: 3, w: 4, h: 3 },
    ],
    created_at: isoAgo(14),
    updated_at: NOW,
  },
]

// ── Project Integrations (빈 배열) ──

export const DEMO_PROJECT_INTEGRATIONS: Record<string, unknown>[] = []

// ── User Messages ──

export const DEMO_USER_MESSAGES = [
  {
    id: 'demo-msg-001',
    user_id: DEMO_USER_ID,
    message: '데모 모드에 오신 것을 환영합니다! 자유롭게 기능을 체험해보세요.',
    is_read: false,
    created_at: isoAgo(1),
  },
]

// ── 전체 데이터 맵 (테이블명 → 데이터 배열) ──

export function createInitialDemoData(): Map<string, Record<string, unknown>[]> {
  const map = new Map<string, Record<string, unknown>[]>()

  map.set('profiles', structuredClone(DEMO_PROFILES) as Record<string, unknown>[])
  map.set('projects', structuredClone(DEMO_PROJECTS) as Record<string, unknown>[])
  map.set('project_members', structuredClone(DEMO_PROJECT_MEMBERS) as Record<string, unknown>[])
  map.set('kanban_columns', structuredClone(DEMO_KANBAN_COLUMNS) as Record<string, unknown>[])
  map.set('tasks', structuredClone(DEMO_TASKS) as Record<string, unknown>[])
  map.set('labels', structuredClone(DEMO_LABELS) as Record<string, unknown>[])
  map.set('task_labels', structuredClone(DEMO_TASK_LABELS) as Record<string, unknown>[])
  map.set('subtasks', structuredClone(DEMO_SUBTASKS) as Record<string, unknown>[])
  map.set('task_comments', structuredClone(DEMO_TASK_COMMENTS) as Record<string, unknown>[])
  map.set('task_attachments', structuredClone(DEMO_TASK_ATTACHMENTS) as Record<string, unknown>[])
  map.set('task_dependencies', structuredClone(DEMO_TASK_DEPENDENCIES) as Record<string, unknown>[])
  map.set('notifications', structuredClone(DEMO_NOTIFICATIONS) as Record<string, unknown>[])
  map.set('activity_logs', structuredClone(DEMO_ACTIVITY_LOGS) as Record<string, unknown>[])
  map.set('dashboard_layouts', structuredClone(DEMO_DASHBOARD_LAYOUTS) as Record<string, unknown>[])
  map.set('project_integrations', structuredClone(DEMO_PROJECT_INTEGRATIONS) as Record<string, unknown>[])
  map.set('user_messages', structuredClone(DEMO_USER_MESSAGES) as Record<string, unknown>[])

  return map
}
