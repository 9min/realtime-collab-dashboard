# Product Requirements Document (PRD)

## Overview

### 프로젝트 소개
**실시간 협업 일정관리 도구**는 소규모 팀(2-8명)을 위한 실시간 협업 대시보드다. 칸반 보드, 간트 차트, 캘린더, 커스텀 위젯, 실시간 동기화를 통해 팀의 프로젝트 진행 상황을 한눈에 파악하고 관리할 수 있다.

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
| Total Tests | 700+ | Vitest (단위 703개) + Playwright (E2E 28개) |
| Accessibility | WCAG 2.1 AA | axe-core 자동 검사 |
| API Rate Limit | 60 req/min | Sliding Window 측정 |
| Cache Hit Rate | 70%+ | Redis hit/miss 카운터 |

---

## User Stories

### US-1: Authentication
```
Given 인증되지 않은 사용자가 앱에 접근할 때
When 로그인 페이지가 표시되면
Then GitHub, Google 또는 카카오 OAuth로 로그인할 수 있다

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

### US-9: Comments & Collaboration
```
Given 사용자가 태스크 상세를 보고 있을 때
When 댓글을 작성하면
Then 다른 팀원에게 실시간으로 댓글이 표시된다

Given 사용자가 댓글에서 @멘션을 사용할 때
When 멘션된 팀원이 접속 중이면
Then 해당 팀원에게 알림이 전송된다
```

### US-10: Timeline Views
```
Given 사용자가 프로젝트의 간트 차트를 볼 때
When 태스크에 마감일이 설정되어 있으면
Then 타임라인 바 형태로 일정이 시각화된다

Given 사용자가 캘린더 뷰를 볼 때
When 월별 캘린더가 표시되면
Then 마감일 기준으로 태스크가 달력에 배치된다
```

### US-11: Global Search
```
Given 사용자가 Cmd+K / Ctrl+K를 누를 때
When 검색 다이얼로그가 열리면
Then 프로젝트, 태스크, 댓글을 통합 검색할 수 있다
```

### US-12: External Integrations
```
Given 프로젝트 소유자가 연동 설정 페이지에 있을 때
When Slack Webhook URL을 설정하면
Then 태스크 이벤트 발생 시 Slack 채널에 알림이 전송된다

Given 프로젝트 소유자가 GitHub 연동을 설정할 때
When owner/repo/PAT를 입력하면
Then 태스크 생성 시 GitHub Issue가 자동으로 생성된다
```

### US-13: System Monitoring
```
Given 관리자가 모니터링 대시보드에 접속할 때
When 시스템 상태를 확인하면
Then 캐시 히트율, 에러 트렌드, 활성 사용자 수를 확인할 수 있다
```

### US-14: Connection Resilience
```
Given 사용자가 앱을 사용 중일 때
When Realtime 연결이 끊어지면
Then 자동으로 지수 백오프 재연결을 시도하고 상태가 UI에 표시된다

