# Product Requirements Document (PRD)

## Overview

### 프로젝트 소개
**Realtime Collab Dashboard**는 소규모 팀(2-8명)을 위한 실시간 협업 대시보드다. 칸반 보드, 커스텀 위젯, 실시간 동기화를 통해 팀의 프로젝트 진행 상황을 한눈에 파악하고 관리할 수 있다.

### 문제 정의
- 소규모 팀은 Jira/Notion 같은 도구가 과하고, 간단한 Trello는 실시간성이 부족하다
- 대시보드와 칸반이 분리된 도구에서는 컨텍스트 스위칭 비용이 발생한다
- 실시간 협업 시 다른 사용자의 변경사항이 즉시 반영되지 않아 충돌이 발생한다

### 타겟 유저
- **Primary**: 소규모 개발팀 (2-8명), 스타트업 팀
- **Secondary**: 사이드 프로젝트 팀, 프리랜서 그룹
- **Persona**: 빠른 셋업, 실시간 반영, 직관적 UI를 원하는 팀 리더/멤버

---

## Success Metrics

| Metric | Target | 측정 방법 |
|--------|--------|-----------|
| Lighthouse Performance | 90+ | Lighthouse CI |
| First Contentful Paint (FCP) | < 1.5s | Web Vitals |
| Time to Interactive (TTI) | < 3s | Web Vitals |
| Realtime Latency | < 500ms | Supabase Realtime 측정 |
| Test Coverage | 80%+ | Vitest coverage report |
| Accessibility | WCAG 2.1 AA | axe-core 자동 검사 |

---

## User Stories

### US-1: Authentication
```
Given 인증되지 않은 사용자가 앱에 접근할 때
When 로그인 페이지가 표시되면
Then GitHub 또는 Google OAuth로 로그인할 수 있다

Given 로그인된 사용자가 브라우저를 닫았다가 다시 열 때
When 세션이 유효하면
Then 자동으로 로그인 상태가 유지된다

Given 인증되지 않은 사용자가 보호된 경로에 접근할 때
When 세션이 없으면
Then 로그인 페이지로 리다이렉트된다
```

### US-2: Project Management
```
Given 로그인된 사용자가 대시보드에 있을 때
When "새 프로젝트" 버튼을 클릭하면
Then 프로젝트 이름/설명을 입력하고 프로젝트를 생성할 수 있다

Given 프로젝트 소유자가 설정 페이지에 있을 때
When 이메일로 멤버를 초대하면
Then 해당 유저가 프로젝트에 참여할 수 있다
```

### US-3: Dashboard Layout
```
Given 사용자가 대시보드에 있을 때
When 위젯을 드래그앤드롭으로 이동하면
Then 레이아웃이 실시간으로 변경되고 자동 저장된다

Given 사용자가 위젯 추가 버튼을 클릭할 때
When 위젯 종류를 선택하면
Then 대시보드에 새 위젯이 추가된다
```

### US-4: Kanban Board
```
Given 사용자가 칸반 보드에 있을 때
When 태스크 카드를 다른 컬럼으로 드래그하면
Then 태스크 상태가 변경되고 다른 사용자에게 실시간 반영된다

Given 사용자가 새 태스크를 생성할 때
When 제목, 설명, 우선순위, 담당자, 마감일을 입력하면
Then 해당 컬럼에 태스크가 추가된다
```

### US-5: Realtime Sync
```
Given 두 명의 사용자가 같은 프로젝트를 보고 있을 때
When 한 사용자가 태스크를 수정하면
Then 다른 사용자의 화면에 500ms 이내로 반영된다

Given 사용자가 태스크를 수정할 때
When 네트워크가 불안정하면
Then Optimistic Update로 즉시 UI가 반영되고, 실패 시 롤백된다
```

### US-6: Online Presence
```
Given 사용자가 프로젝트에 접속해 있을 때
When 다른 멤버들도 접속 중이면
Then 온라인 상태 아바타가 표시된다
```

### US-7: Chart Widgets
```
Given 사용자가 대시보드에 차트 위젯을 추가할 때
When 데이터가 로드되면
Then 태스크 상태 분포(파이), 주간 진행률(라인), 번다운(라인) 차트가 표시된다
```

### US-8: Dark Mode
```
Given 사용자가 앱을 처음 사용할 때
When 시스템이 다크 모드이면
Then 자동으로 다크 모드가 적용된다

Given 사용자가 테마 토글을 클릭할 때
When 현재 라이트 모드이면
Then 다크 모드로 전환되고 설정이 저장된다
```

---

## Feature Specifications (MVP)

### F1. Authentication
- **OAuth Provider**: GitHub, Google
- **세션 관리**: Supabase Auth (JWT, httpOnly cookie)
- **Protected Routes**: Middleware에서 세션 검증
- **프로필**: OAuth에서 가져온 이름, 아바타 자동 세팅
- **Acceptance Criteria**:
  - [ ] GitHub OAuth 로그인/로그아웃
  - [ ] Google OAuth 로그인/로그아웃
  - [ ] 세션 만료 시 자동 리다이렉트
  - [ ] 인증되지 않은 경로 접근 차단

### F2. Project Management
- **프로젝트 CRUD**: 생성, 조회, 수정, 삭제 (소유자만)
- **멤버 관리**: 초대 (owner/admin), 역할 (owner, admin, member, viewer)
- **프로젝트 목록**: 참여 중인 프로젝트 리스트
- **Acceptance Criteria**:
  - [ ] 프로젝트 생성 (이름, 설명)
  - [ ] 멤버 초대 (이메일 기반)
  - [ ] 역할별 권한 분리
  - [ ] 프로젝트 삭제 (owner만)

