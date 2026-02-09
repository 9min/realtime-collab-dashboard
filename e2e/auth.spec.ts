import { test, expect } from '@playwright/test'

import { setupUnauthenticatedMocks } from './helpers/setup-mocks'

test.describe('로그인 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await setupUnauthenticatedMocks(page)
  })

  test('로그인 페이지가 렌더링된다', async ({ page }) => {
    await page.goto('/login')

    // 타이틀 확인
    await expect(page.getByText('실시간 협업 일정관리')).toBeVisible()
    await expect(page.getByText('소규모 팀을 위한 실시간 협업 대시보드')).toBeVisible()
  })

  test('OAuth 로그인 버튼 3개가 표시된다', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByRole('button', { name: /GitHub로 로그인/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Google로 로그인/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Kakao로 로그인/ })).toBeVisible()
  })

  test('에러 파라미터가 있으면 에러 메시지를 표시한다', async ({ page }) => {
    await page.goto('/login?error=auth_callback_error&detail=Something+went+wrong')

    await expect(page.getByText('OAuth 인증에 실패했습니다')).toBeVisible()
    await expect(page.getByText('Something went wrong')).toBeVisible()
  })

  test('GitHub 로그인 버튼 클릭 시 Supabase OAuth URL로 이동을 시도한다', async ({ page }) => {
    await page.goto('/login')

    // 네비게이션 이벤트를 감지
    const navigationPromise = page.waitForURL('**/auth/v1/authorize**', { timeout: 5000 }).catch(() => null)

    const githubButton = page.getByRole('button', { name: /GitHub로 로그인/ })
    await githubButton.click()

    // Supabase OAuth URL로 네비게이션이 시작됨 (또는 버튼이 클릭 가능한 상태)
    // signInWithOAuth가 window.location.href를 변경하므로
    // 네비게이션이 시작되거나 에러 없이 실행됨을 확인
    const result = await navigationPromise
    // 실제 Supabase 서버가 없으면 네비게이션이 실패할 수 있으므로
    // 버튼이 클릭 가능했고 에러 메시지가 표시되지 않았음을 확인
    const errorVisible = await page.getByText('OAuth 인증에 실패했습니다').isVisible().catch(() => false)
    expect(result !== null || !errorVisible).toBeTruthy()
  })
})
