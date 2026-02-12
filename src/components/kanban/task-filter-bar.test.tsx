import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '@/__tests__/helpers/render-with-providers'
import {
  MOCK_USER_ID,
  MOCK_USER_ID_2,
  MOCK_PROJECT_ID,
  mockProfile,
  mockProfile2,
  mockLabels,
  mockTasks,
} from '@/__tests__/helpers/fixtures'

import { TaskFilterBar } from './task-filter-bar'

// ── Zustand store mock ──
const mockStoreState = {
  searchText: '',
  setSearchText: vi.fn(),
  priorities: [] as string[],
  togglePriority: vi.fn(),
  assigneeIds: [] as string[],
  toggleAssigneeId: vi.fn(),
  dueDateRange: { from: null as string | null, to: null as string | null },
  setDueDateFrom: vi.fn(),
  setDueDateTo: vi.fn(),
  clearDueDateRange: vi.fn(),
  labelIds: [] as string[],
  toggleLabelId: vi.fn(),
  swimlaneMode: 'none',
  setSwimlaneMode: vi.fn(),
  resetFilters: vi.fn(),
  hasActiveFilters: vi.fn(() => false),
}

vi.mock('@/stores/kanban-filter-store', () => ({
  useKanbanFilterStore: () => mockStoreState,
}))

