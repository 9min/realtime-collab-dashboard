import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/hooks/use-auth', () => ({
  useAuth: vi.fn(() => ({ user: { id: 'user-1' } })),
}))

vi.mock('@/queries/use-recurrences', () => ({
  useRecurrence: vi.fn(() => ({ data: null, isLoading: false })),
  useCreateRecurrence: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useUpdateRecurrence: vi.fn(() => ({ mutate: vi.fn() })),
  useDeleteRecurrence: vi.fn(() => ({ mutate: vi.fn() })),
}))

describe('RecurrenceSection', () => {
  it('should show add button when no recurrence and can edit', async () => {
    const { RecurrenceSection } = await import('./recurrence-section')
    render(<RecurrenceSection taskId="task-1" projectId="proj-1" canEdit={true} />)
    expect(screen.getByText('반복 추가')).toBeDefined()
  })

  it('should show no recurrence text when cannot edit', async () => {
    const { RecurrenceSection } = await import('./recurrence-section')
    render(<RecurrenceSection taskId="task-1" projectId="proj-1" canEdit={false} />)
    expect(screen.getByText('반복 설정 없음')).toBeDefined()
  })

  it('should show recurrence info when exists', async () => {
    const { useRecurrence } = await import('@/queries/use-recurrences')
    vi.mocked(useRecurrence).mockReturnValue({
      data: {
        id: 'rec-1',
        task_id: 'task-1',
        project_id: 'proj-1',
        frequency: 'weekly',
        interval_value: 1,
        day_of_week: 1,
        day_of_month: null,
        next_due_date: '2025-06-01',
        is_active: true,
        created_by: 'user-1',
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
      },
      isLoading: false,
    } as never)

    const { RecurrenceSection } = await import('./recurrence-section')
    render(<RecurrenceSection taskId="task-1" projectId="proj-1" canEdit={true} />)
    expect(screen.getByText(/매주/)).toBeDefined()
  })
})
