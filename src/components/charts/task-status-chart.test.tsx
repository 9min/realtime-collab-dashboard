import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'

import { renderWithProviders } from '@/__tests__/helpers/render-with-providers'

const mockUseTaskStatusChart = vi.fn()

vi.mock('@/queries/use-chart-data', () => ({
  useTaskStatusChart: (...args: unknown[]) => mockUseTaskStatusChart(...args),
}))

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Cell: () => null,
  Tooltip: () => null,
}))

import { TaskStatusChart } from './task-status-chart'

describe('TaskStatusChart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('로딩 상태를 렌더링한다', () => {
    mockUseTaskStatusChart.mockReturnValue({
      data: undefined,
      isLoading: true,
    })

    const { container } = renderWithProviders(<TaskStatusChart projectId="project-1" />)

    // ChartSkeleton renders a pulsing circle
    const skeleton = container.querySelector('.animate-pulse')
    expect(skeleton).toBeInTheDocument()
  })

  it('데이터가 있으면 차트를 렌더링한다', () => {
    mockUseTaskStatusChart.mockReturnValue({
      data: [
        { name: '할 일', value: 5, color: '#6366f1' },
        { name: '진행 중', value: 3, color: '#f59e0b' },
        { name: '완료', value: 8, color: '#10b981' },
      ],
      isLoading: false,
    })

    renderWithProviders(<TaskStatusChart projectId="project-1" />)

    expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
    // Custom legend items
    expect(screen.getByText('할 일')).toBeInTheDocument()
    expect(screen.getByText('진행 중')).toBeInTheDocument()
    expect(screen.getByText('완료')).toBeInTheDocument()
    // Value counts in legend
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
  })

  it('데이터가 비어 있으면 빈 상태를 표시한다', () => {
    mockUseTaskStatusChart.mockReturnValue({
      data: [],
      isLoading: false,
    })

    renderWithProviders(<TaskStatusChart projectId="project-1" />)

    expect(screen.getByText('태스크가 없습니다')).toBeInTheDocument()
  })

  it('모든 값이 0이면 빈 상태를 표시한다', () => {
    mockUseTaskStatusChart.mockReturnValue({
      data: [
        { name: '할 일', value: 0, color: '#6366f1' },
        { name: '완료', value: 0, color: '#10b981' },
      ],
      isLoading: false,
    })

    renderWithProviders(<TaskStatusChart projectId="project-1" />)

    expect(screen.getByText('태스크가 없습니다')).toBeInTheDocument()
  })

  it('data가 null/undefined이면 빈 상태를 표시한다', () => {
    mockUseTaskStatusChart.mockReturnValue({
      data: undefined,
      isLoading: false,
    })

    renderWithProviders(<TaskStatusChart projectId="project-1" />)

    expect(screen.getByText('태스크가 없습니다')).toBeInTheDocument()
  })
})