vi.mock('@/hooks/use-export', () => ({
  useExport: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('@/components/providers/supabase-provider', () => ({
  useSupabase: () => ({}),
}))

const mockMembers = [
  {
    id: 'member-1',
    project_id: MOCK_PROJECT_ID,
    user_id: MOCK_USER_ID,
    role: 'owner' as const,
    joined_at: '2026-01-01T00:00:00Z',
    profiles: mockProfile,
  },
  {
    id: 'member-2',
    project_id: MOCK_PROJECT_ID,
    user_id: MOCK_USER_ID_2,
    role: 'member' as const,
    joined_at: '2026-01-01T00:00:00Z',
    profiles: mockProfile2,
  },
]

describe('TaskFilterBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStoreState.searchText = ''
    mockStoreState.priorities = []
    mockStoreState.assigneeIds = []
    mockStoreState.dueDateRange = { from: null, to: null }
    mockStoreState.labelIds = []
    mockStoreState.swimlaneMode = 'none'
    mockStoreState.hasActiveFilters.mockReturnValue(false)
  })

  it('검색 입력 필드를 렌더링한다', () => {
    renderWithProviders(<TaskFilterBar members={mockMembers} />)

    expect(screen.getByPlaceholderText('태스크 검색...')).toBeInTheDocument()
  })

  it('우선순위 필터 버튼을 렌더링한다', () => {
    renderWithProviders(<TaskFilterBar members={mockMembers} />)

    expect(screen.getByRole('button', { name: /우선순위/ })).toBeInTheDocument()
  })

  it('우선순위 팝오버를 열면 체크박스 항목이 표시된다', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TaskFilterBar members={mockMembers} />)

    const priorityButton = screen.getByRole('button', { name: /우선순위/ })
    await user.click(priorityButton)

    expect(screen.getByText('낮음')).toBeInTheDocument()
    expect(screen.getByText('보통')).toBeInTheDocument()
    expect(screen.getByText('높음')).toBeInTheDocument()
    expect(screen.getByText('긴급')).toBeInTheDocument()
  })

  it('담당자 필터 버튼을 렌더링한다', () => {
    renderWithProviders(<TaskFilterBar members={mockMembers} />)

    expect(screen.getByRole('button', { name: /담당자/ })).toBeInTheDocument()
  })

  it('담당자 팝오버를 열면 멤버 목록이 표시된다', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TaskFilterBar members={mockMembers} />)

    const assigneeButton = screen.getByRole('button', { name: /담당자/ })
    await user.click(assigneeButton)

    expect(screen.getByText('미배정')).toBeInTheDocument()
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('Other User')).toBeInTheDocument()
  })

  it('스윔레인 뷰 버튼을 렌더링한다', () => {
    renderWithProviders(<TaskFilterBar members={mockMembers} />)

    expect(screen.getByRole('button', { name: /뷰/ })).toBeInTheDocument()
  })

  it('마감일 필터 버튼을 렌더링한다', () => {
    renderWithProviders(<TaskFilterBar members={mockMembers} />)

    expect(screen.getByRole('button', { name: /마감일/ })).toBeInTheDocument()
  })

  it('마감일 Popover를 열면 날짜 입력이 표시된다', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TaskFilterBar members={mockMembers} />)

    const dueDateButton = screen.getByRole('button', { name: /마감일/ })
    await user.click(dueDateButton)

    expect(screen.getByLabelText('마감일 시작')).toBeInTheDocument()
    expect(screen.getByLabelText('마감일 종료')).toBeInTheDocument()
  })

  it('필터가 비활성 상태면 Badge 칩 행을 표시하지 않는다', () => {
    mockStoreState.hasActiveFilters.mockReturnValue(false)
    renderWithProviders(<TaskFilterBar members={mockMembers} />)

    expect(screen.queryByText('모두 초기화')).not.toBeInTheDocument()
  })

  it('필터가 활성 상태면 "모두 초기화" 버튼을 표시한다', () => {
    mockStoreState.hasActiveFilters.mockReturnValue(true)
    renderWithProviders(<TaskFilterBar members={mockMembers} />)

    expect(screen.getByText('모두 초기화')).toBeInTheDocument()
  })

  it('"모두 초기화" 클릭 시 resetFilters를 호출한다', async () => {
    const user = userEvent.setup()
    mockStoreState.hasActiveFilters.mockReturnValue(true)
    renderWithProviders(<TaskFilterBar members={mockMembers} />)

    await user.click(screen.getByText('모두 초기화'))
    expect(mockStoreState.resetFilters).toHaveBeenCalled()
  })

  it('우선순위 체크박스 클릭 시 togglePriority를 호출한다', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TaskFilterBar members={mockMembers} />)

    const priorityButton = screen.getByRole('button', { name: /우선순위/ })
    await user.click(priorityButton)

    const highCheckbox = screen.getByRole('checkbox', { name: /높음/ })
    await user.click(highCheckbox)

    expect(mockStoreState.togglePriority).toHaveBeenCalledWith('high')
  })

  it('검색 입력 시 setSearchText를 호출한다', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TaskFilterBar members={mockMembers} />)

    const searchInput = screen.getByPlaceholderText('태스크 검색...')
    await user.type(searchInput, 'test')

    expect(mockStoreState.setSearchText).toHaveBeenCalled()
  })

  it('우선순위 선택 시 count Badge를 표시한다', () => {
    mockStoreState.priorities = ['high']
    mockStoreState.hasActiveFilters.mockReturnValue(true)
    renderWithProviders(<TaskFilterBar members={mockMembers} />)

    // 우선순위 버튼에 count Badge가 1로 표시됨
    const priorityButton = screen.getByRole('button', { name: /우선순위/ })
    expect(priorityButton).toHaveTextContent('1')
  })

  it('우선순위 활성 시 Badge 칩을 표시한다', () => {
    mockStoreState.priorities = ['high', 'urgent']
    mockStoreState.hasActiveFilters.mockReturnValue(true)
    renderWithProviders(<TaskFilterBar members={mockMembers} />)

    expect(screen.getByText('높음')).toBeInTheDocument()
    expect(screen.getByText('긴급')).toBeInTheDocument()
  })

  it('Badge 칩 X 클릭으로 개별 우선순위 필터를 제거한다', async () => {
    const user = userEvent.setup()
    mockStoreState.priorities = ['high']
    mockStoreState.hasActiveFilters.mockReturnValue(true)
    renderWithProviders(<TaskFilterBar members={mockMembers} />)

    const removeButton = screen.getByLabelText('높음 필터 제거')
    await user.click(removeButton)

    expect(mockStoreState.togglePriority).toHaveBeenCalledWith('high')
  })

  it('담당자 활성 시 Badge 칩에 이름을 표시한다', () => {
    mockStoreState.assigneeIds = [MOCK_USER_ID]
    mockStoreState.hasActiveFilters.mockReturnValue(true)
    renderWithProviders(<TaskFilterBar members={mockMembers} />)

    expect(screen.getByText('Test User')).toBeInTheDocument()
  })

  it('Badge 칩 X 클릭으로 개별 담당자 필터를 제거한다', async () => {
    const user = userEvent.setup()
    mockStoreState.assigneeIds = [MOCK_USER_ID]
    mockStoreState.hasActiveFilters.mockReturnValue(true)
    renderWithProviders(<TaskFilterBar members={mockMembers} />)

    const removeButton = screen.getByLabelText('Test User 필터 제거')
    await user.click(removeButton)

    expect(mockStoreState.toggleAssigneeId).toHaveBeenCalledWith(MOCK_USER_ID)
  })

  it('마감일 활성 시 Badge 칩에 날짜 범위를 표시한다', () => {
    mockStoreState.dueDateRange = { from: '2026-01-15', to: '2026-02-15' }
    mockStoreState.hasActiveFilters.mockReturnValue(true)
    renderWithProviders(<TaskFilterBar members={mockMembers} />)

    expect(screen.getByText(/01\/15/)).toBeInTheDocument()
    expect(screen.getByText(/02\/15/)).toBeInTheDocument()
  })

  it('마감일 Badge 칩 X 클릭으로 마감일 필터를 제거한다', async () => {
    const user = userEvent.setup()
    mockStoreState.dueDateRange = { from: '2026-01-15', to: '2026-02-15' }
    mockStoreState.hasActiveFilters.mockReturnValue(true)
    renderWithProviders(<TaskFilterBar members={mockMembers} />)

    const removeButton = screen.getByLabelText('마감일 필터 제거')
    await user.click(removeButton)

    expect(mockStoreState.clearDueDateRange).toHaveBeenCalled()
  })

  it('라벨 필터가 labels prop이 있을 때만 렌더링된다', () => {
    renderWithProviders(<TaskFilterBar members={mockMembers} labels={mockLabels} />)

    expect(screen.getByRole('button', { name: /라벨/ })).toBeInTheDocument()
  })

  it('labels prop이 없으면 라벨 필터가 렌더링되지 않는다', () => {
    renderWithProviders(<TaskFilterBar members={mockMembers} />)

    expect(screen.queryByRole('button', { name: /^라벨/ })).not.toBeInTheDocument()
  })

  it('오버플로우 메뉴가 projectId 전달 시 렌더링된다', () => {
    renderWithProviders(
      <TaskFilterBar
        members={mockMembers}
        projectId={MOCK_PROJECT_ID}
        tasks={mockTasks}
      />,
    )

    expect(screen.getByRole('button', { name: '더보기' })).toBeInTheDocument()
  })

  it('오버플로우 메뉴를 열면 내보내기 옵션이 표시된다', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <TaskFilterBar
        members={mockMembers}
        projectId={MOCK_PROJECT_ID}
        tasks={mockTasks}
      />,
    )

    const moreButton = screen.getByRole('button', { name: '더보기' })
    await user.click(moreButton)

    expect(screen.getByText('CSV로 내보내기')).toBeInTheDocument()
    expect(screen.getByText('JSON으로 내보내기')).toBeInTheDocument()
  })

  it('라벨 활성 시 Badge 칩에 라벨 색상 dot과 이름을 표시한다', () => {
    mockStoreState.labelIds = [mockLabels[0].id]
    mockStoreState.hasActiveFilters.mockReturnValue(true)
    renderWithProviders(<TaskFilterBar members={mockMembers} labels={mockLabels} />)

    expect(screen.getByText('Bug')).toBeInTheDocument()
  })
})
