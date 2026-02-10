import { describe, it, expect, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database'

import { getProjectIntegrations, upsertIntegration, deleteIntegration, toggleIntegration } from './integration-service'

function createMockSupabase(overrides: Record<string, unknown> = {}) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    ...overrides,
  }

  return {
    from: vi.fn().mockReturnValue(chain),
  } as unknown as SupabaseClient<Database>
}

const MOCK_INTEGRATION = {
  id: 'int-1',
  project_id: 'proj-1',
  type: 'slack',
  config: { webhookUrl: 'https://hooks.slack.com/test', events: ['task_created'] },
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

describe('integration-service', () => {
  describe('getProjectIntegrations', () => {
    it('returns integration list on success', async () => {
      const supabase = createMockSupabase({
        order: vi.fn().mockResolvedValue({
          data: [MOCK_INTEGRATION],
          error: null,
        }),
      })

      const result = await getProjectIntegrations(supabase, 'proj-1')

      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(1)
      expect(result.data?.[0].id).toBe('int-1')
      expect(supabase.from).toHaveBeenCalledWith('project_integrations')
    })

    it('returns error on failure', async () => {
      const supabase = createMockSupabase({
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST000', message: 'DB error' },
        }),
      })

      const result = await getProjectIntegrations(supabase, 'proj-1')

      expect(result.data).toBeNull()
      expect(result.error).toEqual({ code: 'PGRST000', message: 'DB error' })
    })
  })

  describe('upsertIntegration', () => {
    it('creates or updates an integration', async () => {
      const supabase = createMockSupabase({
        single: vi.fn().mockResolvedValue({
          data: MOCK_INTEGRATION,
          error: null,
        }),
      })

      const result = await upsertIntegration(
        supabase,
        'proj-1',
        'slack',
        { webhookUrl: 'https://hooks.slack.com/test', events: ['task_created'] },
      )

      expect(result.error).toBeNull()
      expect(result.data?.id).toBe('int-1')
      expect(supabase.from).toHaveBeenCalledWith('project_integrations')
    })

    it('returns error on failure', async () => {
      const supabase = createMockSupabase({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: '23505', message: 'Duplicate' },
        }),
      })

      const result = await upsertIntegration(
        supabase,
        'proj-1',
        'slack',
        { webhookUrl: 'https://hooks.slack.com/test', events: ['task_created'] },
      )

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('23505')
    })
  })

  describe('deleteIntegration', () => {
    it('removes an integration', async () => {
      const supabase = createMockSupabase({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })

      const result = await deleteIntegration(supabase, 'int-1')

      expect(result.error).toBeNull()
      expect(result.data).toBeNull()
    })

    it('returns error on failure', async () => {
      const supabase = createMockSupabase({
        eq: vi.fn().mockResolvedValue({
          error: { code: 'PGRST000', message: 'Not found' },
        }),
      })

      const result = await deleteIntegration(supabase, 'int-1')

      expect(result.data).toBeNull()
      expect(result.error?.message).toBe('Not found')
    })
  })

  describe('toggleIntegration', () => {
    it('toggles is_active', async () => {
      const supabase = createMockSupabase({
        single: vi.fn().mockResolvedValue({
          data: { ...MOCK_INTEGRATION, is_active: false },
          error: null,
        }),
      })

      const result = await toggleIntegration(supabase, 'int-1', false)

      expect(result.error).toBeNull()
      expect(result.data?.is_active).toBe(false)
    })

    it('returns error on failure', async () => {
      const supabase = createMockSupabase({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST000', message: 'Toggle failed' },
        }),
      })

      const result = await toggleIntegration(supabase, 'int-1', true)

      expect(result.data).toBeNull()
      expect(result.error?.message).toBe('Toggle failed')
    })
  })
})
