import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FolderOpen, Search } from 'lucide-react'

import { renderWithProviders } from '@/__tests__/helpers/render-with-providers'

import { EmptyState } from './empty-state'

describe('EmptyState', () => {
  it('아이콘을 렌더링한다', () => {
    const { container } = renderWithProviders(
      <EmptyState icon={FolderOpen} title="비어 있음" />,
    )

    // lucide icons render as svg
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('타이틀을 렌더링한다', () => {
    renderWithProviders(
      <EmptyState icon={FolderOpen} title="프로젝트가 없습니다" />,
    )

    expect(screen.getByText('프로젝트가 없습니다')).toBeInTheDocument()
  })

  it('설명 텍스트를 렌더링한다', () => {
    renderWithProviders(
      <EmptyState
        icon={FolderOpen}
        title="프로젝트가 없습니다"
        description="새 프로젝트를 만들어 보세요"
      />,
    )

    expect(screen.getByText('새 프로젝트를 만들어 보세요')).toBeInTheDocument()
  })

  it('설명이 없으면 설명 영역을 렌더링하지 않는다', () => {
    renderWithProviders(
      <EmptyState icon={FolderOpen} title="비어 있음" />,
    )

    // Only the title paragraph should exist, no description
    const paragraphs = screen.getAllByText(/.+/)
    expect(paragraphs).toHaveLength(1)
    expect(paragraphs[0]).toHaveTextContent('비어 있음')
  })

  it('action이 제공되면 버튼을 렌더링한다', () => {
    const handleClick = vi.fn()
    renderWithProviders(
      <EmptyState
        icon={FolderOpen}
        title="비어 있음"
        action={{ label: '프로젝트 만들기', onClick: handleClick }}
      />,
    )

    expect(screen.getByRole('button', { name: '프로젝트 만들기' })).toBeInTheDocument()
  })

  it('action 버튼 클릭 시 onClick을 호출한다', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    renderWithProviders(
      <EmptyState
        icon={FolderOpen}
        title="비어 있음"
        action={{ label: '생성하기', onClick: handleClick }}
      />,
    )

    await user.click(screen.getByRole('button', { name: '생성하기' }))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('action이 없으면 버튼을 렌더링하지 않는다', () => {
    renderWithProviders(
      <EmptyState icon={FolderOpen} title="비어 있음" />,
    )

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('다른 아이콘을 전달할 수 있다', () => {
    const { container } = renderWithProviders(
      <EmptyState icon={Search} title="검색 결과 없음" />,
    )

    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('추가 className을 적용할 수 있다', () => {
    const { container } = renderWithProviders(
      <EmptyState icon={FolderOpen} title="비어 있음" className="min-h-[400px]" />,
    )

    const wrapper = container.firstElementChild
    expect(wrapper).toHaveClass('min-h-[400px]')
  })
})
