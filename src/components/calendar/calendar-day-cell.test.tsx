import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { Task } from '@/types/kanban'

import { CalendarDayCell } from './calendar-day-cell'

const mockOnTaskClick = vi.fn()

function createMockTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    project_id: 'test-project',
    column_id: 'col-1',
    title: 'Mock Task',
    description: null,
    priority: 'medium',
    assignee_id: null,
    position: 0,
    due_date: null,
    start_date: null,
    created_by: 'user-1',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    sprint_id: null,
    estimated_minutes: null,
    ...overrides,
  }
}

describe('CalendarDayCell', () => {
  const baseProps = {
    date: new Date(2026, 1, 15), // 2026-02-15
    isCurrentMonth: true,
    isToday: false,
    tasks: [] as Task[],
    onTaskClick: mockOnTaskClick,
  }

  beforeEach(() => {
    mockOnTaskClick.mockClear()
  })

  it('날짜 숫자를 올바르게 렌더링한다', () => {
    render(<CalendarDayCell {...baseProps} />)
    expect(screen.getByText('15')).toBeInTheDocument()
  })

  it('다른 날짜도 올바르게 렌더링한다', () => {
    render(<CalendarDayCell {...baseProps} date={new Date(2026, 0, 1)} />)
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('isToday가 true일 때 오늘 스타일을 적용한다', () => {
    render(<CalendarDayCell {...baseProps} isToday={true} />)
    const dateSpan = screen.getByText('15')
    expect(dateSpan).toHaveClass('bg-primary')
    expect(dateSpan).toHaveClass('font-bold')
  })

  it('isToday가 false일 때 오늘 스타일을 적용하지 않는다', () => {
    render(<CalendarDayCell {...baseProps} isToday={false} />)
    const dateSpan = screen.getByText('15')
    expect(dateSpan).not.toHaveClass('bg-primary')
    expect(dateSpan).not.toHaveClass('font-bold')
  })

  it('현재 월이 아닌 경우 흐린 스타일을 적용한다', () => {
    render(<CalendarDayCell {...baseProps} isCurrentMonth={false} />)
    const dateSpan = screen.getByText('15')
    expect(dateSpan).toHaveClass('text-muted-foreground')
  })

  it('현재 월인 경우 흐린 스타일을 적용하지 않는다', () => {
    render(<CalendarDayCell {...baseProps} isCurrentMonth={true} />)
    const dateSpan = screen.getByText('15')
    expect(dateSpan).not.toHaveClass('text-muted-foreground')
  })

  it('태스크를 우선순위 도트 색상과 함께 렌더링한다', () => {
    const tasks = [
      createMockTask({ id: 't-1', title: 'Low Task', priority: 'low' }),
      createMockTask({ id: 't-2', title: 'High Task', priority: 'high' }),
      createMockTask({ id: 't-3', title: 'Urgent Task', priority: 'urgent' }),
    ]

    render(<CalendarDayCell {...baseProps} tasks={tasks} />)

    expect(screen.getByText('Low Task')).toBeInTheDocument()
    expect(screen.getByText('High Task')).toBeInTheDocument()
    expect(screen.getByText('Urgent Task')).toBeInTheDocument()
  })

  it('태스크 우선순위별 도트 색상이 올바르게 적용된다', () => {
    const tasks = [
      createMockTask({ id: 't-1', title: 'Low Task', priority: 'low' }),
      createMockTask({ id: 't-2', title: 'High Task', priority: 'high' }),
    ]

    const { container } = render(<CalendarDayCell {...baseProps} tasks={tasks} />)

    // 우선순위 도트는 h-1.5 w-1.5 크기의 rounded-full 요소
    const dots = container.querySelectorAll('.h-1\\.5.w-1\\.5.rounded-full')
    expect(dots).toHaveLength(2)
    expect(dots[0]).toHaveClass('bg-emerald-500')
    expect(dots[1]).toHaveClass('bg-amber-500')
  })

  it('MAX_VISIBLE_TASKS(3)을 초과하면 "+N 더보기"를 표시한다', () => {
    const tasks = [
      createMockTask({ id: 't-1', title: 'Task A', priority: 'low' }),
      createMockTask({ id: 't-2', title: 'Task B', priority: 'medium' }),
      createMockTask({ id: 't-3', title: 'Task C', priority: 'high' }),
      createMockTask({ id: 't-4', title: 'Task D', priority: 'urgent' }),
      createMockTask({ id: 't-5', title: 'Task E', priority: 'low' }),
    ]

    render(<CalendarDayCell {...baseProps} tasks={tasks} />)

    // 처음 3개만 보임
    expect(screen.getByText('Task A')).toBeInTheDocument()
    expect(screen.getByText('Task B')).toBeInTheDocument()
    expect(screen.getByText('Task C')).toBeInTheDocument()

    // 나머지 2개는 숨겨짐
    expect(screen.queryByText('Task D')).not.toBeInTheDocument()
    expect(screen.queryByText('Task E')).not.toBeInTheDocument()

    // "+2 더보기" 표시
    expect(screen.getByText('+2 더보기')).toBeInTheDocument()
  })

  it('태스크가 정확히 3개일 때 "더보기"를 표시하지 않는다', () => {
    const tasks = [
      createMockTask({ id: 't-1', title: 'Task A', priority: 'low' }),
      createMockTask({ id: 't-2', title: 'Task B', priority: 'medium' }),
      createMockTask({ id: 't-3', title: 'Task C', priority: 'high' }),
    ]

    render(<CalendarDayCell {...baseProps} tasks={tasks} />)

    expect(screen.queryByText(/더보기/)).not.toBeInTheDocument()
  })

  it('태스크가 없으면 아무 태스크도 렌더링하지 않는다', () => {
    render(<CalendarDayCell {...baseProps} tasks={[]} />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByText(/더보기/)).not.toBeInTheDocument()
  })

  it('태스크 클릭 시 onTaskClick 콜백이 태스크 객체와 함께 호출된다', async () => {
    const user = userEvent.setup()
    const task = createMockTask({ id: 'task-abc-123', title: 'Navigate Task', priority: 'medium' })

    render(<CalendarDayCell {...baseProps} tasks={[task]} />)

    await user.click(screen.getByText('Navigate Task'))

    expect(mockOnTaskClick).toHaveBeenCalledWith(task)
  })

  it('여러 태스크 중 특정 태스크 클릭 시 올바른 태스크 객체로 콜백이 호출된다', async () => {
    const user = userEvent.setup()
    const task1 = createMockTask({ id: 'task-1', title: 'First', priority: 'low' })
    const task2 = createMockTask({ id: 'task-2', title: 'Second', priority: 'high' })

    render(<CalendarDayCell {...baseProps} tasks={[task1, task2]} />)

    await user.click(screen.getByText('Second'))

    expect(mockOnTaskClick).toHaveBeenCalledWith(task2)
  })
})
