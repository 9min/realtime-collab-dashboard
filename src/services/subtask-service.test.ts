import { describe, it, expect } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database'
import { createMockSupabaseClient } from '@/__tests__/helpers/mock-supabase'
import { MOCK_USER_ID, MOCK_PROJECT_ID, MOCK_TASK_ID_1 } from '@/__tests__/helpers/fixtures'

import { getSubtasks, createSubtask, updateSubtask, deleteSubtask } from './subtask-service'

type Client = SupabaseClient<Database>

const mockSubtask = {
  id: 'subtask-aaa-111',
  task_id: MOCK_TASK_ID_1,
  project_id: MOCK_PROJECT_ID,
  title: 'Write tests',
  completed: false,
  position: 0,
  created_by: MOCK_USER_ID,
  created_at: '2026-01-15T10:00:00Z',
  updated_at: '2026-01-15T10:00:00Z',
}

describe('subtask-service', () => {
  describe('getSubtasks', () => {
    it('태스크의 서브태스크 목록을 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: [mockSubtask], error: null }],
      }) as Client

      const result = await getSubtasks(client, MOCK_TASK_ID_1)

      expect(result.error).toBeNull()
      expect(result.data).toEqual([mockSubtask])
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'PGRST301', message: 'DB error' } }],
      }) as Client

      const result = await getSubtasks(client, MOCK_TASK_ID_1)

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('PGRST301')
    })
  })

  describe('createSubtask', () => {
    it('서브태스크를 생성하고 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: mockSubtask, error: null }],
      }) as Client

      const result = await createSubtask(client, {
        task_id: MOCK_TASK_ID_1,
        project_id: MOCK_PROJECT_ID,
        title: 'Write tests',
        position: 0,
        created_by: MOCK_USER_ID,
      })

      expect(result.error).toBeNull()
      expect(result.data).toEqual(mockSubtask)
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: '23505', message: 'Duplicate' } }],
      }) as Client

      const result = await createSubtask(client, {
        task_id: MOCK_TASK_ID_1,
        project_id: MOCK_PROJECT_ID,
        title: 'Write tests',
        position: 0,
        created_by: MOCK_USER_ID,
      })

      expect(result.data).toBeNull()
      expect(result.error).not.toBeNull()
    })

    it('data가 null이면 UNKNOWN 에러를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: null }],
      }) as Client

      const result = await createSubtask(client, {
        task_id: MOCK_TASK_ID_1,
        project_id: MOCK_PROJECT_ID,
        title: 'Write tests',
        position: 0,
        created_by: MOCK_USER_ID,
      })

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('UNKNOWN')
    })
  })

  describe('updateSubtask', () => {
    it('서브태스크를 수정하고 반환한다', async () => {
      const updated = { ...mockSubtask, completed: true }
      const client = createMockSupabaseClient({
        fromResponses: [{ data: updated, error: null }],
      }) as Client

      const result = await updateSubtask(client, mockSubtask.id, { completed: true })

      expect(result.error).toBeNull()
      expect(result.data?.completed).toBe(true)
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'PGRST204', message: 'Not found' } }],
      }) as Client

      const result = await updateSubtask(client, 'nonexistent', { completed: true })

      expect(result.data).toBeNull()
      expect(result.error).not.toBeNull()
    })
  })

  describe('deleteSubtask', () => {
    it('서브태스크를 삭제한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: null }],
      }) as Client

      const result = await deleteSubtask(client, mockSubtask.id)

      expect(result.error).toBeNull()
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'PGRST301', message: 'Delete failed' } }],
      }) as Client

      const result = await deleteSubtask(client, 'nonexistent')

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('PGRST301')
    })
  })
})
