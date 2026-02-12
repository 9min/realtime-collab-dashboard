import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'

import { renderWithProviders } from '@/__tests__/helpers/render-with-providers'
import { mockProject } from '@/__tests__/helpers/fixtures'
import type { ProjectWithMemberCount } from '@/services/project-service'

// Mock return values
const mockProjectsData: ProjectWithMemberCount[] = [
  {
    ...mockProject,
    member_count: 3,
    current_user_role: 'owner',
  },
  {
    ...mockProject,
    id: 'project-bbb-222',
    name: 'Second Project',
    description: 'Another project',
    member_count: 5,
    current_user_role: 'member',
  },
]

let mockUseProjectsReturn = {
  data: mockProjectsData,
  isLoading: false,
  error: null as Error | null,
}

let mockUseMyProfileReturn = {
  data: { is_admin: true } as { is_admin: boolean } | undefined,
}

const mockDeleteMutate = vi.fn()

vi.mock('@/queries/use-projects', () => ({
  useProjects: () => mockUseProjectsReturn,
  useDeleteProject: () => ({
    mutate: mockDeleteMutate,
  }),
}))

vi.mock('@/queries/use-admin', () => ({
  useMyProfile: () => mockUseMyProfileReturn,
}))

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}))

vi.mock('@/queries/use-user-messages', () => ({
  useMyMessage: () => ({ data: null, isLoading: false }),
  useSendMessage: () => ({ mutate: vi.fn(), isPending: false }),
}))

// Mock child dialogs to simplify testing
vi.mock('./create-project-dialog', () => ({
  CreateProjectDialog: () => <button>새 프로젝트</button>,
}))

vi.mock('./edit-project-dialog', () => ({
  EditProjectDialog: () => null,
}))

import { ProjectList } from './project-list'

describe('ProjectList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseProjectsReturn = {
      data: mockProjectsData,
      isLoading: false,
      error: null,
    }
    mockUseMyProfileReturn = {
      data: { is_admin: true },
    }
  })

  it('프로젝트 카드 목록을 렌더링한다', () => {
    renderWithProviders(<ProjectList />)

    expect(screen.getByText('Test Project')).toBeInTheDocument()
    expect(screen.getByText('Second Project')).toBeInTheDocument()
  })

  it('프로젝트 수를 표시한다', () => {
    renderWithProviders(<ProjectList />)

    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('프로젝트 헤더 타이틀을 표시한다', () => {
    renderWithProviders(<ProjectList />)

    expect(screen.getByText('프로젝트')).toBeInTheDocument()
  })

  it('프로젝트가 없으면 빈 상태를 표시한다', () => {
    mockUseProjectsReturn = {
      data: [],
      isLoading: false,
      error: null,
    }

    renderWithProviders(<ProjectList />)

    expect(screen.getByText('아직 프로젝트가 없습니다')).toBeInTheDocument()
  })

  it('admin일 때 빈 상태에서 프로젝트 생성 안내 메시지를 표시한다', () => {
    mockUseProjectsReturn = {
      data: [],
      isLoading: false,
      error: null,
    }
    mockUseMyProfileReturn = {
      data: { is_admin: true },
    }

    renderWithProviders(<ProjectList />)

    expect(screen.getByText('새 프로젝트를 만들어 팀과 협업을 시작하세요')).toBeInTheDocument()
  })

  it('admin이 아닐 때 빈 상태에서 관리자 요청 메시지를 표시한다', () => {
    mockUseProjectsReturn = {
      data: [],
      isLoading: false,
      error: null,
    }
    mockUseMyProfileReturn = {
      data: { is_admin: false },
    }

    renderWithProviders(<ProjectList />)

    expect(screen.getByText('관리자에게 메시지를 보내 프로젝트 참여를 요청하세요')).toBeInTheDocument()
  })

  it('admin일 때 새 프로젝트 버튼을 표시한다', () => {
    mockUseMyProfileReturn = {
      data: { is_admin: true },
    }

    renderWithProviders(<ProjectList />)

    expect(screen.getByText('새 프로젝트')).toBeInTheDocument()
  })

  it('admin이 아닐 때 새 프로젝트 버튼을 표시하지 않는다', () => {
    mockUseMyProfileReturn = {
      data: { is_admin: false },
    }

    renderWithProviders(<ProjectList />)

    expect(screen.queryByText('새 프로젝트')).not.toBeInTheDocument()
  })

  it('로딩 중일 때 로딩 스피너를 표시한다', () => {
    mockUseProjectsReturn = {
      data: undefined as unknown as ProjectWithMemberCount[],
      isLoading: true,
      error: null,
    }

    const { container } = renderWithProviders(<ProjectList />)

    const spinner = container.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('에러 발생 시 에러 메시지를 표시한다', () => {
    mockUseProjectsReturn = {
      data: undefined as unknown as ProjectWithMemberCount[],
      isLoading: false,
      error: new Error('네트워크 오류'),
    }

    renderWithProviders(<ProjectList />)

    expect(screen.getByText('프로젝트 목록을 불러오는데 실패했습니다')).toBeInTheDocument()
    expect(screen.getByText('네트워크 오류')).toBeInTheDocument()
  })
})
