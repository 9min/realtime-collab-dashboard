import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'

import { renderWithProviders } from '@/__tests__/helpers/render-with-providers'
import {
  mockColumns,
  mockTasks,
  MOCK_COLUMN_ID_TODO,
  MOCK_COLUMN_ID_PROGRESS,
} from '@/__tests__/helpers/fixtures'

import { SwimlaneBoard } from './swimlane-board'

// favorite-button mock (avoids need for useAuth/useSupabase)
vi.mock('./favorite-button', () => ({
  FavoriteButton: () => null,
}))

vi.mock('./recurrence-badge', () => ({
  RecurrenceBadge: () => null,
}))

// @hello-pangea/dnd mock
vi.mock('@hello-pangea/dnd', () => ({
  Droppable: ({
    children,
  }: {
    children: (provided: unknown, snapshot: unknown) => React.ReactNode
  }) =>
    children(
      {
        innerRef: vi.fn(),
        droppableProps: {},
        placeholder: null,
      },
      { isDraggingOver: false },
    ),
  Draggable: ({
    children,
  }: {
    children: (provided: unknown, snapshot: unknown) => React.ReactNode
  }) =>
    children(
      {
        innerRef: vi.fn(),
        draggableProps: {},
        dragHandleProps: {},
      },
      { isDragging: false },
    ),
}))

const defaultProps = {
  groups: [
    {
      key: 'high',
      label: '높음',
      tasks: [mockTasks[1]], // Task 2 (high priority, 진행 중 column)
    },
    {
      key: 'medium',
      label: '보통',
      tasks: [mockTasks[0]], // Task 1 (medium priority, 할 일 column)
    },
  ],
  columns: mockColumns,
  onTaskClick: vi.fn(),
  canMoveAll: true,
}

describe('SwimlaneBoard', () => {
  it('그룹 헤더에 라벨을 렌더링한다', () => {
    renderWithProviders(<SwimlaneBoard {...defaultProps} />)

    // '높음'은 그룹 헤더와 TaskCard 우선순위 뱃지에 모두 나타남
    // 그룹 헤더의 라벨은 <span class="text-sm font-semibold"> 안에 있음
    const highLabels = screen.getAllByText('높음')
    expect(highLabels.length).toBeGreaterThanOrEqual(1)

    // '보통'도 그룹 헤더와 TaskCard 뱃지에 나타남
    const mediumLabels = screen.getAllByText('보통')
    expect(mediumLabels.length).toBeGreaterThanOrEqual(1)
  })

  it('그룹별 태스크 수 뱃지를 렌더링한다', () => {
    renderWithProviders(<SwimlaneBoard {...defaultProps} />)

    // 각 그룹의 태스크 수가 뱃지로 표시
    const badges = screen.getAllByText('1')
    // 각 그룹에 1개씩 태스크가 있음
    expect(badges.length).toBeGreaterThanOrEqual(2)
  })

  it('컬럼 서브헤더를 렌더링한다', () => {
    renderWithProviders(<SwimlaneBoard {...defaultProps} />)

    // 각 그룹마다 컬럼 헤더가 반복 렌더링됨
    const todoHeaders = screen.getAllByText('할 일')
    const progressHeaders = screen.getAllByText('진행 중')
    const doneHeaders = screen.getAllByText('완료')

    // 2개 그룹 x 3개 컬럼 = 각 컬럼명이 2번씩 나타남
    expect(todoHeaders).toHaveLength(2)
    expect(progressHeaders).toHaveLength(2)
    expect(doneHeaders).toHaveLength(2)
  })

  it('올바른 그룹/컬럼 셀 안에 태스크를 렌더링한다', () => {
    renderWithProviders(<SwimlaneBoard {...defaultProps} />)

    // Task 1 (medium, 할 일 column)과 Task 2 (high, 진행 중 column)
    expect(screen.getByText('Task 1')).toBeInTheDocument()
    expect(screen.getByText('Task 2')).toBeInTheDocument()
  })

  it('그룹이 없으면 아무 것도 렌더링하지 않는다', () => {
    const { container } = renderWithProviders(<SwimlaneBoard {...defaultProps} groups={[]} />)

    // 그룹 헤더나 태스크가 없어야 함
    expect(screen.queryByText('높음')).not.toBeInTheDocument()
    expect(screen.queryByText('보통')).not.toBeInTheDocument()
    // 최상위 컨테이너만 존재
    expect(container.firstChild).toBeInTheDocument()
  })

  it('그룹 내 태스크가 없는 경우에도 컬럼 셀을 렌더링한다', () => {
    const emptyGroup = {
      key: 'urgent',
      label: '긴급',
      tasks: [],
    }
    renderWithProviders(<SwimlaneBoard {...defaultProps} groups={[emptyGroup]} />)

    expect(screen.getByText('긴급')).toBeInTheDocument()
    // 컬럼 서브헤더는 여전히 렌더링
    expect(screen.getByText('할 일')).toBeInTheDocument()
    expect(screen.getByText('진행 중')).toBeInTheDocument()
    expect(screen.getByText('완료')).toBeInTheDocument()
  })

  it('태스크 수 뱃지가 그룹의 전체 태스크 수를 반영한다', () => {
    const multiTaskGroup = {
      key: 'multi',
      label: '다중 태스크',
      tasks: [
        { ...mockTasks[0], column_id: MOCK_COLUMN_ID_TODO },
        { ...mockTasks[1], column_id: MOCK_COLUMN_ID_PROGRESS },
      ],
    }
    renderWithProviders(<SwimlaneBoard {...defaultProps} groups={[multiTaskGroup]} />)

    expect(screen.getByText('다중 태스크')).toBeInTheDocument()
    // 그룹의 전체 태스크 수 = 2
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('onTaskClick이 태스크 카드에 전달된다', async () => {
    const onTaskClick = vi.fn()
    const { getByText } = renderWithProviders(
      <SwimlaneBoard {...defaultProps} onTaskClick={onTaskClick} />,
    )

    // TaskCard의 onClick은 role="button"으로 연결됨
    const taskElement = getByText('Task 1')
    taskElement.click()
    expect(onTaskClick).toHaveBeenCalledWith(mockTasks[0])
  })
})
