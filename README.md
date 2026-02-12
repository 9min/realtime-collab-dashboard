# Realtime Collab Dashboard

소규모 팀(2-8명)을 위한 실시간 협업 대시보드. 칸반 보드, 간트 차트, 캘린더, 워크로드, 커스텀 위젯, 실시간 동기화를 지원합니다.

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 15 (App Router) + TypeScript (strict) |
| Styling | Tailwind CSS + shadcn/ui |
| Server State | TanStack Query v5 |
| Client State | Zustand |
| Form | React Hook Form + Zod |
| DnD | @hello-pangea/dnd |
| Charts | Recharts |
| Auth/DB | Supabase (Auth, Database, Realtime, Storage) |
| Caching | Upstash Redis (optional) |
| Error Tracking | Sentry |
| Testing | Vitest + Testing Library + Playwright + MSW |
| CI/CD | GitHub Actions |

## Features

### Core
- **Authentication**: Google / Kakao OAuth, 세션 관리, 데모 모드 (체험하기)
- **Project Management**: 프로젝트 CRUD, 멤버 초대/역할 관리, 기능 플래그
- **Kanban Board**: 드래그앤드롭, 컬럼 관리, WIP 제한, 스윔레인, 필터/검색, CSV 내보내기
- **Dashboard**: 위젯 그리드 (DnD), 태스크 상태 차트, 주간 진행률, 번다운 차트
- **Realtime Sync**: Supabase Realtime + Optimistic Update + 폴링 폴백
- **Online Presence**: 프로젝트별 접속자 실시간 표시

### Collaboration
- **Comments & Mentions**: Markdown 댓글, @멘션 자동완성, 알림 연동
- **File Attachments**: Supabase Storage (최대 10MB/파일)
- **Notifications**: 실시간 알림 (벨 아이콘 + 미읽은 수)
- **Activity Log**: 트리거 기반 활동 추적, 필터링, 통계

### Advanced
- **Subtasks**: 체크박스 기반 서브태스크
- **Labels**: 프로젝트 라벨 + 기본 라벨 자동 생성
- **Task Dependencies**: blocking/blocked-by + 간트 차트 연동
- **Task Favorites**: 즐겨찾기 토글
- **Recurring Tasks**: 일/주/월 반복 태스크 자동 생성
- **Filter Presets**: 칸반 필터 자동 저장/복원

### Views
- **Gantt Chart**: 타임라인 바 + 의존성 화살표
- **Calendar**: 월별 캘린더 + 마감일 기준 태스크 배치
- **Workload Chart**: 멤버별 태스크 분포 (우선순위별 스택 바 차트)
- **My Tasks**: 전체 프로젝트 태스크 통합 조회
- **Global Search**: Cmd+K / Ctrl+K 통합 검색

### Infrastructure
- **CI/CD**: GitHub Actions (lint, type-check, test, build)
- **Error Tracking**: Sentry (Client/Server/Edge)
- **Rate Limiting**: Sliding Window 기반 API 요청 제한
- **Redis Caching**: Upstash Cache-Aside 패턴 (Graceful Degradation)
- **Connection Resilience**: 지수 백오프 재연결 + 폴링 폴백

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10+
- Supabase 프로젝트 (또는 데모 모드로 체험 가능)

### Installation

```bash
pnpm install
```

### Environment Variables

`.env.example`을 복사하여 `.env.local`을 생성하고 값을 설정합니다.

```bash
# Client-side
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Server-only
SUPABASE_SERVICE_ROLE_KEY=

# Optional
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
NEXT_PUBLIC_SENTRY_DSN=
```

### Development

```bash
pnpm dev
```

[http://localhost:3000](http://localhost:3000)에서 확인할 수 있습니다.

### Commands

```bash
pnpm dev              # 개발 서버
pnpm build            # 프로덕션 빌드
pnpm lint             # ESLint
pnpm type-check       # TypeScript 타입 체크
pnpm test             # 단위 테스트 (Vitest)
pnpm test:watch       # 워치 모드
pnpm test:coverage    # 커버리지 포함
pnpm test:e2e         # E2E 테스트 (Playwright)
```

## Database

- **20개 테이블**: profiles, projects, project_members, kanban_columns, tasks, task_comments, task_attachments, labels, task_labels, subtasks, task_dependencies, notifications, activity_logs, dashboard_layouts, project_integrations, user_messages, due_date_notifications_log, task_favorites, task_recurrences, kanban_filter_presets
- **39개 마이그레이션**: `supabase/migrations/` 순차 관리
- **RLS**: 모든 테이블에 Row Level Security 적용

## Documentation

- [PRD](./docs/PRD.md) - 제품 요구사항
- [Architecture](./docs/ARCHITECTURE.md) - 기술 설계
