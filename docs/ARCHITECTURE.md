# Technical Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │ Server       │  │ Client       │  │ Realtime           │  │
│  │ Components   │  │ Components   │  │ Subscriptions      │  │
│  │ (RSC)        │  │ (Zustand,    │  │ (Supabase WS)      │  │
│  │              │  │  TanStack Q) │  │                    │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬───────────┘  │
│         │                 │                    │              │
└─────────┼─────────────────┼────────────────────┼──────────────┘
          │                 │                    │
          ▼                 ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 15 (Vercel)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ App Router    │  │ API Routes   │  │ Middleware         │  │
│  │ (SSR/SSG)     │  │ (Server      │  │ (Auth Check)       │  │
│  │              │  │  Actions)    │  │                   │  │
│  └──────┬───────┘  └──────┬───────┘  └───────────────────┘  │
└─────────┼─────────────────┼──────────────────────────────────┘
          │                 │
          ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                     Supabase                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │ Auth      │  │ Database │  │ Realtime  │  │ Storage    │  │
│  │ (OAuth)   │  │ (Postgres│  │ (WebSocket│  │ (Files)    │  │
│  │           │  │  + RLS)  │  │  Channels)│  │            │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Category | Technology | 선택 이유 |
|----------|-----------|-----------|
| Framework | Next.js 15 (App Router) | RSC, Server Actions, 성능 최적화 |
| Language | TypeScript (strict) | 타입 안정성, 리팩토링 안전성 |
| Styling | Tailwind CSS + shadcn/ui | 빠른 개발, 일관된 디자인 시스템 |
| Server State | TanStack Query v5 | 캐싱, 자동 리페칭, optimistic update |
| Client State | Zustand | 단순함, 보일러플레이트 최소화 |
| Form | React Hook Form + Zod | 성능 (uncontrolled), 스키마 검증 |
| DnD | @hello-pangea/dnd | react-beautiful-dnd 후속, 유지보수 활발 |
| Charts | Recharts | React 친화적, 적절한 번들 사이즈 |
| Auth/DB | Supabase | 무료 티어, Realtime, RLS |
| Theme | next-themes | SSR 호환, FOUC 방지 |
| Testing | Vitest + Testing Library + Playwright | 빠른 실행, E2E 커버리지 |
| Linting | ESLint + Prettier | 코드 일관성 |

---

