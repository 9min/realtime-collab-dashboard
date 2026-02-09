import { test, expect } from '@playwright/test'

import { MOCK_PROJECTS_WITH_COUNT } from './helpers/mock-data'
import { setupAuthenticatedMocks } from './helpers/setup-mocks'

test.describe('프로젝트 목록', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedMocks(page)
  })

  test('프로젝트 목록 페이지가 렌더링된다', async ({ page }) => {
    await page.goto('/projects')

    // 헤더 확인
    await expect(page.getByRole('heading', { name: '프로젝트' })).toBeVisible()
  })

  test('프로젝트 카드들이 표시된다', async ({ page }) => {
    await page.goto('/projects')

    // mock 프로젝트 카드 확인
    for (const project of MOCK_PROJECTS_WITH_COUNT) {
      await expect(page.getByText(project.name)).toBeVisible()
    }
  })

  test('프로젝트 참여 개수가 표시된다', async ({ page }) => {
    await page.goto('/projects')

    // "참여 중인 프로젝트 N개" 텍스트 확인
    await expect(
      page.getByText(`참여 중인 프로젝트`)
    ).toBeVisible()
    await expect(
      page.getByText(`${MOCK_PROJECTS_WITH_COUNT.length}개`)
    ).toBeVisible()
  })

  test('프로젝트 클릭 시 프로젝트 페이지로 이동한다', async ({ page }) => {
    await page.goto('/projects')

    // 첫 번째 프로젝트 클릭
    await page.getByText(MOCK_PROJECTS_WITH_COUNT[0].name).click()

    // URL이 프로젝트 상세 페이지로 변경됨
    await expect(page).toHaveURL(new RegExp(`/projects/${MOCK_PROJECTS_WITH_COUNT[0].id}`))
  })
})
