import { describe, it, expect, vi } from 'vitest'

vi.mock('@/components/providers/supabase-provider', () => ({
  useSupabase: vi.fn(() => ({})),
}))

vi.mock('@/services/my-tasks-service', () => ({
  getMyTasks: vi.fn(),
}))

describe('use-my-tasks', () => {
  it('should export myTaskKeys', async () => {
    const { myTaskKeys } = await import('./use-my-tasks')
    expect(myTaskKeys.list('user-1')).toEqual(['my-tasks', 'user-1'])
  })
})
