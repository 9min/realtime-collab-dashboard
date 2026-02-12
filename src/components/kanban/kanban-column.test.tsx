import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '@/__tests__/helpers/render-with-providers'
import {
  mockColumns,
  mockTasks,
  MOCK_COLUMN_ID_TODO,
} from '@/__tests__/helpers/fixtures'
import type { Tables } from '@/types/database'

import { KanbanColumn } from './kanban-column'

// @hello-pangea/dnd mock
vi.mock('@hello-pangea/dnd', () => ({
  Droppable: ({ children }: { children: (provided: unknown, snapshot: unknown) => React.ReactNode }) =>
    children(
      {
        innerRef: vi.fn(),
        droppableProps: {},
        placeholder: null,
      },
      { isDraggingOver: false },
    ),
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

const defaultProps = {
  column: mockColumns[0], // '할 일'
  tasks: [mockTasks[0]], // Task 1 is in 할 일 column
  onAddTask: vi.fn(),
  onTaskClick: vi.fn(),
  onRenameColumn: vi.fn(),
  onDeleteColumn: vi.fn(),
  canEdit: true,
  canDeleteColumn: true,
  canMoveAll: true,
}

describe('KanbanColumn', () => {
  it('컬럼 제목을 렌더링한다', () => {
    renderWithProviders(<KanbanColumn {...defaultProps} />)

    expect(screen.getByText('할 일')).toBeInTheDocument()
  })

  it('태스크 수를 렌더링한다', () => {
    renderWithProviders(<KanbanColumn {...defaultProps} />)

    // wip_limit이 null이면 태스크 수만 표시
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('WIP 제한이 있으면 "count/limit" 형식으로 표시한다', () => {
    const columnWithWip: Tables<'kanban_columns'> = {
      ...mockColumns[0],
      wip_limit: 3,
    }
    renderWithProviders(
      <KanbanColumn {...defaultProps} column={columnWithWip} />,
    )

    expect(screen.getByText('1/3')).toBeInTheDocument()
  })

  it('컬럼 내 태스크를 렌더링한다', () => {
    renderWithProviders(<KanbanColumn {...defaultProps} />)

    expect(screen.getByText('Task 1')).toBeInTheDocument()
  })

  it('여러 태스크를 렌더링한다', () => {
    const multipleTasks = [mockTasks[0], mockTasks[1]]
    renderWithProviders(
      <KanbanColumn {...defaultProps} tasks={multipleTasks} />,
    )

    expect(screen.getByText('Task 1')).toBeInTheDocument()
    expect(screen.getByText('Task 2')).toBeInTheDocument()
  })

  it('canEdit이 true일 때 태스크 추가 버튼을 표시한다', () => {
    renderWithProviders(<KanbanColumn {...defaultProps} canEdit={true} />)

    expect(screen.getByRole('button', { name: '태스크 추가' })).toBeInTheDocument()
  })

  it('canEdit이 false일 때 태스크 추가 버튼을 표시하지 않는다', () => {
    renderWithProviders(<KanbanColumn {...defaultProps} canEdit={false} />)

    expect(screen.queryByRole('button', { name: '태스크 추가' })).not.toBeInTheDocument()
  })

  it('태스크 추가 버튼 클릭 시 onAddTask를 호출한다', async () => {
    const user = userEvent.setup()
    const onAddTask = vi.fn()

    renderWithProviders(
      <KanbanColumn {...defaultProps} onAddTask={onAddTask} />,
    )

    await user.click(screen.getByRole('button', { name: '태스크 추가' }))
    expect(onAddTask).toHaveBeenCalledWith(MOCK_COLUMN_ID_TODO)
  })

  it('WIP 제한 초과 시 경고 스타일을 적용한다', () => {
    const columnWithWip: Tables<'kanban_columns'> = {
      ...mockColumns[0],
      wip_limit: 0, // limit 0, tasks 1 -> over limit
    }
    const { container } = renderWithProviders(
      <KanbanColumn {...defaultProps} column={columnWithWip} />,
    )

    // 최외곽 div에 border-red-400 클래스가 적용되어야 함
    const columnEl = container.firstChild as HTMLElement
    expect(columnEl.className).toContain('border-red-400')
  })

  it('WIP 제한 미초과 시 경고 스타일을 적용하지 않는다', () => {
    const columnWithWip: Tables<'kanban_columns'> = {
      ...mockColumns[0],
      wip_limit: 5,
    }
    const { container } = renderWithProviders(
      <KanbanColumn {...defaultProps} column={columnWithWip} />,
    )

    const columnEl = container.firstChild as HTMLElement
    expect(columnEl.className).not.toContain('border-red-400')
  })

  it('태스크가 없으면 빈 상태 메시지를 표시한다 (canEdit=true)', () => {
    renderWithProviders(
      <KanbanColumn {...defaultProps} tasks={[]} canEdit={true} />,
    )

    expect(screen.getByText('태스크를 추가하거나 여기로 드래그하세요')).toBeInTheDocument()
  })

  it('태스크가 없고 canEdit이 false면 다른 빈 상태 메시지를 표시한다', () => {
    renderWithProviders(
      <KanbanColumn {...defaultProps} tasks={[]} canEdit={false} />,
    )

    expect(screen.getByText('태스크가 없습니다')).toBeInTheDocument()
  })

  it('canEdit이 false일 때 컬럼 메뉴 버튼을 표시하지 않는다', () => {
    renderWithProviders(
      <KanbanColumn {...defaultProps} canEdit={false} />,
    )

    expect(screen.queryByRole('button', { name: '컬럼 메뉴' })).not.toBeInTheDocument()
  })

  it('canDeleteColumn이 false일 때 컬럼 메뉴 버튼을 표시하지 않는다', () => {
    renderWithProviders(
      <KanbanColumn {...defaultProps} canDeleteColumn={false} />,
    )

    expect(screen.queryByRole('button', { name: '컬럼 메뉴' })).not.toBeInTheDocument()
  })
})
