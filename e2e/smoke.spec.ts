import { test, expect } from '@playwright/test'

test.describe('Smoke Tests', () => {
  test('로그인 페이지가 렌더링된다', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveURL(/\/login/)
  })

  test('미인증 시 로그인 페이지로 리다이렉트된다', async ({ page }) => {
    await page.goto('/projects')
    // 미인증 상태이므로 로그인 페이지로 리다이렉트됨
    await expect(page).toHaveURL(/\/login/)
  })
})
