import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '@/__tests__/helpers/render-with-providers'
import { mockSubtasks, MOCK_TASK_ID_1, MOCK_PROJECT_ID, MOCK_USER_ID } from '@/__tests__/helpers/fixtures'

// mock 함수들
const mockMutate = vi.fn()
const mockCreateMutate = vi.fn()
const mockDeleteMutate = vi.fn()

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ user: { id: MOCK_USER_ID }, isLoading: false, isAuthenticated: true }),
}))

vi.mock('@/components/providers/supabase-provider', () => ({
  useSupabase: () => ({}),
}))

vi.mock('@/queries/use-subtasks', () => ({
  useSubtasks: () => ({
    data: mockSubtasks,
    isLoading: false,
  }),
  useCreateSubtask: () => ({
    mutate: mockCreateMutate,
    isPending: false,
  }),
  useUpdateSubtask: () => ({
    mutate: mockMutate,
  }),
  useDeleteSubtask: () => ({
    mutate: mockDeleteMutate,
  }),
}))

import { SubtaskSection } from './subtask-section'

describe('SubtaskSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('서브태스크 카운트를 표시한다', () => {
    renderWithProviders(
      <SubtaskSection taskId={MOCK_TASK_ID_1} projectId={MOCK_PROJECT_ID} canEdit />,
    )
    // 1 completed / 2 total
    expect(screen.getByText('서브태스크 (1/2)')).toBeInTheDocument()
  })

  it('서브태스크 목록을 렌더링한다', () => {
    renderWithProviders(
      <SubtaskSection taskId={MOCK_TASK_ID_1} projectId={MOCK_PROJECT_ID} canEdit />,
    )
    expect(screen.getByText('Write unit tests')).toBeInTheDocument()
    expect(screen.getByText('Update documentation')).toBeInTheDocument()
  })

  it('진행률 바를 표시한다', () => {
    renderWithProviders(
      <SubtaskSection taskId={MOCK_TASK_ID_1} projectId={MOCK_PROJECT_ID} canEdit />,
    )
    // Progress component는 role="progressbar"로 렌더
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('체크박스 토글 시 updateMutation을 호출한다', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <SubtaskSection taskId={MOCK_TASK_ID_1} projectId={MOCK_PROJECT_ID} canEdit />,
    )

    // 첫 번째 서브태스크(미완료)의 체크박스 토글
    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[0])

    expect(mockMutate).toHaveBeenCalledWith({
      subtaskId: mockSubtasks[0].id,
      input: { completed: true },
    })
  })

  it('추가 버튼 클릭 시 입력 필드가 나타난다', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <SubtaskSection taskId={MOCK_TASK_ID_1} projectId={MOCK_PROJECT_ID} canEdit />,
    )

    await user.click(screen.getByRole('button', { name: /추가/ }))
    expect(screen.getByPlaceholderText('서브태스크 제목...')).toBeInTheDocument()
  })

  it('서브태스크 추가 시 createMutation을 호출한다', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <SubtaskSection taskId={MOCK_TASK_ID_1} projectId={MOCK_PROJECT_ID} canEdit />,
    )

    await user.click(screen.getByRole('button', { name: /추가/ }))
    const input = screen.getByPlaceholderText('서브태스크 제목...')
    await user.type(input, '새 서브태스크')

    // '추가' 버튼 클릭 (인라인 입력 옆)
    const addButtons = screen.getAllByRole('button', { name: /추가/ })
    await user.click(addButtons[addButtons.length - 1])

    expect(mockCreateMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        task_id: MOCK_TASK_ID_1,
        project_id: MOCK_PROJECT_ID,
        title: '새 서브태스크',
      }),
      expect.anything(),
    )
  })

  it('canEdit=false일 때 추가 버튼이 없다', () => {
    renderWithProviders(
      <SubtaskSection taskId={MOCK_TASK_ID_1} projectId={MOCK_PROJECT_ID} canEdit={false} />,
    )
    expect(screen.queryByRole('button', { name: /추가/ })).not.toBeInTheDocument()
  })
})
