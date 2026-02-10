import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { CalendarHeader } from './calendar-header'

// store mock을 테스트별로 제어
const mockSetViewMode = vi.fn()
const mockGoToToday = vi.fn()
const mockGoToPrev = vi.fn()
const mockGoToNext = vi.fn()

const mockCalendarState = {
  currentDate: new Date(2026, 1, 15), // 2026-02-15
  viewMode: 'month' as 'month' | 'week',
  setViewMode: mockSetViewMode,
  goToToday: mockGoToToday,
  goToPrev: mockGoToPrev,
  goToNext: mockGoToNext,
}

vi.mock('@/stores/calendar-store', () => ({
  useCalendarStore: () => mockCalendarState,
}))

describe('CalendarHeader', () => {
  beforeEach(() => {
    mockCalendarState.currentDate = new Date(2026, 1, 15)
    mockCalendarState.viewMode = 'month'
    mockSetViewMode.mockClear()
    mockGoToToday.mockClear()
    mockGoToPrev.mockClear()
    mockGoToNext.mockClear()
  })

  it('현재 월/년을 렌더링한다', () => {
    render(<CalendarHeader />)

    // toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })
    // => "2026년 2월" (locale dependent)
    const title = new Date(2026, 1, 15).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
    })
    expect(screen.getByText(title)).toBeInTheDocument()
  })

  it('다른 월/년도 올바르게 표시한다', () => {
    mockCalendarState.currentDate = new Date(2025, 11, 1) // December 2025

    render(<CalendarHeader />)

    const title = new Date(2025, 11, 1).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
    })
    expect(screen.getByText(title)).toBeInTheDocument()
  })

  it('이전/다음 네비게이션 버튼이 존재한다', () => {
    render(<CalendarHeader />)

    const buttons = screen.getAllByRole('button')
    // 이전, 다음, 오늘, 주, 월 = 최소 5개 버튼
    expect(buttons.length).toBeGreaterThanOrEqual(5)
  })

  it('오늘 버튼이 존재한다', () => {
    render(<CalendarHeader />)

    expect(screen.getByText('오늘')).toBeInTheDocument()
  })

  it('이전 버튼 클릭 시 goToPrev가 호출된다', async () => {
    const user = userEvent.setup()

    render(<CalendarHeader />)

    // 첫 번째 icon 버튼이 "이전"
    const buttons = screen.getAllByRole('button')
    await user.click(buttons[0])

    expect(mockGoToPrev).toHaveBeenCalledTimes(1)
  })

  it('다음 버튼 클릭 시 goToNext가 호출된다', async () => {
    const user = userEvent.setup()

    render(<CalendarHeader />)

    // 두 번째 icon 버튼이 "다음" (제목 다음)
    const buttons = screen.getAllByRole('button')
    await user.click(buttons[1])

    expect(mockGoToNext).toHaveBeenCalledTimes(1)
  })

  it('오늘 버튼 클릭 시 goToToday가 호출된다', async () => {
    const user = userEvent.setup()

    render(<CalendarHeader />)

    await user.click(screen.getByText('오늘'))

    expect(mockGoToToday).toHaveBeenCalledTimes(1)
  })

  it('뷰 모드 토글 버튼이 존재한다 (주/월)', () => {
    render(<CalendarHeader />)

    expect(screen.getByText('주')).toBeInTheDocument()
    expect(screen.getByText('월')).toBeInTheDocument()
  })

  it('주 버튼 클릭 시 setViewMode("week")가 호출된다', async () => {
    const user = userEvent.setup()

    render(<CalendarHeader />)

    await user.click(screen.getByText('주'))

    expect(mockSetViewMode).toHaveBeenCalledWith('week')
  })

  it('월 버튼 클릭 시 setViewMode("month")가 호출된다', async () => {
    const user = userEvent.setup()

    render(<CalendarHeader />)

    await user.click(screen.getByText('월'))

    expect(mockSetViewMode).toHaveBeenCalledWith('month')
  })

  it('월 뷰모드일 때 월 버튼에 활성 스타일이 적용된다', () => {
    mockCalendarState.viewMode = 'month'

    render(<CalendarHeader />)

    const monthButton = screen.getByText('월')
    expect(monthButton).toHaveClass('bg-background')
  })

  it('주 뷰모드일 때 주 버튼에 활성 스타일이 적용된다', () => {
    mockCalendarState.viewMode = 'week'

    render(<CalendarHeader />)

    const weekButton = screen.getByText('주')
    expect(weekButton).toHaveClass('bg-background')
  })

  it('비활성 뷰모드 버튼에는 muted 스타일이 적용된다', () => {
    mockCalendarState.viewMode = 'month'

    render(<CalendarHeader />)

    const weekButton = screen.getByText('주')
    expect(weekButton).toHaveClass('text-muted-foreground')
    expect(weekButton).not.toHaveClass('bg-background')
  })
})