## Folder Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx              # 로그인 페이지 (Canvas 배경 애니메이션)
│   │   ├── callback/
│   │   │   └── route.ts              # OAuth 콜백 핸들러
│   │   └── layout.tsx                # Auth 레이아웃 (centered)
│   ├── (dashboard)/
│   │   ├── admin/
│   │   │   ├── page.tsx              # 관리자 패널 (사용자 관리)
│   │   │   └── monitoring/
│   │   │       └── page.tsx          # 서비스 통계 대시보드
│   │   ├── my-tasks/
│   │   │   └── page.tsx              # 내 태스크 (전체 프로젝트 통합)
│   │   ├── projects/
│   │   │   ├── page.tsx              # 프로젝트 목록
│   │   │   └── [projectId]/
│   │   │       ├── page.tsx          # 대시보드 (위젯 그리드)
│   │   │       ├── board/
│   │   │       │   └── page.tsx      # 칸반 보드
│   │   │       ├── activity/
│   │   │       │   └── page.tsx      # 활동 로그
│   │   │       ├── calendar/
│   │   │       │   └── page.tsx      # 캘린더 뷰
│   │   │       ├── gantt/
│   │   │       │   └── page.tsx      # 간트 차트
│   │   │       ├── workload/
│   │   │       │   └── page.tsx      # 워크로드 차트
│   │   │       └── settings/
│   │   │           └── page.tsx      # 프로젝트 설정
│   │   └── layout.tsx                # Dashboard 레이아웃 (sidebar)
│   ├── api/
│   │   ├── admin/monitoring/         # 서비스 통계 API
│   │   ├── auth/delete-account/      # 계정 삭제 API
│   │   ├── cron/due-reminders/       # 마감일 알림 Cron API
│   │   ├── projects/[projectId]/
│   │   │   ├── integrations/         # 외부 연동 CRUD API
│   │   │   └── members/              # 멤버 관리 API
│   │   └── webhooks/
│   │       ├── dispatch/             # Webhook 중앙 디스패치
│   │       └── slack/test/           # Slack Webhook 테스트
│   ├── layout.tsx                    # Root 레이아웃 (providers)
│   ├── page.tsx                      # 랜딩 or 리다이렉트
│   └── globals.css
│
├── components/
│   ├── ui/                           # shadcn/ui 기본 컴포넌트
│   ├── layout/                       # 사이드바, 헤더, 테마 토글
│   ├── auth/                         # 로그인 페이지 Canvas 배경
│   ├── dashboard/                    # 위젯 그리드, 위젯 카드
│   ├── kanban/                       # 칸반 보드, 컬럼, 태스크 카드, 필터바
│   │   ├── kanban-board.tsx          # 칸반 보드 컨테이너
│   │   ├── kanban-column.tsx         # 단일 컬럼
│   │   ├── task-card.tsx             # 태스크 카드
│   │   ├── task-detail-dialog.tsx    # 태스크 상세/편집
│   │   ├── task-filter-bar.tsx       # 필터 바 (검색, 우선순위, 담당자, 마감일, 라벨)
│   │   ├── swimlane-board.tsx        # 스윔레인 뷰
│   │   ├── favorite-button.tsx       # 즐겨찾기 토글
│   │   ├── recurrence-section.tsx    # 반복 태스크 설정
│   │   ├── label-manager.tsx         # 라벨 매니저
│   │   ├── dependency-section.tsx    # 의존성 관리
│   │   ├── subtask-section.tsx       # 서브태스크
│   │   ├── comment-section.tsx       # 댓글 스레드
│   │   ├── attachment-section.tsx    # 첨부파일
│   │   └── ...                       # 기타 (bulk-delete, export, wip-limit 등)
│   ├── charts/                       # 차트 위젯 (파이, 라인, 번다운)
│   ├── calendar/                     # 캘린더 뷰
│   ├── gantt/                        # 간트 차트
│   ├── workload/                     # 워크로드 차트
│   ├── activity/                     # 활동 로그 피드
│   ├── my-tasks/                     # 내 태스크 목록
│   ├── notification/                 # 알림 벨, 알림 목록
│   ├── presence/                     # 온라인 유저 목록, 아바타
│   ├── profile/                      # 프로필 편집, 아바타 업로드
│   ├── project/                      # 프로젝트 CRUD, 멤버 관리
│   ├── realtime/                     # Realtime 연결 상태 표시
│   ├── search/                       # 글로벌 검색 (Cmd+K)
│   └── providers/                    # Query, Theme, Supabase Provider
│
├── hooks/
│   ├── use-auth.ts                   # 인증 상태 및 액션
│   ├── use-realtime-subscription.ts  # Supabase Realtime 구독 추상화
│   ├── use-notification-realtime.ts  # 글로벌 알림 Realtime 구독
│   ├── use-presence.ts               # Presence 구독/상태
│   ├── use-optimistic-mutation.ts    # Optimistic Update 공통 훅
│   ├── use-keyboard-shortcuts.ts     # 키보드 단축키
│   ├── use-export.ts                 # CSV 내보내기
│   └── use-media-query.ts            # 반응형 감지
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Browser용 Supabase client
│   │   ├── server.ts                 # Server용 Supabase client
│   │   └── middleware.ts             # Auth middleware helper
│   ├── demo/                         # 데모 모드 (Mock Supabase)
│   │   ├── constants.ts              # 데모 상수 (게스트 유저 등)
│   │   ├── demo-data.ts              # 샘플 데이터셋
│   │   ├── demo-store.ts             # 인메모리 데이터 저장소
│   │   ├── mock-auth.ts              # Mock 인증
│   │   ├── mock-query-builder.ts     # Mock Supabase 쿼리 빌더
│   │   ├── mock-realtime.ts          # Mock Realtime 채널
│   │   └── mock-supabase-client.ts   # Mock Supabase 클라이언트
│   ├── utils.ts                      # cn() 등 유틸리티
│   └── constants.ts                  # 매직넘버, 우선순위 색상 상수
│
├── stores/
│   ├── ui-store.ts                   # 사이드바 열림/닫힘, 모달 상태
│   ├── dashboard-store.ts            # 위젯 레이아웃 상태
│   ├── kanban-store.ts               # DnD 중간 상태
│   ├── kanban-filter-store.ts        # 칸반 필터 상태 (검색, 우선순위, 담당자 등)
│   ├── activity-filter-store.ts      # 활동 로그 필터
│   ├── calendar-store.ts             # 캘린더 뷰 상태
│   ├── gantt-store.ts                # 간트 차트 상태
│   ├── realtime-store.ts             # Realtime 연결 상태
│   ├── search-store.ts               # 글로벌 검색 상태
│   ├── shortcut-help-store.ts        # 단축키 도움말 다이얼로그
│   └── demo-mode-store.ts            # 데모 모드 상태
│
├── services/
│   ├── auth-service.ts               # 인증 관련 API
│   ├── project-service.ts            # 프로젝트 CRUD
│   ├── task-service.ts               # 태스크 CRUD
│   ├── column-service.ts             # 컬럼 CRUD
│   ├── dashboard-service.ts          # 레이아웃 저장/불러오기
│   ├── chart-service.ts              # 차트 데이터 집계
│   ├── comment-service.ts            # 댓글 CRUD
│   ├── attachment-service.ts         # 첨부파일 CRUD
│   ├── notification-service.ts       # 알림 관리
│   ├── activity-service.ts           # 활동 로그 조회
│   ├── subtask-service.ts            # 서브태스크 CRUD
│   ├── label-service.ts              # 라벨 CRUD
│   ├── dependency-service.ts         # 태스크 의존성 CRUD
│   ├── search-service.ts             # 글로벌 검색
│   ├── export-service.ts             # CSV 내보내기
│   ├── admin-service.ts              # 관리자 기능
│   ├── monitoring-service.ts         # 서비스 통계
│   ├── integration-service.ts        # 외부 연동 (Slack/GitHub)
│   ├── webhook-dispatcher.ts         # Webhook 중앙 디스패치
│   ├── user-message-service.ts       # 사용자 메시지
│   ├── favorite-service.ts           # 즐겨찾기
│   ├── recurrence-service.ts         # 반복 태스크
│   ├── workload-service.ts           # 워크로드 데이터 집계
│   ├── my-tasks-service.ts           # 내 태스크 조회
│   └── kanban-filter-service.ts      # 칸반 필터 프리셋 저장/조회
│
├── queries/
│   ├── use-projects.ts               # 프로젝트 목록/상세 쿼리
│   ├── use-tasks.ts                  # 태스크 목록 쿼리 + mutations
│   ├── use-columns.ts                # 컬럼 쿼리 + mutations
│   ├── use-dashboard-layout.ts       # 레이아웃 쿼리 + mutations
│   ├── use-chart-data.ts             # 차트 집계 데이터 쿼리
│   ├── use-comments.ts               # 댓글 쿼리 + mutations
│   ├── use-attachments.ts            # 첨부파일 쿼리 + mutations
│   ├── use-notifications.ts          # 알림 쿼리 + mutations
│   ├── use-activity-logs.ts          # 활동 로그 쿼리 (infinite)
│   ├── use-subtasks.ts               # 서브태스크 쿼리 + mutations
│   ├── use-labels.ts                 # 라벨 쿼리 + mutations
│   ├── use-dependencies.ts           # 의존성 쿼리 + mutations
│   ├── use-search.ts                 # 글로벌 검색 쿼리
│   ├── use-profile.ts                # 프로필 쿼리 + mutations
│   ├── use-admin.ts                  # 관리자 쿼리
│   ├── use-monitoring.ts             # 서비스 통계 쿼리
│   ├── use-integrations.ts           # 외부 연동 쿼리
│   ├── use-user-messages.ts          # 사용자 메시지 쿼리
│   ├── use-favorites.ts              # 즐겨찾기 쿼리 + mutations
│   ├── use-recurrences.ts            # 반복 태스크 쿼리 + mutations
│   ├── use-workload.ts               # 워크로드 쿼리
│   ├── use-my-tasks.ts               # 내 태스크 쿼리
│   └── use-kanban-filter-preset.ts   # 칸반 필터 프리셋 쿼리 + mutations
│
├── types/
│   ├── database.ts                   # Supabase 생성 타입 (auto-generated)
│   ├── kanban.ts                     # 칸반 관련 타입
│   ├── dashboard.ts                  # 대시보드/위젯 타입
│   ├── common.ts                     # 공통 유틸리티 타입
│   ├── activity.ts                   # 활동 로그 타입
│   ├── attachment.ts                 # 첨부파일 타입
│   ├── comment.ts                    # 댓글 타입
│   ├── dependency.ts                 # 의존성 타입
│   ├── favorite.ts                   # 즐겨찾기 타입
│   ├── integration.ts                # 외부 연동 타입
│   ├── label.ts                      # 라벨 타입
│   ├── monitoring.ts                 # 서비스 통계 타입
│   ├── notification.ts               # 알림 타입
│   ├── recurrence.ts                 # 반복 태스크 타입
│   ├── search.ts                     # 검색 결과 타입
│   ├── user-message.ts               # 사용자 메시지 타입
│   └── workload.ts                   # 워크로드 타입
│
└── middleware.ts                      # Next.js Middleware (Auth guard)
```

---

## Data Flow Patterns

### Pattern A: Server Component Initial Load

```
Request → Middleware (Auth Check)
       → Server Component
       → createServerClient()
       → Supabase Query (with RLS)
       → HTML Response (Streaming)
