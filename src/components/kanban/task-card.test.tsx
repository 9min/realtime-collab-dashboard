import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '@/__tests__/helpers/render-with-providers'
import { mockTasks, mockLabels, MOCK_USER_ID, MOCK_USER_ID_2 } from '@/__tests__/helpers/fixtures'

import { TaskCard } from './task-card'

vi.mock('./favorite-button', () => ({
  FavoriteButton: () => null,
}))

vi.mock('./recurrence-badge', () => ({
  RecurrenceBadge: () => null,
}))

// @hello-pangea/dnd mock — Draggable을 투명하게 렌더
vi.mock('@hello-pangea/dnd', () => ({
  Draggable: ({ children }: { children: (provided: unknown, snapshot: unknown) => React.ReactNode }) =>
    children(
      {
        innerRef: vi.fn(),
        draggableProps: {},
        dragHandleProps: {},
      },
      { isDragging: false },
    ),
}))

const mockMembers = [
  {
    user_id: MOCK_USER_ID,
    profiles: {
      id: MOCK_USER_ID,
      email: 'test@example.com',
      full_name: 'Test User',
      avatar_url: null,
      is_admin: false,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  },
  {
    user_id: MOCK_USER_ID_2,
    profiles: {
      id: MOCK_USER_ID_2,
      email: 'other@example.com',
      full_name: 'Other User',
      avatar_url: null,
      is_admin: false,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  },
]

describe('TaskCard', () => {
  const onClick = vi.fn()

  it('태스크 제목을 렌더링한다', () => {
    renderWithProviders(
      <TaskCard task={mockTasks[0]} index={0} onClick={onClick} />,
    )
    expect(screen.getByText('Task 1')).toBeInTheDocument()
  })

  it('우선순위 뱃지를 렌더링한다', () => {
    renderWithProviders(
      <TaskCard task={mockTasks[0]} index={0} onClick={onClick} />,
    )
    expect(screen.getByText('보통')).toBeInTheDocument()
  })

  it('high 우선순위를 표시한다', () => {
    renderWithProviders(
      <TaskCard task={mockTasks[1]} index={0} onClick={onClick} />,
    )
    expect(screen.getByText('높음')).toBeInTheDocument()
  })

  it('마감일이 있으면 렌더링한다', () => {
    renderWithProviders(
      <TaskCard task={mockTasks[1]} index={0} onClick={onClick} />,
    )
    // Task 2의 due_date = 2026-02-28
    const dateText = new Date('2026-02-28').toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    })
    expect(screen.getByText(dateText)).toBeInTheDocument()
  })

  it('마감일이 없으면 날짜를 표시하지 않는다', () => {
    renderWithProviders(
      <TaskCard task={mockTasks[0]} index={0} onClick={onClick} />,
    )
    // Task 1의 due_date = null — 날짜 표시 없어야 함
    expect(screen.queryByText(/\d+일/)).not.toBeInTheDocument()
  })

  it('라벨을 렌더링한다', () => {
    renderWithProviders(
      <TaskCard
        task={mockTasks[0]}
        index={0}
        onClick={onClick}
        taskLabels={mockLabels}
      />,
    )
    expect(screen.getByText('Bug')).toBeInTheDocument()
    expect(screen.getByText('Feature')).toBeInTheDocument()
  })

  it('담당자 아바타를 렌더링한다', () => {
    renderWithProviders(
      <TaskCard
        task={mockTasks[0]}
        index={0}
        onClick={onClick}
        members={mockMembers}
      />,
    )
    // Task 1의 assignee_id = MOCK_USER_ID → 'Test User' → fallback 'T'
    expect(screen.getByText('T')).toBeInTheDocument()
  })

  it('클릭 시 onClick 콜백을 호출한다', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <TaskCard task={mockTasks[0]} index={0} onClick={onClick} />,
    )

    await user.click(screen.getByText('Task 1'))
    expect(onClick).toHaveBeenCalledWith(mockTasks[0])
  })
})
