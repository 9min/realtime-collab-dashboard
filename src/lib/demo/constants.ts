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
} as const

// 라벨 ID
export const DEMO_LABEL_IDS = {
  BUG: 'demo-label-0000-000000000001',
  FEATURE: 'demo-label-0000-000000000002',
  DESIGN: 'demo-label-0000-000000000003',
  DOCS: 'demo-label-0000-000000000004',
} as const
