/**
 * E2E 테스트용 Supabase API 모킹 헬퍼
 *
 * Playwright의 page.route()로 Supabase REST/Auth API를 가로채고,
 * addInitScript로 Supabase 세션을 주입하여 인증 상태를 시뮬레이션한다.
 */
import type { Page } from '@playwright/test'

import {
  MOCK_USER,
  MOCK_PROFILE,
  MOCK_PROJECT,
  MOCK_PROJECTS_WITH_COUNT,
  MOCK_MEMBERS,
  MOCK_COLUMNS,
  MOCK_TASKS,
  MOCK_LABELS,
  MOCK_TASK_LABELS,
  MOCK_ATTACHMENTS,
  MOCK_NOTIFICATIONS,
  MOCK_DASHBOARD_LAYOUT,
  MOCK_ACTIVITY_LOGS,
} from './mock-data'

// ── JWT 생성 유틸 ──

function base64url(obj: Record<string, unknown>): string {
  const json = JSON.stringify(obj)
  // Node.js Buffer 사용 (Playwright 테스트는 Node.js에서 실행)
  return Buffer.from(json).toString('base64url')
}

function createMockJwt(userId: string): string {
  const header = base64url({ alg: 'HS256', typ: 'JWT' })
  const payload = base64url({
    sub: userId,
    aud: 'authenticated',
    role: 'authenticated',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
    email: MOCK_USER.email,
  })
  const signature = 'mock-e2e-signature'
  return `${header}.${payload}.${signature}`
}

function createMockSession() {
  const accessToken = createMockJwt(MOCK_USER.id)
  return {
    access_token: accessToken,
    refresh_token: 'mock-refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: MOCK_USER,
  }
}

// ── 인증 모킹 ──

/**
 * Supabase 인증을 모킹하여 로그인된 상태를 시뮬레이션한다.
 *
 * 방법:
 * 1. addInitScript로 페이지 로드 전에 Supabase 세션 쿠키를 주입
 * 2. page.route()로 auth API 호출을 가로채서 mock 응답 반환
 */
export async function setupAuth(page: Page) {
  const session = createMockSession()

  // Supabase auth API 모킹
  await page.route('**/auth/v1/user', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_USER),
    })
  })

  await page.route('**/auth/v1/token?grant_type=refresh_token', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(session),
    })
  })

  // getSession()은 쿠키에서 세션을 읽음
  // addInitScript로 Supabase가 세션을 쿠키에서 찾을 수 있도록 주입
  const sessionStr = JSON.stringify(session)
  await page.addInitScript((serializedSession: string) => {
    // @supabase/ssr의 createBrowserClient는 document.cookie에서 세션을 읽음
    // 쿠키에 세션 JSON을 설정하여 getSession()이 인증 상태를 반환하도록 함
    document.cookie = `sb-mock-auth-token=${encodeURIComponent(serializedSession)}; path=/; max-age=3600`
  }, sessionStr)
}

// ── REST API 모킹 ──

/**
 * Supabase REST API를 모킹한다.
 * 테이블 이름과 쿼리 파라미터를 기반으로 mock 데이터를 반환.
 */
export async function setupApiMocks(page: Page) {
  await page.route('**/rest/v1/**', async (route) => {
    const url = new URL(route.request().url())
    const pathname = url.pathname
    const method = route.request().method()

    // 테이블 이름 추출: /rest/v1/{tableName}
    const tableMatch = pathname.match(/\/rest\/v1\/([^/?]+)/)
    const tableName = tableMatch?.[1] ?? ''

    // RPC 호출 처리
    if (tableName === 'rpc') {
      const rpcName = pathname.match(/\/rest\/v1\/rpc\/([^/?]+)/)?.[1]
      if (rpcName === 'create_project_with_defaults') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_PROJECT.id),
        })
        return
      }
    }

    // HEAD 요청 (count 쿼리) 처리
    if (method === 'HEAD') {
      if (tableName === 'notifications') {
        await route.fulfill({
          status: 200,
          headers: { 'content-range': '0-0/1' },
          body: '',
        })
        return
      }
      await route.fulfill({
        status: 200,
        headers: { 'content-range': '0-0/0' },
        body: '',
      })
      return
    }

    // GET 요청 처리
    if (method === 'GET') {
      const response = getTableData(tableName, url.searchParams)
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      })
      return
    }

    // POST/PATCH/DELETE → 기본 응답
    if (method === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify([{}]),
      })
      return
    }

    if (method === 'PATCH') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{}]),
      })
      return
    }

    if (method === 'DELETE') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
      return
    }

    await route.continue()
  })

  // Realtime WebSocket 연결 방지
  await page.route('**/realtime/v1/**', async (route) => {
    await route.abort()
  })

  // Storage API 모킹
  await page.route('**/storage/v1/**', async (route) => {
    const method = route.request().method()

    if (method === 'DELETE') {
      // Storage 파일 삭제 요청
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ publicUrl: 'https://placeholder.test/avatar.png' }),
    })
  })
}

function getTableData(tableName: string, params: URLSearchParams): unknown {
  const selectParam = params.get('select') ?? ''

  switch (tableName) {
    case 'profiles': {
      const idFilter = params.get('id')
      if (idFilter) return MOCK_PROFILE
      return [MOCK_PROFILE]
    }

    case 'projects': {
      const idFilter = params.get('id')
      if (idFilter) return MOCK_PROJECT
      // project-list에서는 member_count를 포함한 결과 반환
      return MOCK_PROJECTS_WITH_COUNT
    }

    case 'project_members':
      return MOCK_MEMBERS

    case 'kanban_columns':
      return MOCK_COLUMNS

    case 'tasks':
      return MOCK_TASKS

    case 'labels':
      return MOCK_LABELS

    case 'task_labels':
      return MOCK_TASK_LABELS

    case 'subtasks':
      return []

    case 'task_comments':
      return []

    case 'task_attachments':
      return MOCK_ATTACHMENTS

    case 'notifications':
      if (selectParam.includes('actor:profiles')) {
        return MOCK_NOTIFICATIONS
      }
      return MOCK_NOTIFICATIONS

    case 'dashboard_layouts':
      return MOCK_DASHBOARD_LAYOUT

    case 'activity_logs':
      return MOCK_ACTIVITY_LOGS

    default:
      return []
  }
}

// ── 통합 셋업 ──

/**
 * 인증 + API 모킹을 한번에 설정한다.
 * 대부분의 E2E 테스트에서 이 함수를 beforeEach에서 호출하면 된다.
 */
export async function setupAuthenticatedMocks(page: Page) {
  await setupAuth(page)
  await setupApiMocks(page)
}

/**
 * 비인증 상태에서의 API 모킹만 설정한다.
 * 로그인 페이지 테스트 등에서 사용.
 */
export async function setupUnauthenticatedMocks(page: Page) {
  // auth API는 null/에러 반환
  await page.route('**/auth/v1/user', async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'invalid_token', message: 'Token expired' }),
    })
  })

  await page.route('**/auth/v1/token**', async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'invalid_grant', message: 'No session' }),
    })
  })

  // Realtime 방지
  await page.route('**/realtime/v1/**', async (route) => {
    await route.abort()
  })
}
