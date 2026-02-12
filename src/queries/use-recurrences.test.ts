import { describe, it, expect, vi } from 'vitest'

vi.mock('@/components/providers/supabase-provider', () => ({
  useSupabase: vi.fn(() => ({})),
}))

vi.mock('@/services/recurrence-service', () => ({
  getRecurrence: vi.fn(),
  getProjectRecurrenceTaskIds: vi.fn(),
  createRecurrence: vi.fn(),
  updateRecurrence: vi.fn(),
  deleteRecurrence: vi.fn(),
}))

describe('use-recurrences', () => {
  it('should export recurrenceKeys', async () => {
    const { recurrenceKeys } = await import('./use-recurrences')
    expect(recurrenceKeys.detail('task-1')).toEqual(['recurrence', 'task-1'])
    expect(recurrenceKeys.project('proj-1')).toEqual(['recurrence-tasks', 'proj-1'])
  })
})
