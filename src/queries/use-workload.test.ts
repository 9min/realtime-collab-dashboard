import { describe, it, expect, vi } from 'vitest'

vi.mock('@/components/providers/supabase-provider', () => ({
  useSupabase: vi.fn(() => ({})),
}))

vi.mock('@/services/workload-service', () => ({
  getWorkload: vi.fn(),
}))

describe('use-workload', () => {
  it('should export workloadKeys', async () => {
    const { workloadKeys } = await import('./use-workload')
    expect(workloadKeys.detail('proj-1')).toEqual(['workload', 'proj-1'])
  })
})
