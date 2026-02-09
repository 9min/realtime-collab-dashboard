import { test, expect } from '@playwright/test'

import { MOCK_PROJECT } from './helpers/mock-data'
import { setupAuthenticatedMocks } from './helpers/setup-mocks'

const PROJECT_BASE = `/projects/${MOCK_PROJECT.id}`

test.describe('키보드 단축키', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedMocks(page)
  })

  test('Shift+? 로 단축키 도움말 다이얼로그가 열린다', async ({ page }) => {
    await page.goto(`${PROJECT_BASE}/board`)

    // body에 포커스 확인 (input이 아닌 곳)
    await page.locator('body').click()

    // Shift+? 키 입력
    await page.keyboard.press('Shift+?')

    // 도움말 다이얼로그 확인
    await expect(page.getByText('키보드 단축키')).toBeVisible()
  })

  test('도움말 다이얼로그에 단축키 목록이 표시된다', async ({ page }) => {
    await page.goto(`${PROJECT_BASE}/board`)
    await page.locator('body').click()
    await page.keyboard.press('Shift+?')

    // 다이얼로그 컨텐츠 내에서 검색
    const dialog = page.getByRole('dialog')

    // 전역 단축키 섹션
    await expect(dialog.getByText('전역')).toBeVisible()

    // 프로젝트 내 단축키 섹션
    await expect(dialog.getByText('프로젝트 내')).toBeVisible()

    // 주요 단축키들이 표시됨
    await expect(dialog.getByText('검색 열기')).toBeVisible()
    await expect(dialog.getByText('대시보드 이동')).toBeVisible()
    await expect(dialog.getByText('칸반 보드 이동')).toBeVisible()
    await expect(dialog.getByText('캘린더 이동')).toBeVisible()
  })

  test('숫자 1 키로 대시보드로 이동한다', async ({ page }) => {
    await page.goto(`${PROJECT_BASE}/board`)
    await page.locator('body').click()

    await page.keyboard.press('1')

    // 대시보드 URL로 이동
    await expect(page).toHaveURL(new RegExp(`${PROJECT_BASE}$`))
  })

  test('숫자 2 키로 칸반 보드로 이동한다', async ({ page }) => {
    await page.goto(PROJECT_BASE)
    await page.locator('body').click()

    await page.keyboard.press('2')

    await expect(page).toHaveURL(new RegExp(`${PROJECT_BASE}/board`))
  })

  test('숫자 4 키로 캘린더로 이동한다', async ({ page }) => {
    await page.goto(`${PROJECT_BASE}/board`)
    await page.locator('body').click()

    await page.keyboard.press('4')

    await expect(page).toHaveURL(new RegExp(`${PROJECT_BASE}/calendar`))
  })

  test('input 포커스 시 단축키가 비활성화된다', async ({ page }) => {
    await page.goto(`${PROJECT_BASE}/board`)

    // 검색 input이 있다면 포커스
    const searchInput = page.locator('input[type="text"]').first()
    if (await searchInput.isVisible()) {
      await searchInput.focus()
      await page.keyboard.press('1')

      // 대시보드로 이동하지 않아야 함
      await expect(page).toHaveURL(new RegExp(`${PROJECT_BASE}/board`))
    }
  })
})
