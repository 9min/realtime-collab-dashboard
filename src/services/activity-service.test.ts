import { describe, it, expect } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database'
import { createMockSupabaseClient } from '@/__tests__/helpers/mock-supabase'
import { MOCK_PROJECT_ID, mockActivityLog } from '@/__tests__/helpers/fixtures'

import { getActivityLogs, getActivityLogsPaginated } from './activity-service'

type Client = SupabaseClient<Database>

describe('activity-service', () => {
  describe('getActivityLogs', () => {
    it('프로젝트의 활동 로그를 반환한다', async () => {
      const logs = [mockActivityLog]
      const client = createMockSupabaseClient({
        fromResponses: [{ data: logs, error: null }],
      }) as Client

      const result = await getActivityLogs(client, MOCK_PROJECT_ID)

      expect(result.error).toBeNull()
      expect(result.data).toEqual(logs)
    })

    it('커스텀 limit/offset을 전달할 수 있다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: [], error: null }],
      }) as Client

      const result = await getActivityLogs(client, MOCK_PROJECT_ID, { limit: 10, offset: 5 })

      expect(result.error).toBeNull()
      expect(result.data).toEqual([])
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'PGRST116', message: 'DB error' } }],
      }) as Client

      const result = await getActivityLogs(client, MOCK_PROJECT_ID)

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('PGRST116')
    })
  })

  describe('getActivityLogsPaginated', () => {
    it('첫 페이지를 반환하고 hasMore 확인', async () => {
      const logs = Array.from({ length: 31 }, (_, i) => ({
        ...mockActivityLog,
        id: `log-${i}`,
        created_at: `2026-01-${String(31 - i).padStart(2, '0')}T00:00:00Z`,
      }))

      const client = createMockSupabaseClient({
        fromResponses: [{ data: logs, error: null }],
      }) as Client

      const result = await getActivityLogsPaginated(client, MOCK_PROJECT_ID)

      expect(result.error).toBeNull()
      expect(result.data!.data).toHaveLength(30)
      expect(result.data!.hasMore).toBe(true)
      expect(result.data!.nextCursor).toBeDefined()
    })

    it('마지막 페이지에서 hasMore=false', async () => {
      const logs = [mockActivityLog]
      const client = createMockSupabaseClient({
        fromResponses: [{ data: logs, error: null }],
      }) as Client

      const result = await getActivityLogsPaginated(client, MOCK_PROJECT_ID)

      expect(result.error).toBeNull()
      expect(result.data!.data).toHaveLength(1)
      expect(result.data!.hasMore).toBe(false)
      expect(result.data!.nextCursor).toBeNull()
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'PGRST116', message: 'DB error' } }],
      }) as Client

      const result = await getActivityLogsPaginated(client, MOCK_PROJECT_ID)

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('PGRST116')
    })
  })
})
