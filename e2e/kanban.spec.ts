import { test, expect } from '@playwright/test'

import { MOCK_PROJECT, MOCK_COLUMNS, MOCK_TASKS } from './helpers/mock-data'
import { setupAuthenticatedMocks } from './helpers/setup-mocks'

const BOARD_URL = `/projects/${MOCK_PROJECT.id}/board`

test.describe('칸반 보드', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedMocks(page)
  })

  test('칸반 보드 페이지가 렌더링된다', async ({ page }) => {
    await page.goto(BOARD_URL)

    // 프로젝트 이름 확인
    await expect(page.getByText(MOCK_PROJECT.name)).toBeVisible()
  })

  test('칸반 컬럼들이 표시된다', async ({ page }) => {
    await page.goto(BOARD_URL)

    // 3개 컬럼 타이틀 확인
    for (const column of MOCK_COLUMNS) {
      await expect(page.getByText(column.title)).toBeVisible()
    }
  })

  test('태스크 카드들이 표시된다', async ({ page }) => {
    await page.goto(BOARD_URL)

    // 각 태스크의 제목이 보이는지 확인
    for (const task of MOCK_TASKS) {
      await expect(page.getByText(task.title)).toBeVisible()
    }
  })

  test('서브 네비게이션에서 칸반 보드 탭이 활성화되어 있다', async ({ page }) => {
    await page.goto(BOARD_URL)

    // "칸반 보드" 버튼이 활성 상태 (bg-primary 클래스)
    const kanbanTab = page.getByRole('button', { name: '칸반 보드' })
    await expect(kanbanTab).toBeVisible()
  })

  test('서브 네비게이션으로 다른 뷰로 이동할 수 있다', async ({ page }) => {
    await page.goto(BOARD_URL)

    // 대시보드 탭 클릭
    await page.getByRole('button', { name: '대시보드' }).click()
    await expect(page).toHaveURL(new RegExp(`/projects/${MOCK_PROJECT.id}$`))
  })
})
