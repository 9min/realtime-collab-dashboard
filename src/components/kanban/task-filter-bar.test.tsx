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
  dueDateRange: { from: null, to: null },
  setDueDateFrom: vi.fn(),
  setDueDateTo: vi.fn(),
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

    expect(screen.getByText('우선순위:')).toBeInTheDocument()
  })

  it('우선순위 팝오버를 열면 체크박스 항목이 표시된다', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TaskFilterBar members={mockMembers} />)

    // 우선순위 버튼을 클릭하여 팝오버 열기
    const priorityButton = screen.getByText('우선순위:').closest('button')!
    await user.click(priorityButton)

    expect(screen.getByText('낮음')).toBeInTheDocument()
    expect(screen.getByText('보통')).toBeInTheDocument()
    expect(screen.getByText('높음')).toBeInTheDocument()
    expect(screen.getByText('긴급')).toBeInTheDocument()
  })

  it('담당자 필터 버튼을 렌더링한다', () => {
    renderWithProviders(<TaskFilterBar members={mockMembers} />)

    expect(screen.getByText('담당자:')).toBeInTheDocument()
  })

  it('담당자 팝오버를 열면 멤버 목록이 표시된다', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TaskFilterBar members={mockMembers} />)

    const assigneeButton = screen.getByText('담당자:').closest('button')!
    await user.click(assigneeButton)

    expect(screen.getByText('미배정')).toBeInTheDocument()
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('Other User')).toBeInTheDocument()
  })

  it('스윔레인 뷰 셀렉트를 렌더링한다', () => {
    renderWithProviders(<TaskFilterBar members={mockMembers} />)

    expect(screen.getByText('뷰:')).toBeInTheDocument()
  })

  it('마감일 범위 입력을 렌더링한다', () => {
    renderWithProviders(<TaskFilterBar members={mockMembers} />)

    expect(screen.getByLabelText('마감일 시작')).toBeInTheDocument()
    expect(screen.getByLabelText('마감일 종료')).toBeInTheDocument()
  })

  it('필터가 비활성 상태면 초기화 버튼을 표시하지 않는다', () => {
    mockStoreState.hasActiveFilters.mockReturnValue(false)
    renderWithProviders(<TaskFilterBar members={mockMembers} />)

    expect(screen.queryByText('초기화')).not.toBeInTheDocument()
  })

  it('필터가 활성 상태면 초기화 버튼을 표시한다', () => {
    mockStoreState.hasActiveFilters.mockReturnValue(true)
    renderWithProviders(<TaskFilterBar members={mockMembers} />)

    expect(screen.getByText('초기화')).toBeInTheDocument()
  })

  it('초기화 버튼 클릭 시 resetFilters를 호출한다', async () => {
    const user = userEvent.setup()
    mockStoreState.hasActiveFilters.mockReturnValue(true)
    renderWithProviders(<TaskFilterBar members={mockMembers} />)

    await user.click(screen.getByText('초기화'))
    expect(mockStoreState.resetFilters).toHaveBeenCalled()
  })

  it('우선순위 체크박스 클릭 시 togglePriority를 호출한다', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TaskFilterBar members={mockMembers} />)

    // 팝오버 열기
    const priorityButton = screen.getByText('우선순위:').closest('button')!
    await user.click(priorityButton)

    // '높음' 우선순위 체크박스 클릭
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

  it('우선순위 1개 선택 시 해당 라벨을 표시한다', () => {
    mockStoreState.priorities = ['high']
    renderWithProviders(<TaskFilterBar members={mockMembers} />)

    // 우선순위 버튼의 라벨이 '높음'으로 표시
    const priorityButton = screen.getByText('우선순위:').closest('button')!
    expect(priorityButton).toHaveTextContent('높음')
  })

  it('우선순위 여러 개 선택 시 "N개 선택"을 표시한다', () => {
    mockStoreState.priorities = ['high', 'urgent']
    renderWithProviders(<TaskFilterBar members={mockMembers} />)

    const priorityButton = screen.getByText('우선순위:').closest('button')!
    expect(priorityButton).toHaveTextContent('2개 선택')
  })

  it('라벨 필터가 labels prop이 있을 때만 렌더링된다', () => {
    renderWithProviders(<TaskFilterBar members={mockMembers} labels={mockLabels} />)

    expect(screen.getByText('라벨:')).toBeInTheDocument()
  })

  it('labels prop이 없으면 라벨 필터가 렌더링되지 않는다', () => {
    renderWithProviders(<TaskFilterBar members={mockMembers} />)

    expect(screen.queryByText('라벨:')).not.toBeInTheDocument()
  })
})
