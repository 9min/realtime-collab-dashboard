import { test, expect } from '@playwright/test'

import { setupUnauthenticatedMocks } from './helpers/setup-mocks'

test.describe('Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await setupUnauthenticatedMocks(page)
  })

  test('로그인 페이지가 렌더링된다', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveURL(/\/login/)
  })

  test('로그인 페이지에 앱 타이틀이 표시된다', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('실시간 협업 일정관리 도구')).toBeVisible()
  })
})
