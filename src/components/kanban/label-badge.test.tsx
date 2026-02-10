import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'

import { renderWithProviders } from '@/__tests__/helpers/render-with-providers'
import { mockLabels } from '@/__tests__/helpers/fixtures'

import { LabelBadge } from './label-badge'

describe('LabelBadge', () => {
  it('라벨 이름을 렌더링한다', () => {
    renderWithProviders(<LabelBadge label={mockLabels[0]} />)
    expect(screen.getByText('Bug')).toBeInTheDocument()
  })

  it('라벨 색상을 스타일로 적용한다', () => {
    renderWithProviders(<LabelBadge label={mockLabels[0]} />)
    const badge = screen.getByText('Bug')
    expect(badge).toHaveStyle({ color: '#EF4444' })
    expect(badge).toHaveStyle({ backgroundColor: '#EF444425' })
  })

  it('sm 사이즈일 때 작은 패딩/폰트를 적용한다', () => {
    renderWithProviders(<LabelBadge label={mockLabels[0]} size="sm" />)
    const badge = screen.getByText('Bug')
    expect(badge.className).toContain('px-1.5')
    expect(badge.className).toContain('text-[10px]')
  })

  it('md 사이즈(기본)일 때 보통 패딩/폰트를 적용한다', () => {
    renderWithProviders(<LabelBadge label={mockLabels[0]} />)
    const badge = screen.getByText('Bug')
    expect(badge.className).toContain('px-2')
    expect(badge.className).toContain('text-xs')
  })

  it('추가 className을 적용할 수 있다', () => {
    renderWithProviders(<LabelBadge label={mockLabels[0]} className="my-custom" />)
    const badge = screen.getByText('Bug')
    expect(badge.className).toContain('my-custom')
  })
})
