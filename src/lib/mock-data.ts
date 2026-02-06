import type { Tables } from '@/types/database'

// Auth 연결 전 개발용 목 데이터
// TODO: Supabase 연결 후 제거

const MOCK_USER_ID = 'mock-user-001'
const MOCK_PROJECT_ID = 'mock-project-001'

export const MOCK_COLUMNS: Tables<'kanban_columns'>[] = [
  {
    id: 'col-1',
    project_id: MOCK_PROJECT_ID,
    title: 'To Do',
    position: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'col-2',
    project_id: MOCK_PROJECT_ID,
    title: 'In Progress',
    position: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'col-3',
    project_id: MOCK_PROJECT_ID,
    title: 'Done',
    position: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export const MOCK_TASKS: Tables<'tasks'>[] = [
  {
    id: 'task-1',
    project_id: MOCK_PROJECT_ID,
    column_id: 'col-1',
    title: 'Supabase 프로젝트 생성',
    description: 'Supabase 대시보드에서 새 프로젝트 생성 후 환경변수 설정',
    priority: 'high',
    assignee_id: MOCK_USER_ID,
    position: 0,
    due_date: '2026-02-10',
    created_by: MOCK_USER_ID,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'task-2',
    project_id: MOCK_PROJECT_ID,
    column_id: 'col-1',
    title: 'DB 마이그레이션 작성',
    description: 'ARCHITECTURE.md 스키마 기반 SQL 마이그레이션 파일 생성',
    priority: 'medium',
    assignee_id: null,
    position: 1,
    due_date: '2026-02-12',
    created_by: MOCK_USER_ID,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'task-3',
    project_id: MOCK_PROJECT_ID,
    column_id: 'col-2',
    title: 'OAuth 로그인 구현',
    description: 'GitHub, Google OAuth 프로바이더 연동',
    priority: 'urgent',
    assignee_id: MOCK_USER_ID,
    position: 0,
    due_date: '2026-02-08',
    created_by: MOCK_USER_ID,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'task-4',
    project_id: MOCK_PROJECT_ID,
    column_id: 'col-2',
    title: 'RLS 정책 설정',
    description: '테이블별 Row Level Security 정책 작성',
    priority: 'high',
    assignee_id: null,
    position: 1,
    due_date: null,
    created_by: MOCK_USER_ID,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'task-5',
    project_id: MOCK_PROJECT_ID,
    column_id: 'col-3',
    title: '프로젝트 초기 세팅',
    description: 'Next.js + TypeScript + Tailwind + shadcn/ui 구성 완료',
    priority: 'low',
    assignee_id: MOCK_USER_ID,
    position: 0,
    due_date: '2026-02-06',
    created_by: MOCK_USER_ID,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]
