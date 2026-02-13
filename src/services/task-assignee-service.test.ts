import { describe, it, expect } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database'
import { createMockSupabaseClient } from '@/__tests__/helpers/mock-supabase'
import { MOCK_TASK_ID_1, MOCK_USER_ID, MOCK_USER_ID_2 } from '@/__tests__/helpers/fixtures'

import {
  getTaskAssignees,
  getProjectTaskAssignees,
  addTaskAssignee,
  removeTaskAssignee,
  updateTaskAssigneeRole,
} from './task-assignee-service'

type Client = SupabaseClient<Database>

const MOCK_PROJECT_ID = 'project-aaa-111'

const mockAssignee = {
  id: 'ta-aaa-111',
  task_id: MOCK_TASK_ID_1,
  user_id: MOCK_USER_ID,
  role: 'assignee' as const,
  created_at: '2026-01-15T10:00:00Z',
}

const mockAssigneeWithProfile = {
  ...mockAssignee,
  profiles: {
    full_name: 'Test User',
    email: 'test@example.com',
    avatar_url: null,
  },
}

describe('task-assignee-service', () => {
  describe('getTaskAssignees', () => {
    it('태스크의 담당자 목록을 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: [mockAssigneeWithProfile], error: null }],
      }) as Client

      const result = await getTaskAssignees(client, MOCK_TASK_ID_1)

      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(1)
      expect(result.data![0].user_id).toBe(MOCK_USER_ID)
      expect(result.data![0].profiles.full_name).toBe('Test User')
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'PGRST301', message: 'DB error' } }],
      }) as Client

      const result = await getTaskAssignees(client, MOCK_TASK_ID_1)

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('PGRST301')
    })
  })

  describe('getProjectTaskAssignees', () => {
    it('프로젝트의 전체 담당자 매핑을 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: [mockAssignee], error: null }],
      }) as Client

      const result = await getProjectTaskAssignees(client, MOCK_PROJECT_ID)

      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(1)
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'PGRST301', message: 'DB error' } }],
      }) as Client

      const result = await getProjectTaskAssignees(client, MOCK_PROJECT_ID)

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('PGRST301')
    })
  })

  describe('addTaskAssignee', () => {
    it('담당자를 추가하고 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: mockAssignee, error: null }],
      }) as Client

      const result = await addTaskAssignee(client, MOCK_TASK_ID_1, MOCK_USER_ID, 'assignee')

      expect(result.error).toBeNull()
      expect(result.data).toEqual(mockAssignee)
    })

    it('워처를 추가할 수 있다', async () => {
      const watcherAssignee = { ...mockAssignee, role: 'watcher' as const, user_id: MOCK_USER_ID_2 }
      const client = createMockSupabaseClient({
        fromResponses: [{ data: watcherAssignee, error: null }],
      }) as Client

      const result = await addTaskAssignee(client, MOCK_TASK_ID_1, MOCK_USER_ID_2, 'watcher')

      expect(result.error).toBeNull()
      expect(result.data?.role).toBe('watcher')
    })

    it('중복 시 에러를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: '23505', message: 'Duplicate' } }],
      }) as Client

      const result = await addTaskAssignee(client, MOCK_TASK_ID_1, MOCK_USER_ID)

      expect(result.data).toBeNull()
      expect(result.error).not.toBeNull()
    })
  })

  describe('removeTaskAssignee', () => {
    it('담당자를 제거한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: null }],
      }) as Client

      const result = await removeTaskAssignee(client, MOCK_TASK_ID_1, MOCK_USER_ID)

      expect(result.error).toBeNull()
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'PGRST301', message: 'Delete failed' } }],
      }) as Client

      const result = await removeTaskAssignee(client, MOCK_TASK_ID_1, 'nonexistent')

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('PGRST301')
    })
  })

  describe('updateTaskAssigneeRole', () => {
    it('역할을 변경한다', async () => {
      const updated = { ...mockAssignee, role: 'watcher' as const }
      const client = createMockSupabaseClient({
        fromResponses: [{ data: updated, error: null }],
      }) as Client

      const result = await updateTaskAssigneeRole(client, MOCK_TASK_ID_1, MOCK_USER_ID, 'watcher')

      expect(result.error).toBeNull()
      expect(result.data?.role).toBe('watcher')
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'PGRST204', message: 'Not found' } }],
      }) as Client

      const result = await updateTaskAssigneeRole(client, MOCK_TASK_ID_1, 'nonexistent', 'watcher')

      expect(result.data).toBeNull()
      expect(result.error).not.toBeNull()
    })
  })
})
