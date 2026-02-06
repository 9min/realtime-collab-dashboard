# Realtime Collab Dashboard

소규모 팀(2-8명)을 위한 실시간 협업 대시보드. 칸반 보드, 커스텀 위젯, 실시간 동기화 지원.

## Tech Stack
- **Framework**: Next.js 15 (App Router) + TypeScript (strict)
- **Styling**: Tailwind CSS + shadcn/ui
- **Server State**: TanStack Query v5
- **Client State**: Zustand
- **Form**: React Hook Form + Zod
- **DnD**: @hello-pangea/dnd
- **Charts**: Recharts
- **Auth/DB**: Supabase (Auth, Database, Realtime, Storage)
- **Theme**: next-themes
- **Testing**: Vitest + Testing Library + Playwright + MSW

## Quick Commands

```bash
# 개발 서버
pnpm dev

# 빌드
pnpm build

# 린트
pnpm lint

# 타입 체크
pnpm type-check

# 테스트
pnpm test              # 단위 테스트
pnpm test:watch        # 워치 모드
pnpm test:coverage     # 커버리지 포함
pnpm test:e2e          # E2E (Playwright)

# Supabase
pnpm supabase:gen-types  # 타입 생성 (database.ts)
pnpm supabase:migration  # 마이그레이션 생성
```

## Documents
- **PRD**: [docs/PRD.md](./docs/PRD.md) - 제품 요구사항
- **Architecture**: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) - 기술 설계

---

## Architecture Rules

### Server/Client Component 경계
- **Server Component (기본)**: 데이터 페칭, 레이아웃, 정적 콘텐츠
- **Client Component ('use client')**: 인터랙션, 상태, 브라우저 API, 이벤트 핸들러
- SC에서 CC로 데이터 전달: props (직렬화 가능한 값만)
- CC에서 SC 호출 불가: Server Actions 사용

### 상태관리 규칙
| State | Tool | 비고 |
|-------|------|------|
| Server State (async) | TanStack Query | DB 데이터 전부 |
| Client UI State (sync) | Zustand | 사이드바, 모달, DnD |
| Form State | React Hook Form + Zod | 폼 전용 |
| URL State | searchParams | 필터, 정렬 |
| Auth State | Supabase Auth | 세션 전용 |

- **Context API는 상태관리에 사용 금지** — Provider 패턴(라이브러리 설정)만 허용
- Props drilling 3단계까지 허용, 초과 시 Zustand store 또는 Compound Component

---

## Coding Conventions

### 파일 명명
- **파일명**: `kebab-case.ts`, `kebab-case.tsx`
- **컴포넌트**: `PascalCase` (함수명)
- **훅**: `camelCase` (use- prefix), 파일명은 `use-kebab-case.ts`
- **상수**: `UPPER_SNAKE_CASE`
- **타입/인터페이스**: `PascalCase`

### Import 순서
```typescript
// 1. React/Next.js
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// 2. 외부 라이브러리
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'

// 3. lib (내부 유틸)
import { cn } from '@/lib/utils'
import { createBrowserClient } from '@/lib/supabase/client'

// 4. components
import { Button } from '@/components/ui/button'

// 5. queries (TanStack Query hooks)
import { useTasks } from '@/queries/use-tasks'

// 6. hooks (generic hooks)
import { useAuth } from '@/hooks/use-auth'

// 7. types
import type { Task } from '@/types/kanban'

// 8. relative (같은 디렉토리)
import { TaskCard } from './task-card'
```

### 컴포넌트 구조
```typescript
export function ComponentName({ prop1, prop2 }: ComponentNameProps) {
  // 1. hooks
  const router = useRouter()
  const { data } = useQuery(...)

  // 2. derived state (계산된 값)
  const filteredItems = useMemo(...)

  // 3. handlers
  const handleClick = useCallback(...)

  // 4. early returns (에러, 로딩, 빈 상태)
  if (isLoading) return <Skeleton />
  if (error) return <ErrorMessage error={error} />
  if (!data) return null

  // 5. render
  return (...)
}
```

### TypeScript 규칙
- `strict: true` 필수
- `any` 사용 금지 → `unknown` 사용
- 컴포넌트 Props는 `interface`로 정의 (확장성)
- 유틸리티 타입은 `type`으로 정의
- Supabase 타입은 자동 생성된 `database.ts`에서 추출

---

## Supabase Rules

### Client 생성
- **Browser (Client Component)**: `@/lib/supabase/client.ts` → `createBrowserClient()`
- **Server (Server Component, Route Handler)**: `@/lib/supabase/server.ts` → `createServerClient()`
- **Middleware**: `@/lib/supabase/middleware.ts` → `updateSession()`
- 직접 `createClient()` 호출 금지 — 반드시 래퍼 함수 사용

### 타입 생성
```bash
# Supabase CLI로 타입 자동 생성
pnpm supabase:gen-types
# → src/types/database.ts 에 출력
```

### RLS 신뢰
- 클라이언트에서 별도 권한 체크 불필요 — RLS가 DB 레벨에서 처리
- 단, UI에서 역할별 버튼 노출 제어는 별도 구현 (UX 목적)

---

## Testing Rules

