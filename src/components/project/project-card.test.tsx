import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'

import { renderWithProviders } from '@/__tests__/helpers/render-with-providers'
import { mockProject, MOCK_PROJECT_ID } from '@/__tests__/helpers/fixtures'
import type { ProjectWithMemberCount } from '@/services/project-service'

import { ProjectCard } from './project-card'

function createProject(overrides: Partial<ProjectWithMemberCount> = {}): ProjectWithMemberCount {
  return {
    ...mockProject,
    member_count: 5,
    current_user_role: 'member',
    ...overrides,
  }
}

describe('ProjectCard', () => {
  const mockOnEdit = vi.fn()
  const mockOnDelete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('프로젝트 이름을 렌더링한다', () => {
    const project = createProject()
    renderWithProviders(
      <ProjectCard project={project} onEdit={mockOnEdit} onDelete={mockOnDelete} />,
    )

    expect(screen.getByText('Test Project')).toBeInTheDocument()
  })

  it('프로젝트 설명을 렌더링한다', () => {
    const project = createProject({ description: 'My project description' })
    renderWithProviders(
      <ProjectCard project={project} onEdit={mockOnEdit} onDelete={mockOnDelete} />,
    )

    expect(screen.getByText('My project description')).toBeInTheDocument()
  })

  it('설명이 없으면 "설명 없음"을 표시한다', () => {
    const project = createProject({ description: null })
    renderWithProviders(
      <ProjectCard project={project} onEdit={mockOnEdit} onDelete={mockOnDelete} />,
    )

    expect(screen.getByText('설명 없음')).toBeInTheDocument()
  })

  it('멤버 수를 표시한다', () => {
    const project = createProject({ member_count: 7 })
    renderWithProviders(
      <ProjectCard project={project} onEdit={mockOnEdit} onDelete={mockOnDelete} />,
    )

    expect(screen.getByText('7명')).toBeInTheDocument()
  })

  it('카드 클릭 시 프로젝트 페이지로 이동한다', async () => {
    const user = userEvent.setup()
    const project = createProject()
    renderWithProviders(
      <ProjectCard project={project} onEdit={mockOnEdit} onDelete={mockOnDelete} />,
    )

    // Click the card (the article/div element)
    const card = screen.getByText('Test Project').closest('[class*="cursor-pointer"]')
    expect(card).not.toBeNull()
    await user.click(card!)

    const router = useRouter()
    expect(router.push).toHaveBeenCalledWith(`/projects/${MOCK_PROJECT_ID}`)
  })

  it('owner 역할일 때 소유자 뱃지를 표시한다', () => {
    const project = createProject({ current_user_role: 'owner' })
    renderWithProviders(
      <ProjectCard project={project} onEdit={mockOnEdit} onDelete={mockOnDelete} />,
    )

    expect(screen.getByText('소유자')).toBeInTheDocument()
  })

  it('admin 역할일 때 관리자 뱃지를 표시한다', () => {
    const project = createProject({ current_user_role: 'admin' })
    renderWithProviders(
      <ProjectCard project={project} onEdit={mockOnEdit} onDelete={mockOnDelete} />,
    )

    expect(screen.getByText('관리자')).toBeInTheDocument()
  })

  it('member 역할일 때 역할 뱃지를 표시하지 않는다', () => {
    const project = createProject({ current_user_role: 'member' })
    renderWithProviders(
      <ProjectCard project={project} onEdit={mockOnEdit} onDelete={mockOnDelete} />,
    )

    expect(screen.queryByText('소유자')).not.toBeInTheDocument()
    expect(screen.queryByText('관리자')).not.toBeInTheDocument()
  })

  it('owner/admin일 때 프로젝트 메뉴 버튼을 표시한다', () => {
    const project = createProject({ current_user_role: 'owner' })
    renderWithProviders(
      <ProjectCard project={project} onEdit={mockOnEdit} onDelete={mockOnDelete} />,
    )

    expect(screen.getByRole('button', { name: '프로젝트 메뉴' })).toBeInTheDocument()
  })

  it('member 역할일 때 메뉴 버튼을 표시하지 않는다', () => {
    const project = createProject({ current_user_role: 'member' })
    renderWithProviders(
      <ProjectCard project={project} onEdit={mockOnEdit} onDelete={mockOnDelete} />,
    )

    expect(screen.queryByRole('button', { name: '프로젝트 메뉴' })).not.toBeInTheDocument()
  })

  it('생성일을 포맷하여 표시한다', () => {
    const project = createProject({ created_at: '2026-01-01T00:00:00Z' })
    renderWithProviders(
      <ProjectCard project={project} onEdit={mockOnEdit} onDelete={mockOnDelete} />,
    )

    // Korean date format: 2026. 01. 01.
    expect(screen.getByText(/2026/)).toBeInTheDocument()
  })
})
