// 데모 모드 상수

export const DEMO_COOKIE_NAME = 'demo_mode' as const

// 데모 유저/프로젝트 ID (UUID 형식)
export const DEMO_USER_ID = 'demo-0000-0000-0000-000000000001' as const
export const DEMO_PROJECT_ID = 'demo-proj-0000-0000-000000000001' as const

// 데모 팀원 ID
export const DEMO_MEMBER_IDS = {
  ALICE: 'demo-0000-0000-0000-000000000002',
  BOB: 'demo-0000-0000-0000-000000000003',
  CHARLIE: 'demo-0000-0000-0000-000000000004',
} as const

// 칸반 컬럼 ID
export const DEMO_COLUMN_IDS = {
  TODO: 'demo-col-0000-0000-000000000001',
  IN_PROGRESS: 'demo-col-0000-0000-000000000002',
  DONE: 'demo-col-0000-0000-000000000003',
  DISCUSSION: 'demo-col-0000-0000-000000000004',
} as const

// 라벨 ID
export const DEMO_LABEL_IDS = {
  BUG: 'demo-label-0000-000000000001',
  FEATURE: 'demo-label-0000-000000000002',
  DESIGN: 'demo-label-0000-000000000003',
  DOCS: 'demo-label-0000-000000000004',
} as const

// 반복 태스크 ID
export const DEMO_RECURRENCE_IDS = {
  WEEKLY_REVIEW: 'demo-rec-0000-000000000001',
} as const

// 태스크 담당자 ID
export const DEMO_TASK_ASSIGNEE_IDS = {
  TA_001: 'demo-ta-0000-000000000001',
  TA_002: 'demo-ta-0000-000000000002',
  TA_003: 'demo-ta-0000-000000000003',
  TA_004: 'demo-ta-0000-000000000004',
  TA_005: 'demo-ta-0000-000000000005',
} as const

// 태스크 템플릿 ID
export const DEMO_TEMPLATE_IDS = {
  BUG_REPORT: 'demo-tmpl-0000-000000000001',
  FEATURE_REQUEST: 'demo-tmpl-0000-000000000002',
  IMPROVEMENT: 'demo-tmpl-0000-000000000003',
} as const

// 시간 추적 ID
export const DEMO_TIME_ENTRY_IDS = {
  TE_001: 'demo-te-0000-000000000001',
  TE_002: 'demo-te-0000-000000000002',
  TE_003: 'demo-te-0000-000000000003',
  TE_004: 'demo-te-0000-000000000004',
  TE_005: 'demo-te-0000-000000000005',
  TE_006: 'demo-te-0000-000000000006',
} as const

// 커스텀 필드 ID
export const DEMO_CUSTOM_FIELD_IDS = {
  STORY_POINTS: 'demo-cf-0000-000000000001',
  ENVIRONMENT: 'demo-cf-0000-000000000002',
} as const

// 스프린트 ID
export const DEMO_SPRINT_IDS = {
  SPRINT_1: 'demo-sprint-0000-000000000001',
  SPRINT_2: 'demo-sprint-0000-000000000002',
  SPRINT_3: 'demo-sprint-0000-000000000003',
} as const

// 자동화 규칙 ID
export const DEMO_AUTOMATION_RULE_IDS = {
  RULE_1: 'demo-auto-0000-000000000001',
  RULE_2: 'demo-auto-0000-000000000002',
  RULE_3: 'demo-auto-0000-000000000003',
} as const

// 자동화 실행 ID
export const DEMO_AUTOMATION_EXECUTION_IDS = {
  EXEC_1: 'demo-exec-0000-000000000001',
  EXEC_2: 'demo-exec-0000-000000000002',
  EXEC_3: 'demo-exec-0000-000000000003',
  EXEC_4: 'demo-exec-0000-000000000004',
} as const