### 필수 테스트 대상
- 새로 작성하는 모든 custom hook → 단위 테스트
- 새로 작성하는 모든 util 함수 → 단위 테스트
- 새로 작성하는 모든 Zustand store → 단위 테스트
- 서비스 레이어 함수 → MSW 통합 테스트

### 테스트 작성 원칙
- 사용자 관점에서 테스트 (구현 세부사항 X)
- `data-testid` 최소화 — 접근성 쿼리 우선 (`getByRole`, `getByLabelText`)
- 비동기 테스트는 `waitFor` 사용
- Supabase REST → MSW로 모킹, Realtime → 커스텀 mock channel

---

## Forbidden Patterns

```typescript
// ❌ fetch() 직접 사용 → Supabase client 사용
fetch('/api/tasks')

// ❌ useEffect로 데이터 fetch → TanStack Query 사용
useEffect(() => { fetchData() }, [])

// ❌ 인라인 스타일 → Tailwind CSS 사용
<div style={{ color: 'red' }}>

// ❌ default export → named export 사용 (tree-shaking)
// ⚠️ 예외: Next.js App Router의 page.tsx, layout.tsx, route.ts는 default export 필수
export default function MyComponent()

// ❌ enum → const object + as const 사용
enum Priority { Low, Medium, High }

// ❌ any 타입
const data: any = ...

// ❌ console.log 남기기 (디버깅 후 반드시 제거)
console.log('debug:', data)

// ❌ 매직넘버 → constants.ts에 상수화
if (items.length > 10)

// ❌ 중첩 삼항연산자
const x = a ? b ? c : d : e

// ❌ Context API로 상태관리
const MyContext = createContext(...)

// ❌ Props drilling 4단계 이상
<A><B><C><D prop={value}></D></C></B></A>

// ❌ 컴포넌트 내 Supabase client 직접 생성
const supabase = createClient(url, key)
```

### 허용 패턴
```typescript
// ✅ named export
export function Page() { ... }

// ✅ const object
const PRIORITY = { LOW: 'low', MEDIUM: 'medium', HIGH: 'high' } as const

// ✅ Supabase client 래퍼
import { createBrowserClient } from '@/lib/supabase/client'
```

---

## Environment Variables

```bash
# Client-side (NEXT_PUBLIC_ = 브라우저 노출 가능)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=

# Server-only (절대 NEXT_PUBLIC_ 붙이지 않음)
SUPABASE_SERVICE_ROLE_KEY=
```

- `.env.local`은 `.gitignore`에 포함 (커밋 금지)
- `.env.example`에 키 이름만 기록

---

## Directory Purpose

| 디렉토리 | 용도 | 네이밍 |
|-----------|------|--------|
| `hooks/` | 범용 커스텀 훅 (auth, realtime, media query) | `use-kebab-case.ts` |
| `queries/` | TanStack Query 래퍼 (서버 데이터 페칭/뮤테이션) | `use-kebab-case.ts` |
| `services/` | Supabase 직접 호출 레이어 (순수 함수) | `kebab-case-service.ts` |
| `stores/` | Zustand 스토어 (클라이언트 UI 상태) | `kebab-case-store.ts` |
| `types/` | 공유 타입 정의 | `kebab-case.ts` |

---

## Context Management (토큰 절약)

### 규칙
- **커밋 직후**: 반드시 `/compact` 실행을 제안할 것 (커밋 메시지가 요약 역할)
- **버그 수정 완료 후**: `/compact` 제안 (디버깅 시행착오는 보존 불필요)
- **피처 2-3개 완료 또는 주제 전환 시**: `/clear` 제안
- 새 세션 시작 시 이 CLAUDE.md가 컨텍스트를 복원하므로 `/clear` 부담 없음

### AI 동작
- `git commit` 성공 후 응답 말미에 `> 💡 커밋 완료. /compact 추천` 메시지 포함
- 긴 디버깅(3회 이상 시행착오) 해결 후에도 동일하게 제안
- 피처 전환 감지 시 `/clear` 제안

---

## Commit Strategy

### 커밋 시점
- **피처 단위로 커밋**: PRD 기준 하나의 피처(F1~F8) 구현이 완료되면 커밋
- **빌드 가능한 상태에서만 커밋**: `type-check` + `lint` 통과 필수
- 초기 세팅, 문서 변경 등 피처 외 작업도 완료 시 커밋

### 커밋 전 체크리스트
```bash
pnpm type-check && pnpm lint  # 통과 후 커밋
```

### 커밋 메시지 형식

```
<type>: <subject>

[optional body]
```

### Type
- `feat`: 새 기능
- `fix`: 버그 수정
- `refactor`: 리팩토링 (동작 변경 없음)
- `test`: 테스트 추가/수정
- `docs`: 문서 수정
- `chore`: 설정, 의존성 등
- `style`: 포맷팅 (코드 동작 변경 없음)
- `perf`: 성능 개선

### 예시
```
feat: 칸반 보드 드래그앤드롭 구현
fix: DnD 중 태스크 카드 깜빡임 해결
refactor: useRealtimeSubscription 훅 분리
test: task-service 단위 테스트 추가
docs: 아키텍처 다이어그램 업데이트
chore: Vitest 커버리지 임계값 설정
```


<claude-mem-context>
# Recent Activity

<!-- This section is auto-generated by claude-mem. Edit content outside the tags. -->

*No recent activity*
</claude-mem-context>