Given 재연결이 최대 횟수를 초과할 때
When 연결 복구가 불가능하면
Then 폴링 폴백으로 전환되어 데이터 동기화가 유지된다
```

---

## Feature Specifications

### Phase 1: Core (MVP) — ✅ 구현 완료

#### F1. Authentication ✅
- **OAuth Provider**: GitHub, Google, 카카오
- **세션 관리**: Supabase Auth (JWT, httpOnly cookie)
- **Protected Routes**: Middleware에서 세션 검증
- **프로필**: OAuth에서 가져온 이름, 아바타 자동 세팅
- **Acceptance Criteria**:
  - [x] GitHub OAuth 로그인/로그아웃
  - [x] Google OAuth 로그인/로그아웃
  - [x] 카카오 OAuth 로그인/로그아웃
  - [x] 세션 만료 시 자동 리다이렉트
  - [x] 인증되지 않은 경로 접근 차단

#### F2. Project Management ✅
- **프로젝트 CRUD**: 생성, 조회, 수정, 삭제 (소유자만)
- **멤버 관리**: 초대 (owner/admin), 역할 (owner, admin, member, viewer)
- **프로젝트 목록**: 참여 중인 프로젝트 리스트
- **프로젝트 생성 시 기본 컬럼 자동 생성** (RPC: `create_project_with_defaults`)
- **CASCADE 삭제**: 프로젝트 삭제 시 연관 데이터 자동 정리
- **Acceptance Criteria**:
  - [x] 프로젝트 생성 (이름, 설명)
  - [x] 멤버 초대 (이메일 기반)
  - [x] 역할별 권한 분리
  - [x] 프로젝트 삭제 (owner만)
  - [x] 멤버 역할 변경 (owner/admin)
  - [x] 멤버 제거

#### F3. Dashboard Layout ✅
- **Grid System**: CSS Grid 기반 반응형 레이아웃 (12 컬럼)
- **위젯**: 태스크 상태 차트, 주간 진행률, 번다운 차트, 멤버 목록
- **Drag & Drop**: 위젯 위치/크기 조절 (2D DnD)
- **Persistence**: 사용자별 레이아웃 DB 저장 (`dashboard_layouts` 테이블)
- **Acceptance Criteria**:
  - [x] 위젯 추가/제거
  - [x] 드래그앤드롭으로 위치 변경
  - [x] 레이아웃 자동 저장/불러오기
  - [x] 반응형 (모바일에서 단일 컬럼)
  - [x] 기본 레이아웃 제공

#### F4. Kanban Board ✅
- **컬럼 관리**: 기본 컬럼 (To Do, In Progress, Done) + 커스텀 추가/삭제/이름 변경
- **태스크 CRUD**: 생성, 조회, 수정, 삭제
- **태스크 속성**: 제목, 설명 (Markdown), 우선순위 (low/medium/high/urgent), 담당자, 마감일
- **Drag & Drop**: 컬럼 간 태스크 이동, 컬럼 내 순서 변경, 컬럼 순서 변경
- **태스크 카드 전체 영역 드래그 가능**
- **삭제 시 AlertDialog 컨펌 통일**
- **Acceptance Criteria**:
  - [x] 컬럼 CRUD + 이름 변경
  - [x] 태스크 CRUD
  - [x] DnD로 태스크 이동 (컬럼 간 + 컬럼 내)
  - [x] 컬럼 순서 DnD
  - [x] 우선순위/담당자/마감일 설정
  - [x] Markdown 설명 지원

#### F5. Realtime Sync ✅
- **기술**: Supabase Realtime (PostgreSQL Changes) + 폴링 폴백
- **범위**: 태스크, 컬럼, 멤버, 댓글, 첨부파일, 알림, 라벨, 서브태스크, 의존성, 활동 로그
- **Optimistic Update**: 로컬 먼저 반영 → 서버 확인 → 실패 시 롤백
- **Conflict Resolution**: Last-Write-Wins (LWW) with `updated_at` timestamp
- **REPLICA IDENTITY FULL**: 모든 Realtime 테이블에 적용
- **Acceptance Criteria**:
  - [x] 다른 사용자의 변경이 500ms 이내 반영
  - [x] Optimistic Update 동작
  - [x] 네트워크 에러 시 롤백
  - [x] 동시 수정 시 LWW로 충돌 해결
  - [x] 폴링 폴백 (Realtime 연결 실패 시)

#### F6. Online Presence ✅
- **기술**: Supabase Realtime Presence
- **표시**: 아바타 + 온라인 상태 indicator
- **범위**: 프로젝트별 접속자 목록
- **Acceptance Criteria**:
  - [x] 접속 중인 사용자 아바타 표시
  - [x] 접속/퇴장 시 실시간 업데이트
  - [x] 프로젝트별 분리

#### F7. Chart Widgets ✅
- **라이브러리**: Recharts
- **차트 종류**:
  - 태스크 상태 분포 (Pie Chart)
  - 주간 진행률 (Line Chart)
  - 번다운 차트 (Area Chart)
- **데이터 소스**: 태스크 테이블 집계 쿼리
- **다크 모드 호환**
- **Acceptance Criteria**:
  - [x] 3종 차트 렌더링
  - [x] 데이터 실시간 반영
  - [x] 반응형 사이즈
  - [x] 다크 모드 호환

#### F8. Dark Mode ✅
- **전략**: CSS 변수 + `next-themes`
- **옵션**: System / Light / Dark
- **Persistence**: localStorage
- **Modern Minimal 테마 적용**
- **Acceptance Criteria**:
  - [x] 시스템 설정 감지 및 자동 적용
  - [x] 수동 토글 (3단계)
  - [x] 페이지 새로고침 시 유지
  - [x] 깜빡임(FOUC) 없음

---

### Phase 2: Collaboration — ✅ 구현 완료

#### F9. Comments & Mentions ✅
- **댓글**: 태스크 내 댓글 스레드, CRUD
- **Markdown**: 댓글 내 Markdown 지원
- **@멘션**: 자동완성으로 팀원 멘션
- **알림 연동**: 멘션 시 알림 트리거
- **Acceptance Criteria**:
  - [x] 댓글 작성/수정/삭제
  - [x] Markdown 렌더링
  - [x] @멘션 자동완성
  - [x] 멘션 알림 트리거

#### F10. File Attachments ✅
- **스토리지**: Supabase Storage
- **지원 형식**: 이미지, PDF, Word, Excel, 텍스트
- **제한**: 최대 10MB/파일
- **Acceptance Criteria**:
  - [x] 파일 업로드
  - [x] 이미지 프리뷰
  - [x] 파일 다운로드/삭제

#### F11. Notifications ✅
- **알림 유형**: task_assigned, commented, mentioned, due_soon
- **UI**: 헤더 벨 아이콘 + 미읽은 수 뱃지
- **실시간 전달**: Realtime으로 즉시 알림
- **Acceptance Criteria**:
  - [x] 알림 벨 + 미읽은 수 표시
  - [x] 알림 목록 표시
  - [x] 개별/전체 읽음 처리
  - [x] 클릭 시 해당 엔티티로 이동
  - [x] 실시간 알림 전달

#### F12. Activity Log ✅
- **자동 기록**: 트리거 기반 활동 추적 (태스크, 컬럼, 멤버, 댓글, 서브태스크)
- **타임라인 피드**: 프로젝트별 활동 피드
- **필터**: 액션 타입, 엔티티 타입, 사용자별 필터
- **통계 카드**: 활동 유형별 집계
- **Acceptance Criteria**:
  - [x] 자동 활동 기록
  - [x] 타임라인 피드 표시
  - [x] 필터링 (액션/엔티티/사용자)
  - [x] 실시간 업데이트

---

### Phase 3: Advanced Kanban — ✅ 구현 완료

#### F13. Subtasks ✅
- **체크박스 기반** 서브태스크 목록
- **CRUD**: 서브태스크 추가/수정/삭제/완료 토글
- **순서 관리**: position 필드로 정렬
- **활동 로그 연동**: 서브태스크 변경 시 기록
- **Acceptance Criteria**:
  - [x] 서브태스크 CRUD
  - [x] 완료 체크박스 토글
  - [x] 순서 관리

#### F14. Labels ✅
- **프로젝트 레벨 라벨 정의**: 10가지 프리셋 컬러
- **태스크-라벨 다대다 연결**
- **라벨 매니저**: admin/owner만 관리 가능
- **필터 연동**: 라벨 기준 태스크 필터링
- **Acceptance Criteria**:
  - [x] 라벨 CRUD
  - [x] 태스크에 라벨 할당/제거
  - [x] 라벨 필터링
  - [x] 라벨 뱃지 표시

#### F15. Task Dependencies ✅
- **의존성 관계**: blocking / blocked-by
- **순환 방지**: DB CHECK constraint
- **간트 차트 연동**: 의존성 화살표 시각화
- **태스크 상세 연동**: Dependency 섹션
- **Acceptance Criteria**:
  - [x] 의존성 추가/제거
  - [x] 순환 의존성 방지
  - [x] 간트 차트에 화살표 표시
  - [x] 태스크 상세에서 의존성 관리

#### F16. Task Filtering & Search ✅
- **필터 바**: 텍스트 검색, 우선순위, 담당자, 마감일, 라벨
- **스윔레인**: None / By Assignee / By Priority
- **WIP 제한**: 컬럼별 진행 중 태스크 수 제한
- **일괄 작업**: 태스크 일괄 삭제
- **내보내기**: CSV 형식 태스크 내보내기
- **Acceptance Criteria**:
  - [x] 다중 필터 조합
  - [x] 스윔레인 뷰 전환
  - [x] WIP 제한 설정
  - [x] 일괄 삭제
  - [x] CSV 내보내기

---

### Phase 4: Views & Navigation — ✅ 구현 완료

#### F17. Gantt Chart ✅
- **타임라인 바**: 태스크별 시작일~마감일 시각화
- **의존성 화살표**: 태스크 간 의존 관계 화살표 표시
- **날짜 헤더**: 주/일 단위 그리드
- **Dynamic Import**: 코드 스플리팅으로 초기 번들 최적화
- **Acceptance Criteria**:
  - [x] 타임라인 바 렌더링
  - [x] 의존성 화살표
  - [x] 날짜 네비게이션
  - [x] 태스크 상세 연결

#### F18. Calendar View ✅
- **월별 캘린더 그리드**: 마감일 기준 태스크 배치
- **월 네비게이션**: 이전/다음 달 이동
- **태스크 카운트**: 일별 태스크 수 표시
- **Acceptance Criteria**:
  - [x] 월별 캘린더 렌더링
  - [x] 마감일 기준 태스크 표시
  - [x] 월 네비게이션
  - [x] 태스크 상세 연결

#### F19. Global Search ✅
- **Cmd+K / Ctrl+K**: 글로벌 검색 커맨드
- **통합 검색**: 프로젝트, 태스크, 댓글 전체 검색
- **실시간 결과**: 타입별 그룹 표시
- **디바운싱**: 2자 이상 입력 시 검색
- **Acceptance Criteria**:
  - [x] 키보드 단축키 동작
  - [x] 통합 검색 결과
  - [x] 클릭 시 해당 위치로 이동

---

### Phase 5: Management & Settings — ✅ 구현 완료

#### F20. Profile Management ✅
- **닉네임 변경**: 프로필 편집 다이얼로그
- **아바타 업로드/삭제**: Supabase Storage (`avatars` 버킷)
- **계정 탈퇴**: 서버 API (`/api/auth/delete-account`)
- **Acceptance Criteria**:
  - [x] 닉네임 수정
  - [x] 아바타 업로드/삭제
  - [x] 계정 탈퇴

#### F21. Admin Panel ✅
- **관리자 플래그**: `is_admin` 프로필 필드
- **사용자 관리**: 전체 사용자 목록 + 검색
- **관리자 권한 토글**: admin 상태 부여/해제
- **프로젝트 멤버십 조회**: 모든 프로젝트의 멤버 현황
- **통계**: 총 사용자 수, 프로젝트 수, 멤버십 수
- **Acceptance Criteria**:
  - [x] 관리자 전용 페이지
  - [x] 사용자 목록 + 검색
  - [x] 관리자 권한 토글
  - [x] 프로젝트 멤버십 조회

#### F22. Keyboard Shortcuts ✅
- **글로벌 검색**: Cmd+K / Ctrl+K
- **단축키 도움말 다이얼로그**
- **입력 필드 포커스 감지**: 입력 중 단축키 비활성화
- **Acceptance Criteria**:
  - [x] 단축키 동작
  - [x] 도움말 다이얼로그

---

### Phase 6: Performance & Quality — ✅ 구현 완료

#### F23. Performance Optimization ✅
- **Dynamic Import**: 간트 차트 등 대형 컴포넌트 코드 스플리팅
- **리스트 가상화**: 대량 데이터 렌더링 최적화
- **이미지 최적화**: next/image 활용
- **React.memo**: 불필요한 리렌더링 방지
- **Acceptance Criteria**:
  - [x] 코드 스플리팅 적용
  - [x] 가상화 적용
  - [x] 메모이제이션 적용

#### F24. Testing ✅
- **단위 테스트**: Vitest + Testing Library (hooks, stores, services, queries, components)
- **E2E 테스트**: Playwright (28개 브라우저 테스트)
- **MSW**: API 모킹
- **Acceptance Criteria**:
  - [x] 단위 테스트 작성
  - [x] E2E 테스트 작성
  - [x] MSW 모킹 설정

---

### Phase 7: Stability & Integrations — ✅ 구현 완료

#### F25. API Rate Limiting ✅
- **알고리즘**: Sliding Window 기반 인메모리 요청 추적
- **기본 제한**: 60요청/분, 민감 API는 10요청/분
- **미들웨어**: `withRateLimit(handler, options)` HOF 패턴
- **클라이언트 IP**: X-Forwarded-For / X-Real-IP 헤더 추출
- **자동 정리**: 만료 엔트리 5분마다 정리
- **응답 헤더**: X-RateLimit-Limit, X-RateLimit-Remaining, Retry-After (429)
- **Acceptance Criteria**:
  - [x] Sliding Window 레이트 리미터 구현
  - [x] API 라우트에 미들웨어 적용
  - [x] 429 응답 + Retry-After 헤더
  - [x] 민감 API 별도 제한 설정

#### F26. Redis Caching (Upstash) ✅
- **패턴**: Cache-Aside (캐시 우회 가능)
- **클라이언트**: Upstash Redis REST API
- **Graceful Degradation**: Redis 미설정 시 캐시 없이 직접 페칭
- **TTL**: 키별 개별 설정 (멤버 5분, 통계 10분, 모니터링 1분)
- **추적**: 캐시 hit/miss 카운터 (Redis 내부 저장)
- **중앙화**: `cache-keys.ts`에서 캐시 키 관리
- **Acceptance Criteria**:
  - [x] Upstash Redis 연동
  - [x] Cache-Aside 패턴 (`cacheGet(key, fetcher, ttl)`)
  - [x] Graceful degradation (Redis 없이도 동작)
  - [x] 캐시 hit/miss 추적

#### F27. Monitoring Dashboard ✅
- **경로**: `/admin/monitoring` (관리자 전용)
- **차트 위젯**:
  - 에러 트렌드 차트 (7일간, Sentry 연동 준비)
  - 캐시 히트율 차트
  - 활성 사용자 차트 (30분 윈도우)
  - 시스템 상태 카드 (Realtime/API/Uptime)
- **API**: `/api/admin/monitoring` 엔드포인트
- **서비스**: `monitoring-service.ts`
- **Acceptance Criteria**:
  - [x] 관리자 전용 모니터링 페이지
  - [x] 캐시 메트릭 시각화
  - [x] 에러 트렌드 차트
  - [x] 활성 사용자 수 표시
  - [x] 시스템 상태 표시

#### F28. External Integrations (Slack & GitHub) ✅
- **Slack 연동**:
  - Webhook 기반 알림 전송
  - 이벤트 필터: task_created, task_updated, task_deleted
  - Block 기반 리치 메시지 포맷
  - 테스트 엔드포인트로 Webhook 검증
- **GitHub 연동**:
  - 태스크 이벤트 시 GitHub Issue 자동 생성
  - owner/repo/PAT 설정
  - 자동 라벨링 (`collaboration` 태그)
- **Webhook Dispatcher**: 중앙 디스패치 (`/api/webhooks/dispatch`)
  - Secret 인증 또는 사용자 세션 인증
  - `Promise.allSettled`로 병렬 전송
- **설정 UI**: 탭 인터페이스 (Slack/GitHub)
  - CRUD: upsert, delete, enable/disable 토글
  - Owner/Admin 권한 게이팅
- **DB**: `project_integrations` 테이블 (마이그레이션 026)
- **Acceptance Criteria**:
  - [x] Slack Webhook 알림 전송
  - [x] GitHub Issue 자동 생성
  - [x] 이벤트 필터 설정
  - [x] 연동 활성화/비활성화 토글
  - [x] 설정 UI (Slack/GitHub 탭)

---

### Phase 8: Resilience & Observability — ✅ 구현 완료

#### F29. Realtime Connection Resilience ✅
- **연결 상태 모니터링**: Zustand 스토어 (`realtime-store.ts`)
- **상태**: CONNECTING → CONNECTED → DISCONNECTED → RECONNECTING
- **지수 백오프 재연결**:
  - 최대 8회 재시도
  - 지연: 1s → 2s → 4s → 8s → 16s → 32s → 60s (상한)
  - ±25% 지터로 Thundering Herd 방지
  - 최대 재시도 초과 시 폴링 폴백
- **상태 표시 UI**: Wifi 아이콘 + 색상 indicator + 툴팁
  - Connected: 녹색 / Connecting: 파란색 / Reconnecting: 노란색 / Disconnected: 빨간색
  - 접근성: `role="status"`, `aria-label`
- **Acceptance Criteria**:
  - [x] 연결 상태 실시간 감지
  - [x] 지수 백오프 재연결
  - [x] 지터 적용
  - [x] 연결 상태 UI 표시
  - [x] 최대 재시도 초과 시 폴링 폴백

#### F30. Cursor-Based Pagination ✅
- **대상**: Tasks, Activity Logs
- **커서**: `created_at` 타임스탬프 기반
- **TanStack Query**: `useInfiniteQuery` 활용
- **응답 형식**: `{ data: T[], nextCursor: string | null }`
- **기본 페이지 크기**: `PAGINATION.DEFAULT_PAGE_SIZE` (20건)
- **무한 스크롤**: 스크롤 기반 자동 페이지 로드
- **Acceptance Criteria**:
  - [x] 커서 기반 페이지네이션 서비스 레이어
  - [x] `useInfiniteTasks` / `useInfiniteActivityLogs` 훅
  - [x] 무한 스크롤 UI

#### F31. CI/CD Pipeline ✅
- **플랫폼**: GitHub Actions
- **워크플로우** (`.github/workflows/ci.yml`):
  1. Lint + Type Check
  2. Unit Tests (커버리지 아티팩트 업로드)
  3. Build (1, 2 완료 후)
- **동시성**: 같은 브랜치에서 진행 중인 작업 자동 취소
- **환경**: Node 20 + pnpm 10, 의존성 캐싱, frozen lockfile
- **Acceptance Criteria**:
  - [x] PR/Push 시 자동 실행
  - [x] Lint + Type Check 통과 검증
  - [x] 테스트 실행 + 커버리지 리포트
  - [x] 빌드 성공 검증

#### F32. Sentry Error Tracking ✅
- **멀티 환경 초기화**: Client / Server / Edge
- **Client**: 프로덕션 전용, 10% 트레이싱, 세션 리플레이 (1% 일반 / 100% 에러)
- **Server/Edge**: 5% 트레이싱
- **에러 바운더리**: `error.tsx` + `global-error.tsx`
- **Instrumentation**: `src/instrumentation.ts` 서버 초기화
- **민감 데이터 필터링**: 쿠키 제거
- **Acceptance Criteria**:
  - [x] Client/Server/Edge Sentry 초기화
  - [x] 에러 바운더리 연동
  - [x] 세션 리플레이 설정
  - [x] 민감 데이터 필터링

#### F33. UI/UX Accessibility & Consistency ✅
- **접근성 개선**:
  - 아이콘 버튼 터치 타겟 확대 (h-7/h-8/h-9)
  - 클릭 요소 `cursor-pointer` 적용
  - `focus-visible:ring-2` 키보드 네비게이션
  - 라벨 뱃지 `role=checkbox`, `aria-checked`, 키보드 핸들러
  - 아이콘 버튼 `aria-label` 추가
- **다크 모드 색상 대비 개선**: 간트, 스윔레인, 칸반
- **Dialog/Card 배경색**: `bg-background` → `bg-card` (대비 향상)
- **우선순위 색상 중앙화**: 7개 파일 → `src/lib/constants.ts` 통합
  - `PRIORITY_LABELS`, `PRIORITY_DOT_COLORS`, `PRIORITY_BADGE_STYLES`
- **반응형 개선**: 활동 로그 통계 카드 그리드, 활동 피드 높이
- **Acceptance Criteria**:
  - [x] WCAG 2.1 AA 터치 타겟 준수
  - [x] 키보드 네비게이션 개선
  - [x] 다크 모드 색상 대비 개선
  - [x] 우선순위 색상/디자인 일관성 통일

---

## Future Features (Next)
- **템플릿**: 프로젝트 템플릿으로 빠른 프로젝트 생성
- **반복 태스크**: 주기적 태스크 자동 생성
- **시간 추적**: 태스크별 소요 시간 기록
- **워크플로우 자동화**: 상태 변경 시 자동 액션 (예: Done 이동 시 알림)
- **모바일 앱**: React Native 또는 PWA
- **외부 연동 확장**: Google Calendar 연동
- **보고서**: 주간/월간 자동 보고서 생성

---

## Non-Functional Requirements

### Performance
- Lighthouse Performance Score 90+
- FCP < 1.5s, TTI < 3s
- Bundle size: Initial JS < 200KB (gzipped)
- Dynamic Import로 대형 컴포넌트 코드 스플리팅
- 리스트 가상화로 대량 데이터 최적화
- 이미지: next/image로 자동 최적화
- Redis 캐싱 (Upstash): 서버 데이터 캐시로 응답 속도 향상
- 커서 기반 페이지네이션: 대량 데이터 무한 스크롤 최적화

### Reliability
- Realtime 연결 지수 백오프 재연결 (최대 8회, 60초 상한)
- Thundering Herd 방지 지터 (±25%)
- Redis 미설정 시 Graceful Degradation
- Sentry 에러 트래킹 (Client/Server/Edge)
- CI/CD: GitHub Actions 자동 린트/타입체크/테스트/빌드

### Accessibility
- WCAG 2.1 AA 준수
- 키보드 내비게이션 지원
- 스크린 리더 호환 (aria 속성)
- 색상 대비 4.5:1 이상

### Security
- Supabase RLS로 DB 레벨 접근 제어
- 역할 기반 권한 시스템 (owner, admin, member, viewer)
- XSS 방지: React 기본 이스케이핑 + DOMPurify (사용자 입력 HTML)
- CSRF: Supabase Auth의 PKCE flow
- 환경변수: 민감 정보 서버 사이드에서만 접근
- 삭제 작업 시 AlertDialog 컨펌 필수
- API Rate Limiting: Sliding Window 기반 요청 제한
- Sentry: 에러 트래킹 + 민감 데이터 필터링

### Browser Support
- Chrome 90+, Firefox 90+, Safari 15+, Edge 90+
- Mobile: iOS Safari 15+, Chrome Android 90+

---

## Technical Constraints

### Supabase Free Tier
- Database: 500MB storage
- Auth: 50,000 MAU
- Realtime: 200 concurrent connections
- Storage: 1GB (아바타 + 파일 첨부)
- Edge Functions: 500K invocations/month

### Vercel Free Tier
- Bandwidth: 100GB/month
- Serverless Function Execution: 100GB-hours/month
- Build: 6000 minutes/month

### Upstash Redis (Optional)
- REST API 기반 Redis 클라이언트
- 미설정 시 캐시 없이 동작 (Graceful Degradation)

### Sentry
- Client/Server/Edge 에러 트래킹
- 프로덕션 환경에서만 활성화

### 제약에 따른 설계 결정
- DB 쿼리 최적화: 불필요한 데이터 전송 최소화
- Realtime 구독: 프로젝트별 단일 채널로 관리 + 폴링 폴백
- 이미지: 외부 URL (OAuth 아바타) 활용, 직접 업로드는 Supabase Storage
- SSR/ISR: 정적 콘텐츠는 빌드 타임 생성
- 코드 스플리팅: Dynamic Import로 초기 번들 최소화
- 첨부파일: 10MB 제한으로 Storage 사용량 관리

---

## Database Schema

### Tables (15개)
| 테이블 | 용도 |
|--------|------|
| `profiles` | 사용자 프로필 (extends auth.users) |
| `projects` | 프로젝트 |
| `project_members` | 프로젝트 멤버십 (N:N) |
| `kanban_columns` | 칸반 컬럼 |
| `tasks` | 태스크 |
| `task_comments` | 태스크 댓글 |
| `task_attachments` | 파일 첨부 |
| `labels` | 프로젝트 라벨 |
| `task_labels` | 태스크-라벨 연결 (N:N) |
| `subtasks` | 서브태스크 |
| `task_dependencies` | 태스크 의존성 |
| `notifications` | 알림 |
| `activity_logs` | 활동 로그 |
| `dashboard_layouts` | 대시보드 레이아웃 |
| `project_integrations` | 외부 연동 설정 (Slack, GitHub) |

### RLS Policies
- 모든 테이블에 RLS 활성화
- 프로젝트 스코프 기반 정책
- 헬퍼 함수: `is_project_member()`, `has_project_role()`, `is_admin()`

### Migrations (26개)
001~026 순차 마이그레이션으로 스키마 관리

---

*Related: [ARCHITECTURE.md](./ARCHITECTURE.md) | [CLAUDE.md](../CLAUDE.md)*
