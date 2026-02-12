import {
  DEMO_USER_ID,
  DEMO_PROJECT_ID,
  DEMO_MEMBER_IDS,
  DEMO_COLUMN_IDS,
  DEMO_LABEL_IDS,
  DEMO_RECURRENCE_IDS,
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
    description: `## 목표
사용자가 자신의 프로필 정보를 직관적으로 확인하고 수정할 수 있는 페이지를 디자인합니다.

## 주요 화면 구성
- **프로필 헤더**: 아바타(120x120) + 이름 + 이메일 + 역할 배지
- **정보 수정 폼**: 닉네임 변경 (최대 20자), 자기소개 (최대 200자)
- **아바타 업로드**: 드래그앤드롭 또는 클릭으로 이미지 업로드 (최대 5MB, JPG/PNG)
- **계정 관리**: 비밀번호 변경 버튼, 계정 삭제 (위험 영역으로 시각적 분리)

## 디자인 요구사항
- 라이트/다크 모드 모두 지원
- 모바일 반응형 (768px 이하에서 단일 컬럼 레이아웃)
- shadcn/ui 컴포넌트 활용 (Card, Avatar, Input, Button)
- 저장 시 성공/실패 Toast 알림`,
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
    description: `## 목표
프론트엔드 및 외부 개발자가 참조할 수 있는 REST API 명세서를 작성합니다.

## 문서화 대상 엔드포인트
1. **인증** — \`POST /auth/login\`, \`POST /auth/logout\`, \`POST /auth/refresh\`
2. **프로젝트** — CRUD (\`/api/projects\`)
3. **태스크** — CRUD + 상태 변경 (\`/api/tasks\`)
4. **멤버** — 초대, 역할 변경, 제거 (\`/api/projects/:id/members\`)
5. **알림** — 목록 조회, 읽음 처리 (\`/api/notifications\`)

## 작성 항목 (엔드포인트별)
- HTTP 메서드 + URL 패턴
- Request Body / Query Params 스키마 (TypeScript 타입 포함)
- Response 예시 (성공 200 / 에러 400, 401, 403, 404)
- 인증 요구사항 (Bearer token, RLS 정책)

## 도구
OpenAPI 3.0 스펙 기반으로 작성하고, Swagger UI로 인터랙티브 테스트 가능하도록 구성`,
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
    description: `## 목표
사용자에게 중요한 이벤트 발생 시 이메일로 알림을 발송하는 시스템을 구현합니다.

## 알림 트리거 이벤트
| 이벤트 | 수신자 | 발송 조건 |
|--------|--------|-----------|
| 태스크 할당 | 담당자 | 즉시 발송 |
| 마감일 임박 | 담당자 | D-1, D-3 자동 발송 |
| @멘션 | 멘션된 사용자 | 즉시 발송 |
| 프로젝트 초대 | 초대받은 사용자 | 즉시 발송 |

## 기술 요구사항
- **이메일 서비스**: Resend 또는 SendGrid API 연동
- **템플릿**: React Email로 HTML 이메일 템플릿 작성 (반응형)
- **큐잉**: Supabase Edge Function + pg_cron으로 마감일 알림 스케줄링
- **발송 제한**: 사용자당 시간당 최대 20건 (스팸 방지)
- **수신 설정**: 사용자별 이메일 알림 On/Off 토글 (프로필 설정에서 관리)

## 참고
현재 인앱 알림은 구현 완료 상태이므로, 기존 notification 트리거에 이메일 발송 로직을 추가하는 방식으로 구현`,
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
    description: `## 문제
현재 다크 모드에서 일부 요소의 색상 대비가 WCAG 2.1 AA 기준(4.5:1)을 충족하지 못하고 있습니다.

## 문제 발생 영역
1. **칸반 카드 배경** — 컬럼 배경과 카드 배경의 구분이 어려움 (대비 1.8:1)
2. **우선순위 배지** — \`low\` 우선순위의 녹색 텍스트가 다크 배경에서 가독성 부족
3. **간트 차트 바** — 의존성 화살표 색상이 배경에 묻힘
4. **스윔레인 헤더** — 구분선이 거의 보이지 않음
5. **라벨 뱃지** — 일부 색상 조합에서 텍스트 대비 미달

## 개선 방안 (논의 필요)
- **방안 A**: CSS 변수 기반으로 다크 모드 전용 색상 팔레트 정의
- **방안 B**: Tailwind \`dark:\` 변형을 활용해 개별 컴포넌트에서 오버라이드
- **방안 C**: shadcn/ui 테마 커스터마이징으로 전역 색상 체계 재정의

## 검증 방법
- Chrome DevTools의 색상 대비 검사 도구 활용
- axe-core 접근성 자동 검사 E2E 테스트에 포함`,
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
    description: `## 목표
사용자에게 태스크 변경, 멘션, 할당 등의 이벤트를 실시간으로 전달하는 알림 시스템을 구축합니다.

## 구현 범위

### 백엔드
- Supabase Realtime \`postgres_changes\` 구독으로 \`notifications\` 테이블 변경 감지
- DB 트리거로 이벤트 발생 시 자동 알림 레코드 생성
- 알림 유형: \`task_assigned\`, \`comment_added\`, \`mentioned\`, \`due_soon\`

### 프론트엔드
- **글로벌 Realtime 구독**: 프로젝트 무관하게 사용자의 모든 알림 실시간 수신
- **헤더 벨 아이콘**: 미읽은 알림 수 뱃지 표시
- **알림 드롭다운**: 최근 알림 20건 표시, 개별/전체 읽음 처리
- **클릭 네비게이션**: 알림 클릭 시 해당 태스크/댓글로 이동
- **Toast 알림**: 새 알림 수신 시 화면 우측 하단에 일시적 알림 표시

## 진행 상황
- [x] notifications 테이블 스키마 설계
- [x] Supabase Realtime 채널 구독 설정
- [ ] 알림 UI 컴포넌트 (벨 아이콘 + 드롭다운)
- [ ] 읽음 처리 API 연동
- [ ] Toast 알림 연동`,
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
    description: `## 목표
프로젝트의 태스크들을 타임라인 형태로 시각화하여 일정 관리와 의존성 파악을 용이하게 합니다.

## 기능 요구사항

### 타임라인 렌더링
- 각 태스크를 시작일~마감일 범위의 수평 바로 표시
- 우선순위별 색상 구분 (urgent: 빨강, high: 주황, medium: 파랑, low: 초록)
- 월 단위 컬럼 기반 날짜 헤더 (실제 월 기준 너비 계산)

### 의존성 화살표
- \`task_dependencies\` 테이블 기반으로 blocking → blocked 화살표 표시
- SVG 베지어 곡선으로 자연스러운 연결선 렌더링
- 순환 의존성 감지 시 경고 표시

### 인터랙션
- 좌우 스크롤로 타임라인 네비게이션
- 태스크 바 클릭 시 상세 다이얼로그 열기
- "오늘" 버튼으로 현재 날짜 위치로 이동

## 기술 결정
- \`next/dynamic\`으로 코드 스플리팅 (Recharts 미사용, 커스텀 SVG 기반)
- 50개 이상 태스크 시 가상 스크롤 적용 검토

## 진행 상황
- [x] 타임라인 렌더링 엔진 구현
- [ ] 의존성 화살표 SVG 연결
- [ ] 날짜 네비게이션 UI`,
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
    description: `## 목표
\`Cmd+K\` / \`Ctrl+K\`로 열리는 글로벌 검색 다이얼로그를 구현하여 프로젝트, 태스크, 댓글을 통합 검색합니다.

## 검색 대상 및 필드
| 엔티티 | 검색 필드 | 표시 정보 |
|--------|-----------|-----------|
| 프로젝트 | name, description | 이름 + 멤버 수 |
| 태스크 | title, description | 제목 + 상태 + 담당자 |
| 댓글 | content | 내용 미리보기 + 태스크 제목 |

## UI/UX 요구사항
- **키보드 단축키**: \`Cmd+K\` (Mac) / \`Ctrl+K\` (Windows)
- **디바운싱**: 입력 후 300ms 대기, 2자 이상부터 검색 실행
- **결과 그룹핑**: 프로젝트 / 태스크 / 댓글로 카테고리별 그룹 표시
- **키보드 네비게이션**: 화살표 키로 결과 이동, Enter로 선택
- **최근 검색어**: 최근 5개 검색어 로컬 저장 및 표시

## 기술 구현
- Supabase \`ilike\` 연산자 활용 (PostgreSQL 패턴 매칭)
- 입력 필드 포커스 시 글로벌 키보드 단축키 비활성화
- cmdk 라이브러리 또는 직접 구현 (shadcn/ui CommandDialog 활용)`,
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
    description: `## 완료 내용
프로젝트의 기반 기술 스택 구성과 개발 환경 셋업을 완료했습니다.

## 설정 항목
- **프레임워크**: Next.js 15 (App Router) + TypeScript strict 모드
- **패키지 매니저**: pnpm (workspace 설정)
- **스타일링**: Tailwind CSS v4 + shadcn/ui 컴포넌트 라이브러리 설치
- **상태관리**: TanStack Query v5 + Zustand 초기 설정
- **린트/포맷**: ESLint + Prettier 설정 (import 순서 규칙 포함)
- **테스트**: Vitest + Testing Library + MSW 초기 설정
- **DB**: Supabase 프로젝트 생성 + 로컬 개발 환경 연결
- **배포**: Vercel 프로젝트 연결 + 환경변수 설정

## 디렉토리 구조
\`src/\` 하위에 \`app/\`, \`components/\`, \`hooks/\`, \`lib/\`, \`services/\`, \`queries/\`, \`stores/\`, \`types/\` 표준 구조 생성 완료`,
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
    description: `## 완료 내용
Google 및 Kakao OAuth 소셜 로그인을 Supabase Auth로 구현 완료했습니다.

## 구현 사항

### 인증 플로우
1. 사용자가 로그인 페이지에서 Google/Kakao 버튼 클릭
2. Supabase Auth → OAuth Provider 리다이렉트
3. 인증 완료 후 \`/callback\` 라우트에서 세션 교환
4. \`profiles\` 테이블에 사용자 정보 자동 생성 (DB 트리거)
5. 대시보드(\`/projects\`)로 리다이렉트

### 보안
- PKCE flow 적용 (CSRF 방지)
- httpOnly 쿠키 기반 세션 관리
- Middleware에서 보호된 경로 접근 제어
- 세션 만료 시 로그인 페이지로 자동 리다이렉트

### 추가 구현
- 프로필 자동 생성 트리거 (\`handle_new_user\`)
- OAuth 메타데이터에서 이름, 아바타 URL 추출
- 로그아웃 기능 + 세션 정리`,
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
    description: `## 완료 내용
서비스 전체 데이터 모델을 설계하고 Supabase 마이그레이션으로 반영 완료했습니다.

## 설계된 테이블 (핵심)
| 테이블 | 용도 | 주요 관계 |
|--------|------|-----------|
| \`profiles\` | 사용자 프로필 | auth.users 확장 |
| \`projects\` | 프로젝트 | owner_id → profiles |
| \`project_members\` | 멤버십 (N:N) | project_id + user_id (UNIQUE) |
| \`kanban_columns\` | 칸반 컬럼 | project_id, position 기반 정렬 |
| \`tasks\` | 태스크 | column_id, assignee_id, priority |
| \`dashboard_layouts\` | 위젯 레이아웃 | JSONB로 유연한 구조 저장 |

## RLS (Row Level Security) 정책
- 모든 테이블에 RLS 활성화
- \`is_project_member()\` 헬퍼 함수로 프로젝트 멤버 여부 확인
- \`has_project_role()\` 헬퍼 함수로 역할 기반 접근 제어
- CASCADE 삭제: 프로젝트 삭제 시 연관 데이터 자동 정리

## 마이그레이션
- 초기 스키마 + 인덱스 + 트리거 + RLS 정책을 단일 마이그레이션으로 생성
- \`updated_at\` 자동 갱신 트리거 전체 테이블에 적용`,
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
  // demo-task-001: 사용자 프로필 페이지 디자인
  {
    id: 'demo-comment-001',
    task_id: 'demo-task-001',
    project_id: DEMO_PROJECT_ID,
    user_id: DEMO_USER_ID,
    content: '@김민지 디자인 시안 첨부했는데 색상 조합 쪽 한번 검토 부탁드려요. 특히 다크모드에서 카드 배경색이 좀 어두운 것 같아서 의견 주시면 반영하겠습니다.',
    mentions: [DEMO_MEMBER_IDS.ALICE],
    created_at: isoAgo(6),
    updated_at: isoAgo(6),
  },
  {
    id: 'demo-comment-002',
    task_id: 'demo-task-001',
    project_id: DEMO_PROJECT_ID,
    user_id: DEMO_MEMBER_IDS.ALICE,
    content: '확인했습니다! 전체적으로 깔끔한데 색상 팔레트를 좀 더 밝게 하면 좋을 것 같아요. 아바타 업로드 영역도 드래그앤드롭 지원하면 UX가 좋아질 것 같습니다.',
    mentions: null,
    created_at: isoAgo(5),
    updated_at: isoAgo(5),
  },
  {
    id: 'demo-comment-003',
    task_id: 'demo-task-001',
    project_id: DEMO_PROJECT_ID,
    user_id: DEMO_USER_ID,
    content: '@김민지 피드백 감사합니다. 밝은 팔레트 버전 추가로 만들어서 비교해볼게요. @박서연 모바일 반응형 레이아웃 쪽도 한번 봐주실 수 있을까요?',
    mentions: [DEMO_MEMBER_IDS.ALICE, DEMO_MEMBER_IDS.CHARLIE],
    created_at: isoAgo(4),
    updated_at: isoAgo(4),
  },
  {
    id: 'demo-comment-004',
    task_id: 'demo-task-001',
    project_id: DEMO_PROJECT_ID,
    user_id: DEMO_MEMBER_IDS.CHARLIE,
    content: '네, 모바일 레이아웃 확인해봤는데 768px 이하에서 아바타 섹션이 잘리는 이슈가 있어요. 단일 컬럼으로 전환되는 브레이크포인트를 조정하면 될 것 같습니다.',
    mentions: null,
    created_at: isoAgo(3),
    updated_at: isoAgo(3),
  },
  // demo-task-005: 실시간 알림 기능 구현
  {
    id: 'demo-comment-005',
    task_id: 'demo-task-005',
    project_id: DEMO_PROJECT_ID,
    user_id: DEMO_MEMBER_IDS.ALICE,
    content: 'Supabase Realtime 채널 구독 설정하고 WebSocket 연결 테스트 완료했습니다. postgres_changes 이벤트 정상 수신 확인했어요.',
    mentions: null,
    created_at: isoAgo(4),
    updated_at: isoAgo(4),
  },
  {
    id: 'demo-comment-006',
    task_id: 'demo-task-005',
    project_id: DEMO_PROJECT_ID,
    user_id: DEMO_USER_ID,
    content: '@김민지 좋습니다! 알림 드롭다운 UI는 shadcn/ui의 Popover 컴포넌트로 구현하면 될 것 같아요. 미읽은 수 뱃지도 같이 넣어주세요.',
    mentions: [DEMO_MEMBER_IDS.ALICE],
    created_at: isoAgo(3),
    updated_at: isoAgo(3),
  },
  {
    id: 'demo-comment-007',
    task_id: 'demo-task-005',
    project_id: DEMO_PROJECT_ID,
    user_id: DEMO_MEMBER_IDS.ALICE,
    content: '@이준호 알림 클릭 시 해당 태스크로 네비게이션하는 부분은 라우팅 쪽 코드를 참고해야 할 것 같은데, board 페이지 쪽 코드 공유해주실 수 있나요?',
    mentions: [DEMO_MEMBER_IDS.BOB],
    created_at: isoAgo(2),
    updated_at: isoAgo(2),
  },
  {
    id: 'demo-comment-008',
    task_id: 'demo-task-005',
    project_id: DEMO_PROJECT_ID,
    user_id: DEMO_MEMBER_IDS.BOB,
    content: '네, 칸반 보드에서 taskId searchParam으로 받아서 상세 다이얼로그 여는 방식이에요. `/board?taskId=xxx` 형태로 라우팅하면 됩니다.',
    mentions: null,
    created_at: isoAgo(1),
    updated_at: isoAgo(1),
  },
  // demo-task-006: 간트 차트 뷰 개발
  {
    id: 'demo-comment-009',
    task_id: 'demo-task-006',
    project_id: DEMO_PROJECT_ID,
    user_id: DEMO_USER_ID,
    content: '타임라인 렌더링 엔진 1차 구현 완료했습니다. 월 단위 컬럼 기반으로 실제 월의 일수에 맞게 너비를 계산하도록 했어요.',
    mentions: null,
    created_at: isoAgo(3),
    updated_at: isoAgo(3),
  },
  {
    id: 'demo-comment-010',
    task_id: 'demo-task-006',
    project_id: DEMO_PROJECT_ID,
    user_id: DEMO_MEMBER_IDS.BOB,
    content: '@데모 사용자 의존성 화살표 구현할 때 SVG 베지어 곡선 사용하려고 하는데, task_dependencies 테이블 구조 참고할게요. blocking/blocked 관계가 맞죠?',
    mentions: [DEMO_USER_ID],
    created_at: isoAgo(2),
    updated_at: isoAgo(2),
  },
  {
    id: 'demo-comment-011',
    task_id: 'demo-task-006',
    project_id: DEMO_PROJECT_ID,
    user_id: DEMO_USER_ID,
    content: '@이준호 맞아요. blocking_task_id → blocked_task_id 방향으로 화살표 그리면 됩니다. 순환 의존성은 DB CHECK constraint로 방지되고 있어요.',
    mentions: [DEMO_MEMBER_IDS.BOB],
    created_at: isoAgo(1),
    updated_at: isoAgo(1),
  },
  // demo-task-004: 다크 모드 색상 체계 개선
  {
    id: 'demo-comment-012',
    task_id: 'demo-task-004',
    project_id: DEMO_PROJECT_ID,
    user_id: DEMO_MEMBER_IDS.CHARLIE,
    content: '다크 모드 색상 대비 검사해봤는데 칸반 카드 배경이 1.8:1 정도로 WCAG AA 기준 미달이에요. @데모 사용자 CSS 변수 방식으로 개선하는 게 어떨까요?',
    mentions: [DEMO_USER_ID],
    created_at: isoAgo(2),
    updated_at: isoAgo(2),
  },
  {
    id: 'demo-comment-013',
    task_id: 'demo-task-004',
    project_id: DEMO_PROJECT_ID,
    user_id: DEMO_USER_ID,
    content: '@박서연 동의합니다. shadcn/ui 테마 변수를 오버라이드하는 방식으로 가시죠. @김민지 라벨 뱃지 색상도 같이 확인해주실 수 있나요?',
    mentions: [DEMO_MEMBER_IDS.CHARLIE, DEMO_MEMBER_IDS.ALICE],
    created_at: isoAgo(1),
    updated_at: isoAgo(1),
  },
  // demo-task-007: 검색 기능 고도화
  {
    id: 'demo-comment-014',
    task_id: 'demo-task-007',
    project_id: DEMO_PROJECT_ID,
    user_id: DEMO_MEMBER_IDS.BOB,
    content: 'shadcn/ui CommandDialog 기반으로 작업 중인데 디바운싱 300ms로 설정했습니다. @김민지 검색 결과에 댓글도 포함시킬 건지 확인 부탁드려요.',
    mentions: [DEMO_MEMBER_IDS.ALICE],
    created_at: isoAgo(2),
    updated_at: isoAgo(2),
  },
  {
    id: 'demo-comment-015',
    task_id: 'demo-task-007',
    project_id: DEMO_PROJECT_ID,
    user_id: DEMO_MEMBER_IDS.ALICE,
    content: '네, 댓글도 포함시키는 게 좋을 것 같아요. 프로젝트 / 태스크 / 댓글 3개 카테고리로 그룹핑해서 보여주면 될 것 같습니다.',
    mentions: null,
    created_at: isoAgo(1),
    updated_at: isoAgo(1),
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
      { widget_id: 'default-my-favorites', type: 'my-favorites', x: 4, y: 3, w: 4, h: 3 },
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

// ── Task Favorites ──

export const DEMO_TASK_FAVORITES = [
  { id: 'demo-fav-001', user_id: DEMO_USER_ID, task_id: 'demo-task-001', created_at: isoAgo(2) },
  { id: 'demo-fav-002', user_id: DEMO_USER_ID, task_id: 'demo-task-005', created_at: isoAgo(1) },
  { id: 'demo-fav-003', user_id: DEMO_USER_ID, task_id: 'demo-task-006', created_at: isoAgo(0) },
]

// ── Task Recurrences ──

export const DEMO_TASK_RECURRENCES = [
  {
    id: DEMO_RECURRENCE_IDS.WEEKLY_REVIEW,
    task_id: 'demo-task-004',
    project_id: DEMO_PROJECT_ID,
    frequency: 'weekly',
    interval_value: 1,
    day_of_week: 1,
    day_of_month: null,
    next_due_date: daysFromNow(7),
    is_active: true,
    created_by: DEMO_USER_ID,
    created_at: isoAgo(10),
    updated_at: isoAgo(10),
  },
]

// ── Due Date Notifications Log ──

export const DEMO_DUE_DATE_NOTIFICATIONS_LOG: Record<string, unknown>[] = []

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
  map.set('task_favorites', structuredClone(DEMO_TASK_FAVORITES) as Record<string, unknown>[])
  map.set('task_recurrences', structuredClone(DEMO_TASK_RECURRENCES) as Record<string, unknown>[])
  map.set('due_date_notifications_log', structuredClone(DEMO_DUE_DATE_NOTIFICATIONS_LOG) as Record<string, unknown>[])
  map.set('kanban_filter_presets', [] as Record<string, unknown>[])

  return map
}
