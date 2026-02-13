import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'

import { renderWithProviders } from '@/__tests__/helpers/render-with-providers'

const mockUseBurndownChart = vi.fn()

vi.mock('@/queries/use-chart-data', () => ({
  useBurndownChart: (...args: unknown[]) => mockUseBurndownChart(...args),
}))

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ComposedChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="composed-chart">{children}</div>
  ),
  Area: () => null,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}))

import { BurndownChart } from './burndown-chart'

describe('BurndownChart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('로딩 상태를 렌더링한다', () => {
    mockUseBurndownChart.mockReturnValue({
      data: undefined,
      isLoading: true,
    })

    const { container } = renderWithProviders(<BurndownChart projectId="project-1" />)

    const skeleton = container.querySelector('.animate-pulse')
    expect(skeleton).toBeInTheDocument()
  })

  it('데이터가 있으면 차트를 렌더링한다', () => {
    mockUseBurndownChart.mockReturnValue({
      data: [
        { date: '1/1', ideal: 20, remaining: 20 },
        { date: '1/8', ideal: 15, remaining: 17 },
        { date: '1/15', ideal: 10, remaining: 12 },
        { date: '1/22', ideal: 5, remaining: 8 },
      ],
      isLoading: false,
    })

    renderWithProviders(<BurndownChart projectId="project-1" />)

    expect(screen.getByTestId('composed-chart')).toBeInTheDocument()
    // Custom legend labels
    expect(screen.getByText('남은 태스크')).toBeInTheDocument()
    expect(screen.getByText('이상적 진행')).toBeInTheDocument()
  })

  it('데이터가 비어 있으면 빈 상태를 표시한다', () => {
    mockUseBurndownChart.mockReturnValue({
      data: [],
      isLoading: false,
    })

    renderWithProviders(<BurndownChart projectId="project-1" />)

    expect(screen.getByText('태스크가 없습니다')).toBeInTheDocument()
  })

  it('data가 null/undefined이면 빈 상태를 표시한다', () => {
    mockUseBurndownChart.mockReturnValue({
      data: undefined,
      isLoading: false,
    })

    renderWithProviders(<BurndownChart projectId="project-1" />)

    expect(screen.getByText('태스크가 없습니다')).toBeInTheDocument()
  })
})
