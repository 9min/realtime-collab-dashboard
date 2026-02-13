import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'

import { renderWithProviders } from '@/__tests__/helpers/render-with-providers'

const mockUseWeeklyProgressChart = vi.fn()

vi.mock('@/queries/use-chart-data', () => ({
  useWeeklyProgressChart: (...args: unknown[]) => mockUseWeeklyProgressChart(...args),
}))

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}))

import { WeeklyProgressChart } from './weekly-progress-chart'

describe('WeeklyProgressChart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('로딩 상태를 렌더링한다', () => {
    mockUseWeeklyProgressChart.mockReturnValue({
      data: undefined,
      isLoading: true,
    })

    const { container } = renderWithProviders(<WeeklyProgressChart projectId="project-1" />)

    const skeleton = container.querySelector('.animate-pulse')
    expect(skeleton).toBeInTheDocument()
  })

  it('데이터가 있으면 차트를 렌더링한다', () => {
    mockUseWeeklyProgressChart.mockReturnValue({
      data: [
        { date: '1/6', created: 5, completed: 3 },
        { date: '1/13', created: 4, completed: 6 },
        { date: '1/20', created: 7, completed: 2 },
      ],
      isLoading: false,
    })

    renderWithProviders(<WeeklyProgressChart projectId="project-1" />)

    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    // Custom legend labels
    expect(screen.getByText('생성')).toBeInTheDocument()
    expect(screen.getByText('완료')).toBeInTheDocument()
  })

  it('데이터가 비어 있으면 빈 상태를 표시한다', () => {
    mockUseWeeklyProgressChart.mockReturnValue({
      data: [],
      isLoading: false,
    })

    renderWithProviders(<WeeklyProgressChart projectId="project-1" />)

    expect(screen.getByText('데이터가 없습니다')).toBeInTheDocument()
  })

  it('data가 null/undefined이면 빈 상태를 표시한다', () => {
    mockUseWeeklyProgressChart.mockReturnValue({
      data: undefined,
      isLoading: false,
    })

    renderWithProviders(<WeeklyProgressChart projectId="project-1" />)

    expect(screen.getByText('데이터가 없습니다')).toBeInTheDocument()
  })
})