```

**사용 시점**: 페이지 초기 로드, SEO가 필요한 콘텐츠
**예시**: 프로젝트 목록 페이지, 프로젝트 상세 초기 데이터

### Pattern B: Client Mutation + Optimistic Update

```
User Action → Zustand (Optimistic UI Update)
           → TanStack Query Mutation
           → Supabase REST API
           → Success: Cache 업데이트 (queryClient.invalidateQueries)
           → Failure: Zustand 롤백 + Error Toast
```

**사용 시점**: 사용자 액션에 의한 데이터 변경
**예시**: 태스크 생성/수정/삭제, 컬럼 이동, 레이아웃 변경

### Pattern C: Realtime Sync (다른 유저 변경)

```
Supabase Realtime (WebSocket)
  → Channel 이벤트 수신 (INSERT/UPDATE/DELETE)
  → TanStack Query Cache 직접 업데이트 (queryClient.setQueryData)
  → React 리렌더링
```

**사용 시점**: 다른 사용자의 변경사항을 실시간 반영
**예시**: 다른 유저의 태스크 이동, 새 멤버 접속

---

## State Management Strategy

| State Type | Tool | 사용처 |
|------------|------|--------|
| Server State (async) | TanStack Query v5 | 프로젝트, 태스크, 멤버 등 DB 데이터 |
| Client UI State (sync) | Zustand | 사이드바, 모달, DnD 중간 상태 |
| Drag State | @hello-pangea/dnd + Zustand | 칸반 DnD 진행 중 상태 |
| Form State | React Hook Form + Zod | 태스크 생성/수정, 프로젝트 설정 폼 |
| URL State | Next.js searchParams | 필터, 정렬, 페이지네이션 |
| Auth State | Supabase Auth | 세션, 유저 정보 |
| Theme State | next-themes | 다크모드 설정 |

### 상태 분리 원칙
- **Server State는 TanStack Query가 관리**: `useQuery`/`useMutation`으로 캐싱, 리페칭, 에러 처리
- **Client State는 Zustand가 관리**: UI 토글, 임시 상태 등 서버와 무관한 상태
- **Context API 사용 금지** (상태관리 목적): Provider 패턴은 라이브러리 설정용으로만 사용
- **Props drilling 3단계까지 허용**: 초과 시 Zustand store 또는 Compound Component 패턴

---

## Database Schema

### profiles
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auth trigger: 회원가입 시 자동 생성
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### projects
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_projects_owner ON projects(owner_id);
```

