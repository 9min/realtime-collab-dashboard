import { describe, it, expect } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database'
import { createMockSupabaseClient } from '@/__tests__/helpers/mock-supabase'
import { MOCK_PROJECT_ID, MOCK_TASK_ID_1, MOCK_USER_ID } from '@/__tests__/helpers/fixtures'

import {
  getTimeEntriesByTask,
  createTimeEntry,
  updateTimeEntry,
  deleteTimeEntry,
} from './time-entry-service'

type Client = SupabaseClient<Database>

const mockTimeEntry = {
  id: 'time-entry-001',
  task_id: MOCK_TASK_ID_1,
  project_id: MOCK_PROJECT_ID,
  user_id: MOCK_USER_ID,
  duration_minutes: 60,
  description: '기능 구현',
  started_at: '2026-01-15T09:00:00Z',
  ended_at: '2026-01-15T10:00:00Z',
  created_at: '2026-01-15T10:00:00Z',
  updated_at: '2026-01-15T10:00:00Z',
}

describe('time-entry-service', () => {
  describe('getTimeEntriesByTask', () => {
    it('태스크의 시간 기록 목록을 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: [mockTimeEntry], error: null }],
      }) as Client

      const result = await getTimeEntriesByTask(client, MOCK_TASK_ID_1)

      expect(result.error).toBeNull()
      expect(result.data).toEqual([mockTimeEntry])
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'PGRST301', message: 'DB error' } }],
      }) as Client

      const result = await getTimeEntriesByTask(client, MOCK_TASK_ID_1)

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('PGRST301')
    })
  })

  describe('createTimeEntry', () => {
    it('시간 기록을 생성하고 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: mockTimeEntry, error: null }],
      }) as Client

      const result = await createTimeEntry(client, {
        task_id: MOCK_TASK_ID_1,
        project_id: MOCK_PROJECT_ID,
        user_id: MOCK_USER_ID,
        duration_minutes: 60,
        description: '기능 구현',
      })

      expect(result.error).toBeNull()
      expect(result.data).toEqual(mockTimeEntry)
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: '23503', message: 'FK violation' } }],
      }) as Client

      const result = await createTimeEntry(client, {
        task_id: MOCK_TASK_ID_1,
        project_id: MOCK_PROJECT_ID,
        user_id: MOCK_USER_ID,
        duration_minutes: 60,
      })

      expect(result.data).toBeNull()
      expect(result.error).not.toBeNull()
    })
  })

  describe('updateTimeEntry', () => {
    it('시간 기록을 수정하고 반환한다', async () => {
      const updated = { ...mockTimeEntry, duration_minutes: 90 }
      const client = createMockSupabaseClient({
        fromResponses: [{ data: updated, error: null }],
      }) as Client

      const result = await updateTimeEntry(client, mockTimeEntry.id, { duration_minutes: 90 })

      expect(result.error).toBeNull()
      expect(result.data?.duration_minutes).toBe(90)
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'PGRST204', message: 'Not found' } }],
      }) as Client

      const result = await updateTimeEntry(client, 'nonexistent', { duration_minutes: 30 })

      expect(result.data).toBeNull()
      expect(result.error).not.toBeNull()
    })
  })

  describe('deleteTimeEntry', () => {
    it('시간 기록을 삭제한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: null }],
      }) as Client

      const result = await deleteTimeEntry(client, mockTimeEntry.id)

      expect(result.error).toBeNull()
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'PGRST301', message: 'Delete failed' } }],
      }) as Client

      const result = await deleteTimeEntry(client, 'nonexistent')

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('PGRST301')
    })
  })
})
