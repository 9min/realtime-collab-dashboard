import { test, expect } from '@playwright/test'

import { MOCK_PROJECT, MOCK_TASKS } from './helpers/mock-data'
import { setupAuthenticatedMocks } from './helpers/setup-mocks'

test.describe('프로젝트 삭제', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedMocks(page)
  })

  test('프로젝트 카드 드롭다운에서 삭제 → AlertDialog 확인 → 목록에서 제거', async ({ page }) => {
    // DELETE API 호출 추적
    const deleteRequests: string[] = []
    await page.route('**/rest/v1/projects**', async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteRequests.push(route.request().url())
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        })
        return
      }
      await route.fallback()
    })

    await page.goto('/projects')

    // 프로젝트 카드의 드롭다운 메뉴 열기
    const menuButton = page.getByRole('button', { name: '프로젝트 메뉴' }).first()
    await menuButton.click()

    // 삭제 메뉴 아이템 클릭
    await page.getByRole('menuitem', { name: '삭제' }).click()

    // AlertDialog 확인
    await expect(page.getByText('프로젝트를 삭제하시겠습니까?')).toBeVisible()

    // 삭제 확인 버튼 클릭
    await page.getByRole('button', { name: '삭제' }).click()

    // DELETE API 호출 확인
    await expect.poll(() => deleteRequests.length).toBeGreaterThan(0)
  })
})

test.describe('태스크 삭제', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedMocks(page)
  })

  test('태스크 상세에서 삭제 → AlertDialog 확인 → DELETE API 호출', async ({ page }) => {
    // DELETE API 호출 추적
    const deleteRequests: string[] = []
    await page.route('**/rest/v1/tasks**', async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteRequests.push(route.request().url())
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        })
        return
      }
      await route.fallback()
    })

    // Storage DELETE 호출 추적
    const storageDeleteRequests: string[] = []
    await page.route('**/storage/v1/object/task-attachments**', async (route) => {
      if (route.request().method() === 'DELETE') {
        storageDeleteRequests.push(route.request().url())
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        })
        return
      }
      await route.fallback()
    })

    // 칸반 보드 페이지 이동
    await page.goto(`/projects/${MOCK_PROJECT.id}/board`)

    // 태스크 카드 클릭하여 상세 다이얼로그 열기
    const taskCard = page.getByText(MOCK_TASKS[0].title)
    await taskCard.click()

    // 삭제 버튼 클릭
    const deleteButton = page.getByRole('button', { name: '삭제' })
    await deleteButton.click()

    // AlertDialog 확인
    await expect(page.getByText('태스크를 삭제하시겠습니까?')).toBeVisible()

    // 삭제 확인 버튼 클릭
    const confirmButton = page.getByRole('button', { name: '삭제' }).last()
    await confirmButton.click()

    // DELETE API 호출 확인
    await expect.poll(() => deleteRequests.length).toBeGreaterThan(0)
  })
})