### project_members
```sql
CREATE TYPE member_role AS ENUM ('owner', 'admin', 'member', 'viewer');

CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role member_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

CREATE INDEX idx_project_members_project ON project_members(project_id);
CREATE INDEX idx_project_members_user ON project_members(user_id);
```

### kanban_columns
```sql
CREATE TABLE kanban_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_kanban_columns_project ON kanban_columns(project_id);
CREATE INDEX idx_kanban_columns_position ON kanban_columns(project_id, position);
```

### tasks
```sql
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  column_id UUID NOT NULL REFERENCES kanban_columns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority task_priority NOT NULL DEFAULT 'medium',
  assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  position INTEGER NOT NULL,
  due_date DATE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_column ON tasks(column_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_position ON tasks(column_id, position);
```

### dashboard_layouts
```sql
CREATE TABLE dashboard_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  layout JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- layout JSONB 구조:
-- [{ "widget_id": "task-status", "x": 0, "y": 0, "w": 6, "h": 4 }, ...]
```

### Additional Tables (Phase 2~11)

```sql
-- 태스크 댓글
CREATE TABLE task_comments (id, task_id, user_id, content, created_at, updated_at);

-- 파일 첨부
CREATE TABLE task_attachments (id, task_id, user_id, file_name, file_url, file_size, file_type, created_at);

-- 라벨
CREATE TABLE labels (id, project_id, name, color, created_at);
CREATE TABLE task_labels (task_id, label_id, PRIMARY KEY(task_id, label_id));

-- 서브태스크
CREATE TABLE subtasks (id, task_id, title, is_completed, position, created_by, created_at, updated_at);

-- 태스크 의존성
CREATE TABLE task_dependencies (id, blocking_task_id, blocked_task_id, project_id, created_at);

-- 알림
CREATE TABLE notifications (id, user_id, project_id, type, title, body, entity_type, entity_id, actor_id, is_read, created_at);

-- 활동 로그
CREATE TABLE activity_logs (id, project_id, user_id, action, entity_type, entity_id, metadata, created_at);

-- 외부 연동
CREATE TABLE project_integrations (id, project_id, provider, config, enabled, created_at, updated_at);

-- 사용자 메시지
CREATE TABLE user_messages (id, user_id, content, is_read, created_at);

-- 마감일 알림 로그
CREATE TABLE due_date_notifications_log (id, task_id, notification_type, sent_at);

-- 즐겨찾기
CREATE TABLE task_favorites (id, task_id, user_id, created_at, UNIQUE(task_id, user_id));

-- 반복 태스크
CREATE TABLE task_recurrences (id, task_id, project_id, frequency, interval_value, next_run_at, last_run_at, is_active, created_by, created_at, updated_at);

-- 칸반 필터 프리셋
CREATE TABLE kanban_filter_presets (id, project_id, user_id, filters JSONB, created_at, updated_at, UNIQUE(project_id, user_id));
```

