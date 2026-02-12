import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '@/__tests__/helpers/render-with-providers'

const mockSetOpen = vi.fn()
const mockReset = vi.fn()

vi.mock('@/components/providers/supabase-provider', () => ({
  useSupabase: () => ({}),
}))

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}))

vi.mock('@/queries/use-favorites', () => ({
  useFavoriteIds: () => ({ data: new Set() }),
}))

vi.mock('@/stores/search-store', () => ({
  useSearchStore: () => ({
    isOpen: true,
    setOpen: mockSetOpen,
    reset: mockReset,
  }),
}))

const mockSearchResults = {
  projects: [
    { id: 'p1', name: 'My Project Alpha', description: 'A project' },
  ],
  tasks: [
    { id: 't1', title: 'Fix critical bug', projectId: 'p1', projectName: 'Beta Project' },
  ],
  comments: [
    { id: 'c1', content: 'Nice work here', taskId: 't1', taskTitle: 'Some task', projectId: 'p1' },
  ],
}

vi.mock('@/queries/use-search', () => ({
  useSearch: (query: string) => {
    if (query.length < 2) {
      return { data: undefined, isLoading: false }
    }
    return { data: mockSearchResults, isLoading: false }
  },
}))

import { SearchCommand } from './search-command'

describe('SearchCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('검색 다이얼로그를 렌더링한다', () => {
    renderWithProviders(<SearchCommand />)
    expect(screen.getByPlaceholderText('프로젝트, 태스크, 댓글 검색...')).toBeInTheDocument()
  })

  it('2글자 미만 입력 시 안내 문구를 표시한다', () => {
    renderWithProviders(<SearchCommand />)
    expect(screen.getByText('2글자 이상 입력해주세요')).toBeInTheDocument()
  })

  it('검색 결과를 그룹별로 렌더링한다', async () => {
    const user = userEvent.setup()

    renderWithProviders(<SearchCommand />)
    const input = screen.getByPlaceholderText('프로젝트, 태스크, 댓글 검색...')
    await user.type(input, 'test')

    expect(screen.getByText('My Project Alpha')).toBeInTheDocument()
    expect(screen.getByText('Fix critical bug')).toBeInTheDocument()
    expect(screen.getByText('Nice work here')).toBeInTheDocument()
  })

  it('프로젝트 그룹 헤딩을 표시한다', async () => {
    const user = userEvent.setup()

    renderWithProviders(<SearchCommand />)
    const input = screen.getByPlaceholderText('프로젝트, 태스크, 댓글 검색...')
    await user.type(input, 'test')

    expect(screen.getByText('프로젝트')).toBeInTheDocument()
    expect(screen.getByText('태스크')).toBeInTheDocument()
    expect(screen.getByText('댓글')).toBeInTheDocument()
  })
})
