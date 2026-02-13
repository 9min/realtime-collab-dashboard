import { describe, it, expect } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database'
import { createMockSupabaseClient } from '@/__tests__/helpers/mock-supabase'
import { MOCK_PROJECT_ID, MOCK_USER_ID } from '@/__tests__/helpers/fixtures'

import { getSprints, createSprint, updateSprint, deleteSprint, startSprint } from './sprint-service'

type Client = SupabaseClient<Database>

const mockSprint = {
  id: 'sprint-aaa-111',
  project_id: MOCK_PROJECT_ID,
  name: 'Sprint 1',
  goal: '첫 번째 스프린트 목표',
  start_date: '2026-02-01',
  end_date: '2026-02-14',
  status: 'planned' as const,
  created_by: MOCK_USER_ID,
  completed_at: null,
  created_at: '2026-01-15T10:00:00Z',
  updated_at: '2026-01-15T10:00:00Z',
}

describe('sprint-service', () => {
  describe('getSprints', () => {
    it('프로젝트의 스프린트 목록을 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [
          { data: [mockSprint], error: null },
          { data: [], error: null },
          { data: [], error: null },
        ],
      }) as Client

      const result = await getSprints(client, MOCK_PROJECT_ID)

      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(1)
      expect(result.data?.[0].name).toBe('Sprint 1')
      expect(result.data?.[0].totalTasks).toBe(0)
      expect(result.data?.[0].completedTasks).toBe(0)
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'PGRST301', message: 'DB error' } }],
      }) as Client

      const result = await getSprints(client, MOCK_PROJECT_ID)

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('PGRST301')
    })
  })

  describe('createSprint', () => {
    it('스프린트를 생성하고 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: mockSprint, error: null }],
      }) as Client

      const result = await createSprint(client, {
        project_id: MOCK_PROJECT_ID,
        name: 'Sprint 1',
        goal: '첫 번째 스프린트 목표',
        start_date: '2026-02-01',
        end_date: '2026-02-14',
        created_by: MOCK_USER_ID,
      })

      expect(result.error).toBeNull()
      expect(result.data).toEqual(mockSprint)
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: '23505', message: 'Duplicate' } }],
      }) as Client

      const result = await createSprint(client, {
        project_id: MOCK_PROJECT_ID,
        name: 'Sprint 1',
        start_date: '2026-02-01',
        end_date: '2026-02-14',
        created_by: MOCK_USER_ID,
      })

      expect(result.data).toBeNull()
      expect(result.error).not.toBeNull()
    })
  })

  describe('updateSprint', () => {
    it('스프린트를 수정하고 반환한다', async () => {
      const updated = { ...mockSprint, name: 'Sprint 1 (수정)' }
      const client = createMockSupabaseClient({
        fromResponses: [{ data: updated, error: null }],
      }) as Client

      const result = await updateSprint(client, mockSprint.id, { name: 'Sprint 1 (수정)' })

      expect(result.error).toBeNull()
      expect(result.data?.name).toBe('Sprint 1 (수정)')
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'PGRST204', message: 'Not found' } }],
      }) as Client

      const result = await updateSprint(client, 'nonexistent', { name: 'X' })

      expect(result.data).toBeNull()
      expect(result.error).not.toBeNull()
    })
  })

  describe('deleteSprint', () => {
    it('스프린트를 삭제한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: null }],
      }) as Client

      const result = await deleteSprint(client, mockSprint.id)

      expect(result.error).toBeNull()
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'PGRST301', message: 'Delete failed' } }],
      }) as Client

      const result = await deleteSprint(client, 'nonexistent')

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('PGRST301')
    })
  })

  describe('startSprint', () => {
    it('스프린트를 시작한다', async () => {
      const started = { ...mockSprint, status: 'active' as const }
      const client = createMockSupabaseClient({
        fromResponses: [{ data: started, error: null }],
      }) as Client

      const result = await startSprint(client, mockSprint.id)

      expect(result.error).toBeNull()
      expect(result.data?.status).toBe('active')
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: '23505', message: 'Active sprint exists' } }],
      }) as Client

      const result = await startSprint(client, mockSprint.id)

      expect(result.data).toBeNull()
      expect(result.error).not.toBeNull()
    })
  })
})