### updated_at 자동 갱신
```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 모든 테이블에 적용
CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON kanban_columns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON dashboard_layouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## Row Level Security (RLS) Policies

### profiles
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 본인 프로필 조회/수정
CREATE POLICY "프로필 조회: 인증된 사용자" ON profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "프로필 수정: 본인만" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);
```

### projects
```sql
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 프로젝트 멤버만 조회 가능
CREATE POLICY "프로젝트 조회: 멤버만" ON projects
  FOR SELECT TO authenticated
  USING (
    id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );

-- 프로젝트 생성: 인증된 사용자
CREATE POLICY "프로젝트 생성: 인증 사용자" ON projects
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- 프로젝트 수정/삭제: owner/admin만
CREATE POLICY "프로젝트 수정: owner/admin" ON projects
  FOR UPDATE TO authenticated
  USING (
    id IN (
      SELECT project_id FROM project_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "프로젝트 삭제: owner만" ON projects
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());
```

### project_members
```sql
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "멤버 조회: 같은 프로젝트 멤버" ON project_members
  FOR SELECT TO authenticated
  USING (
    project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );

CREATE POLICY "멤버 추가: owner/admin" ON project_members
  FOR INSERT TO authenticated
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM project_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "멤버 삭제: owner/admin 또는 본인 탈퇴" ON project_members
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid() OR
    project_id IN (
      SELECT project_id FROM project_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );
```

### tasks, kanban_columns
```sql
-- 동일 패턴: 프로젝트 멤버만 CRUD
ALTER TABLE kanban_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- kanban_columns
CREATE POLICY "컬럼 조회: 프로젝트 멤버" ON kanban_columns
  FOR SELECT TO authenticated
  USING (
    project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );

CREATE POLICY "컬럼 CUD: 프로젝트 멤버(viewer 제외)" ON kanban_columns
  FOR ALL TO authenticated
  USING (
    project_id IN (
      SELECT project_id FROM project_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
    )
  );

-- tasks
CREATE POLICY "태스크 조회: 프로젝트 멤버" ON tasks
  FOR SELECT TO authenticated
  USING (
    project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );

CREATE POLICY "태스크 CUD: 프로젝트 멤버(viewer 제외)" ON tasks
  FOR ALL TO authenticated
  USING (
    project_id IN (
      SELECT project_id FROM project_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
    )
  );
```

### dashboard_layouts
```sql
ALTER TABLE dashboard_layouts ENABLE ROW LEVEL SECURITY;

-- 본인 레이아웃만 접근
CREATE POLICY "레이아웃: 본인만" ON dashboard_layouts
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

---

## Realtime Architecture

### Channel 구조
```typescript
// 프로젝트별 단일 채널로 관리 (Supabase 무료 티어 연결 수 절약)
const channel = supabase.channel(`project:${projectId}`)

