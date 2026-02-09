import { test, expect } from '@playwright/test'

import { MOCK_PROJECT, MOCK_TASKS } from './helpers/mock-data'
import { setupAuthenticatedMocks } from './helpers/setup-mocks'

const CALENDAR_URL = `/projects/${MOCK_PROJECT.id}/calendar`

test.describe('캘린더 뷰', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedMocks(page)
  })

  test('캘린더 페이지가 렌더링된다', async ({ page }) => {
    await page.goto(CALENDAR_URL)

    // 프로젝트 이름과 캘린더 헤더 확인
    await expect(page.getByText(MOCK_PROJECT.name)).toBeVisible()
  })

  test('월간 뷰에 요일 헤더가 표시된다', async ({ page }) => {
    await page.goto(CALENDAR_URL)

    // 요일 헤더 (일~토)
    const weekdays = ['일', '월', '화', '수', '목', '금', '토']
    for (const day of weekdays) {
      await expect(page.getByText(day, { exact: true }).first()).toBeVisible()
    }
  })

  test('오늘 버튼이 표시된다', async ({ page }) => {
    await page.goto(CALENDAR_URL)

    await expect(page.getByRole('button', { name: '오늘' })).toBeVisible()
  })

  test('주/월 뷰 토글이 표시된다', async ({ page }) => {
    await page.goto(CALENDAR_URL)

    // 주/월 토글 버튼
    await expect(page.getByRole('button', { name: '주' })).toBeVisible()
    await expect(page.getByRole('button', { name: '월' })).toBeVisible()
  })

  test('주간 뷰로 전환할 수 있다', async ({ page }) => {
    await page.goto(CALENDAR_URL)

    // 주 버튼 클릭
    await page.getByRole('button', { name: '주' }).click()

    // 주간 뷰에서는 7개 날짜 셀만 표시 (월간 42개 대신)
    // 요일 헤더는 여전히 존재
    await expect(page.getByText('일', { exact: true }).first()).toBeVisible()
  })

  test('오늘 날짜에 due_date가 있는 태스크가 표시된다', async ({ page }) => {
    await page.goto(CALENDAR_URL)

    // MOCK_TASKS 중 오늘 날짜인 태스크들
    const todayTasks = MOCK_TASKS.filter((t) => {
      if (!t.due_date) return false
      const today = new Date()
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      return t.due_date === todayStr
    })

    // 오늘 날짜에 해당하는 태스크 제목이 보여야 함
    for (const task of todayTasks) {
      await expect(page.getByText(task.title)).toBeVisible()
    }
  })

  test('이전/다음 달 네비게이션이 동작한다', async ({ page }) => {
    await page.goto(CALENDAR_URL)

    // 캘린더 헤더의 월 제목 (min-w-[140px] 클래스를 가진 h2)
    const monthTitle = page.locator('h2.min-w-\\[140px\\]')
    const headerText = await monthTitle.textContent()

    // 다음 달 버튼 클릭 (ChevronRight 아이콘을 가진 버튼)
    const nextButton = page.locator('button').filter({ has: page.locator('svg.lucide-chevron-right') })
    await nextButton.click()

    // 헤더 텍스트가 변경됨
    await expect(monthTitle).not.toHaveText(headerText ?? '')

    // 이전 달 버튼 클릭 (ChevronLeft 아이콘을 가진 버튼)
    const prevButton = page.locator('button').filter({ has: page.locator('svg.lucide-chevron-left') })
    await prevButton.click()

    // 원래 월로 복귀
    await expect(monthTitle).toHaveText(headerText ?? '')
  })
})
