import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

import type { Task } from '@/types/kanban'

import { CalendarGrid } from './calendar-grid'

// CalendarDayCell을 mock하여 전달된 props를 검증
vi.mock('./calendar-day-cell', () => ({
  CalendarDayCell: ({ date, isCurrentMonth, isToday, tasks }: {
    date: Date
    isCurrentMonth: boolean
    isToday: boolean
    tasks: Task[]
  }) => (
    <div data-testid="calendar-day-cell" data-date={date.toISOString()} data-current-month={isCurrentMonth} data-is-today={isToday}>
      <span>{date.getDate()}</span>
      <span data-testid="task-count">{tasks.length}</span>
    </div>
  ),
}))

// calendar-store를 mock하여 currentDate/viewMode 제어
const mockCalendarState = {
  currentDate: new Date(2026, 1, 15), // 2026-02-15 (February)
  viewMode: 'month' as 'month' | 'week',
}

vi.mock('@/stores/calendar-store', () => ({
  useCalendarStore: () => mockCalendarState,
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useParams: () => ({ projectId: 'test-project' }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

describe('CalendarGrid', () => {
  const emptyTasksByDate = new Map<string, Task[]>()

  beforeEach(() => {
    mockCalendarState.currentDate = new Date(2026, 1, 15)
    mockCalendarState.viewMode = 'month'
  })

  it('7개의 요일 헤더를 렌더링한다', () => {
    render(<CalendarGrid tasksByDate={emptyTasksByDate} onTaskClick={vi.fn()} />)

    expect(screen.getByText('일')).toBeInTheDocument()
    expect(screen.getByText('월')).toBeInTheDocument()
    expect(screen.getByText('화')).toBeInTheDocument()
    expect(screen.getByText('수')).toBeInTheDocument()
    expect(screen.getByText('목')).toBeInTheDocument()
    expect(screen.getByText('금')).toBeInTheDocument()
    expect(screen.getByText('토')).toBeInTheDocument()
  })

  it('주말 헤더(일, 토)에 rose 색상 클래스가 적용된다', () => {
    render(<CalendarGrid tasksByDate={emptyTasksByDate} onTaskClick={vi.fn()} />)

    const sundayHeader = screen.getByText('일')
    const saturdayHeader = screen.getByText('토')

    expect(sundayHeader).toHaveClass('text-rose-400')
    expect(saturdayHeader).toHaveClass('text-rose-400')
  })

  it('평일 헤더에는 rose 색상이 적용되지 않는다', () => {
    render(<CalendarGrid tasksByDate={emptyTasksByDate} onTaskClick={vi.fn()} />)

    const mondayHeader = screen.getByText('월')
    const wednesdayHeader = screen.getByText('수')

    expect(mondayHeader).not.toHaveClass('text-rose-400')
    expect(wednesdayHeader).not.toHaveClass('text-rose-400')

    expect(mondayHeader).toHaveClass('text-muted-foreground')
    expect(wednesdayHeader).toHaveClass('text-muted-foreground')
  })

  it('월 뷰에서 42개(6주)의 날짜 셀을 렌더링한다', () => {
    render(<CalendarGrid tasksByDate={emptyTasksByDate} onTaskClick={vi.fn()} />)

    const cells = screen.getAllByTestId('calendar-day-cell')
    expect(cells).toHaveLength(42)
  })

  it('주 뷰에서 7개의 날짜 셀을 렌더링한다', () => {
    mockCalendarState.viewMode = 'week'

    render(<CalendarGrid tasksByDate={emptyTasksByDate} onTaskClick={vi.fn()} />)

    const cells = screen.getAllByTestId('calendar-day-cell')
    expect(cells).toHaveLength(7)
  })

  it('해당 날짜에 태스크를 CalendarDayCell에 전달한다', () => {
    const mockTask: Task = {
      id: 'task-1',
      project_id: 'test-project',
      column_id: 'col-1',
      title: 'Test Task',
      description: null,
      priority: 'medium',
      assignee_id: null,
      position: 0,
      due_date: '2026-02-15',
      created_by: 'user-1',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }

    const tasksByDate = new Map<string, Task[]>()
    tasksByDate.set('2026-02-15', [mockTask])

    render(<CalendarGrid tasksByDate={tasksByDate} onTaskClick={vi.fn()} />)

    // 2026-02-15에 해당하는 셀의 task-count가 1이어야 함
    const cells = screen.getAllByTestId('calendar-day-cell')
    const feb15Cell = cells.find((cell) => {
      const dateStr = cell.getAttribute('data-date')
      if (!dateStr) return false
      const date = new Date(dateStr)
      return date.getDate() === 15 && date.getMonth() === 1
    })

    expect(feb15Cell).toBeDefined()
    const taskCount = feb15Cell!.querySelector('[data-testid="task-count"]')
    expect(taskCount).toHaveTextContent('1')
  })

  it('태스크가 없는 날짜에는 빈 배열이 전달된다', () => {
    render(<CalendarGrid tasksByDate={emptyTasksByDate} onTaskClick={vi.fn()} />)

    const taskCounts = screen.getAllByTestId('task-count')
    taskCounts.forEach((el) => {
      expect(el).toHaveTextContent('0')
    })
  })

  it('currentDate가 변경되면 해당 월의 그리드를 렌더링한다', () => {
    mockCalendarState.currentDate = new Date(2026, 0, 1) // January 2026

    render(<CalendarGrid tasksByDate={emptyTasksByDate} onTaskClick={vi.fn()} />)

    const cells = screen.getAllByTestId('calendar-day-cell')
    // January 2026 starts on Thursday, so first cell should be Dec 28 (Sunday)
    const firstCellDate = new Date(cells[0].getAttribute('data-date')!)
    expect(firstCellDate.getDay()).toBe(0) // Sunday
  })
})