// DB 변경 감지
channel.on(
  'postgres_changes',
  { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${projectId}` },
  (payload) => handleTaskChange(payload)
)

// Presence (온라인 사용자)
channel.on('presence', { event: 'sync' }, () => {
  const state = channel.presenceState()
  updateOnlineUsers(state)
})

channel.subscribe(async (status) => {
  if (status === 'SUBSCRIBED') {
    await channel.track({ user_id, full_name, avatar_url })
  }
})
```

### 구독 생명주기
1. **Mount**: 프로젝트 페이지 진입 시 채널 구독
2. **Track**: 구독 완료 후 Presence 등록
3. **Listen**: postgres_changes + presence 이벤트 수신
4. **Untrack**: 페이지 이탈 시 Presence 해제
5. **Unsubscribe**: 컴포넌트 언마운트 시 채널 정리

### Conflict Resolution: Last-Write-Wins (LWW)
```
User A: updated_at = T1 → 서버 반영
User B: updated_at = T2 (T2 > T1) → 서버에서 T2가 최신이므로 B 반영
User A의 화면: Realtime으로 B의 변경 수신 → 캐시 업데이트
```
- `updated_at` 컬럼 기준으로 최신 데이터가 항상 유지됨
- 충돌 시 사용자에게 Toast로 알림: "다른 사용자가 이 태스크를 수정했습니다"

---

## Component Patterns

### Compound Component Pattern
```typescript
// 칸반 보드에서 활용
<KanbanBoard projectId={projectId}>
  <KanbanBoard.Column columnId={columnId}>
    <KanbanBoard.Task taskId={taskId} />
  </KanbanBoard.Column>
</KanbanBoard>
```

### Provider Pattern
```typescript
// Root Layout에서 Provider 중첩
<QueryProvider>
  <ThemeProvider>
    <SupabaseProvider>
      {children}
    </SupabaseProvider>
  </ThemeProvider>
</QueryProvider>
```

### Custom Hook Abstraction
```typescript
// 복잡한 로직은 훅으로 추출
const { tasks, moveTask, createTask } = useTasks(projectId)
const { onlineUsers } = usePresence(projectId)
const { subscribe, unsubscribe } = useRealtimeSubscription(projectId)
```

---

## Error Handling (4-Layer)

### Layer 1: Global Error Boundary
```
app/error.tsx → 예상치 못한 에러 캐치, 에러 리포팅, 복구 UI
```

### Layer 2: Route Error Boundary
```
app/(dashboard)/projects/[projectId]/error.tsx → 라우트별 에러 처리
```

### Layer 3: TanStack Query Error
```typescript
// 쿼리 레벨 에러 처리
const { error, isError } = useQuery({
  queryKey: ['tasks', projectId],
  queryFn: () => fetchTasks(projectId),
  retry: 2,
  retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
})
```

### Layer 4: Component Error
```typescript
// 컴포넌트 내 try-catch 또는 에러 상태 처리
// Toast 알림으로 사용자에게 피드백
```

### Error Response 표준화
```typescript
type ServiceResult<T> =
  | { data: T; error: null }
  | { data: null; error: { code: string; message: string } }
```

---

## Testing Strategy

### Layer 1: Unit Tests (Vitest)
- **대상**: hooks, utils, stores, services
- **목표**: 80%+ coverage
- **도구**: Vitest + @testing-library/react
- **Supabase 모킹**: MSW로 REST API 모킹

### Layer 2: Component Tests (Testing Library)
- **대상**: UI 컴포넌트 렌더링, 인터랙션
- **도구**: @testing-library/react + @testing-library/user-event
- **전략**: 사용자 관점 테스트 (구현 세부사항 테스트 금지)

### Layer 3: Integration Tests (MSW)
- **대상**: API 호출 포함 플로우
- **도구**: Vitest + MSW
- **전략**: 실제 API 호출을 MSW로 인터셉트, 전체 플로우 검증

### Layer 4: E2E Tests (Playwright)
- **대상**: 핵심 유저 시나리오
- **시나리오**:
  - 로그인 → 프로젝트 생성 → 칸반 보드 접근
  - 태스크 CRUD
  - DnD 태스크 이동
  - 다크모드 토글

### Supabase Realtime 테스트
```typescript
// 커스텀 프로바이더로 Realtime 모킹
const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  track: vi.fn(),
  presenceState: vi.fn().mockReturnValue({}),
}
```

---

## Performance Optimization

### Code Splitting
- `next/dynamic`으로 무거운 컴포넌트 lazy load
- 차트 위젯: dynamic import (Recharts 번들 분리)
- 칸반 DnD: dynamic import (@hello-pangea/dnd)

### Image Optimization
- `next/image`로 모든 이미지 자동 최적화
- OAuth 아바타: `remotePatterns` 설정

### Query Cache Strategy
```typescript
const queryConfig = {
  staleTime: 1000 * 60 * 5,       // 5분: Realtime이 있으므로 넉넉하게
  gcTime: 1000 * 60 * 30,         // 30분: 메모리 정리
  refetchOnWindowFocus: false,     // Realtime으로 대체
  refetchOnReconnect: true,        // 재연결 시 동기화
}
```

### Bundle Optimization
- `@next/bundle-analyzer`로 번들 분석
- Tree-shaking 확인 (named export 필수)
- 초기 JS < 200KB (gzipped) 목표

---

## Auth Flow

```
1. 사용자가 "Login with Google" 또는 "Login with 카카오" 클릭
   └→ supabase.auth.signInWithOAuth({ provider: 'google' | 'kakao' })

2. OAuth 페이지로 리다이렉트
   └→ 사용자 인증 동의

3. Callback URL로 리다이렉트
   └→ /callback/route.ts에서 code → session 교환
   └→ supabase.auth.exchangeCodeForSession(code)

4. profiles 테이블에 자동 INSERT (trigger)
   └→ 이름, 아바타 저장

5. 대시보드로 리다이렉트
   └→ /projects

6. 이후 요청마다 Middleware에서 세션 검증
   └→ middleware.ts → updateSession()
   └→ 세션 만료 시 /login으로 리다이렉트
```

---

## Accessibility Strategy

### 기본 전략
- **shadcn/ui (Radix Primitives)**: 키보드 내비게이션, 포커스 관리, ARIA 속성이 내장된 컴포넌트 사용
- **색상 대비**: Tailwind CSS 컬러 팔레트에서 WCAG 2.1 AA (4.5:1) 충족하는 조합만 사용
- **검증 도구**: eslint-plugin-jsx-a11y + axe-core (E2E 테스트에 통합)

### DnD 접근성
- `@hello-pangea/dnd`는 키보드 DnD를 네이티브 지원 (Space로 리프트, 화살표로 이동)
- 스크린 리더용 `aria-roledescription`, `aria-describedby` 자동 제공
- DnD 불가능한 환경을 위한 폴백 UI (이동 버튼) 제공

### Realtime 업데이트 접근성
- `aria-live="polite"` 영역으로 실시간 변경사항 알림
- 새 태스크/변경 시 시각적 알림 + 스크린 리더 호환 Toast

### 포커스 관리
- 다이얼로그 열림/닫힘 시 포커스 트랩 (Radix Dialog 내장)
- 태스크 삭제 후 이전 요소로 포커스 복귀
- 페이지 네비게이션 시 메인 콘텐츠에 포커스

---

## Environment Variables

```bash
# === Client-side (브라우저에 노출) ===
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# === Server-only (절대 브라우저에 노출 금지) ===
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # 관리자 작업에만 사용

# === 개발 환경 ===
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 규칙
- `NEXT_PUBLIC_` 접두사: 브라우저에서 접근 가능 (anon key처럼 공개 가능한 것만)
- 접두사 없음: 서버에서만 접근 (service role key 등)
- `.env.local`은 `.gitignore`에 포함
- `.env.example`에 키 이름만 기록 (값 제외)

---

## Browser Support

### Target
- Chrome 90+, Firefox 90+, Safari 15+, Edge 90+
- Mobile: iOS Safari 15+, Chrome Android 90+

### 전략
- Next.js의 기본 browserslist 설정 활용 (위 브라우저 커버)
- ES2020+ 문법 사용 (optional chaining, nullish coalescing 등)
- CSS: `@supports`로 Grid/Flexbox 가용성 확인 불필요 (모든 타겟 브라우저 지원)
- Polyfill 불필요: 타겟 브라우저가 모두 모던 브라우저

---

*Related: [PRD.md](./PRD.md) | [CLAUDE.md](../CLAUDE.md)*
