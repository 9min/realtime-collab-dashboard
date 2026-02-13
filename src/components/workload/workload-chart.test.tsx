import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}))

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => null,
  CartesianGrid: () => null,
  ReferenceLine: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  Cell: () => null,
}))

describe('WorkloadChart', () => {
  it('should show empty message when no data', async () => {
    const { WorkloadChart } = await import('./workload-chart')
    render(<WorkloadChart data={[]} projectId="proj-1" />)
    expect(screen.getByText('멤버 데이터가 없습니다')).toBeDefined()
  })

  it('should render chart when data exists', async () => {
    const { WorkloadChart } = await import('./workload-chart')
    const data = [
      {
        userId: 'u1',
        userName: 'Alice',
        avatarUrl: null,
        tasksByPriority: { low: 1, medium: 2, high: 1, urgent: 0 },
        totalTasks: 4,
      },
    ]
    render(<WorkloadChart data={data} projectId="proj-1" />)
    expect(screen.getByTestId('bar-chart')).toBeDefined()
  })
})