### F3. Dashboard Layout
- **Grid System**: CSS Grid 기반 반응형 레이아웃
- **위젯**: 칸반 보드, 차트(상태 분포, 주간 진행률, 번다운), 멤버 목록
- **Drag & Drop**: 위젯 위치/크기 조절
- **Persistence**: 사용자별 레이아웃 DB 저장
- **Acceptance Criteria**:
  - [ ] 위젯 추가/제거
  - [ ] 드래그앤드롭으로 위치 변경
  - [ ] 레이아웃 자동 저장/불러오기
  - [ ] 반응형 (모바일에서 단일 컬럼)

### F4. Kanban Board
- **컬럼 관리**: 기본 컬럼 (To Do, In Progress, Done) + 커스텀 추가/삭제
- **태스크 CRUD**: 생성, 조회, 수정, 삭제
- **태스크 속성**: 제목, 설명, 우선순위 (low/medium/high/urgent), 담당자, 마감일
- **Drag & Drop**: 컬럼 간 태스크 이동, 컬럼 내 순서 변경
- **Acceptance Criteria**:
  - [ ] 컬럼 CRUD
  - [ ] 태스크 CRUD
  - [ ] DnD로 태스크 이동 (컬럼 간 + 컬럼 내)
  - [ ] 우선순위/담당자/마감일 설정

### F5. Realtime Sync
- **기술**: Supabase Realtime (PostgreSQL Changes)
- **범위**: 태스크 변경, 컬럼 변경, 멤버 상태
- **Optimistic Update**: 로컬 먼저 반영 → 서버 확인 → 실패 시 롤백
- **Conflict Resolution**: Last-Write-Wins (LWW) with `updated_at` timestamp
- **Acceptance Criteria**:
  - [ ] 다른 사용자의 변경이 500ms 이내 반영
  - [ ] Optimistic Update 동작
  - [ ] 네트워크 에러 시 롤백
  - [ ] 동시 수정 시 LWW로 충돌 해결

### F6. Online Presence
- **기술**: Supabase Realtime Presence
- **표시**: 아바타 + 온라인 상태 indicator
- **범위**: 프로젝트별 접속자 목록
- **Acceptance Criteria**:
  - [ ] 접속 중인 사용자 아바타 표시
  - [ ] 접속/퇴장 시 실시간 업데이트
  - [ ] 프로젝트별 분리

### F7. Chart Widgets
- **라이브러리**: Recharts (React 친화적, 번들 사이즈 합리적)
- **차트 종류**:
  - 태스크 상태 분포 (Pie Chart)
  - 주간 진행률 (Line Chart)
  - 번다운 차트 (Area Chart)
- **데이터 소스**: 태스크 테이블 집계 쿼리
- **Acceptance Criteria**:
  - [ ] 3종 차트 렌더링
  - [ ] 데이터 실시간 반영
  - [ ] 반응형 사이즈

### F8. Dark Mode
- **전략**: CSS 변수 + `next-themes`
- **옵션**: System / Light / Dark
- **Persistence**: localStorage
- **Acceptance Criteria**:
  - [ ] 시스템 설정 감지 및 자동 적용
  - [ ] 수동 토글 (3단계)
  - [ ] 페이지 새로고침 시 유지
  - [ ] 깜빡임(FOUC) 없음

---

## Future Features (Post-MVP)
- **댓글/멘션**: 태스크 내 댓글, @멘션으로 알림
- **파일 첨부**: Supabase Storage 활용, 이미지 프리뷰
- **알림**: In-app 알림 (멘션, 태스크 할당, 마감일 임박)
- **Markdown 에디터**: 태스크 설명에 리치 텍스트
- **간트 차트**: 타임라인 기반 프로젝트 관리
- **Activity Log**: 프로젝트 활동 기록
- **필터/검색**: 태스크 필터링 (상태, 담당자, 우선순위)

---

## Non-Functional Requirements

### Performance
- Lighthouse Performance Score 90+
- FCP < 1.5s, TTI < 3s
- Bundle size: Initial JS < 200KB (gzipped)
- 이미지: next/image로 자동 최적화

### Accessibility
- WCAG 2.1 AA 준수
- 키보드 내비게이션 지원
- 스크린 리더 호환 (aria 속성)
- 색상 대비 4.5:1 이상

### Security
- Supabase RLS로 DB 레벨 접근 제어
- XSS 방지: React 기본 이스케이핑 + DOMPurify (사용자 입력 HTML)
- CSRF: Supabase Auth의 PKCE flow
- 환경변수: 민감 정보 서버 사이드에서만 접근

### Browser Support
- Chrome 90+, Firefox 90+, Safari 15+, Edge 90+
- Mobile: iOS Safari 15+, Chrome Android 90+

---

## Technical Constraints

### Supabase Free Tier
- Database: 500MB storage
- Auth: 50,000 MAU
- Realtime: 200 concurrent connections
- Storage: 1GB
- Edge Functions: 500K invocations/month

### Vercel Free Tier
- Bandwidth: 100GB/month
- Serverless Function Execution: 100GB-hours/month
- Build: 6000 minutes/month

### 제약에 따른 설계 결정
- DB 쿼리 최적화: 불필요한 데이터 전송 최소화
- Realtime 구독: 프로젝트별 단일 채널로 관리
- 이미지: 외부 URL (OAuth 아바타) 활용, 직접 업로드 최소화
- SSR/ISR: 정적 콘텐츠는 빌드 타임 생성

---

*Related: [ARCHITECTURE.md](./ARCHITECTURE.md) | [CLAUDE.md](../CLAUDE.md)*
