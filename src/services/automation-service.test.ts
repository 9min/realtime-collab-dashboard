import { describe, it, expect } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database'
import { createMockSupabaseClient } from '@/__tests__/helpers/mock-supabase'
import { MOCK_PROJECT_ID, MOCK_USER_ID } from '@/__tests__/helpers/fixtures'

import {
  getAutomationRules,
  createAutomationRule,
  updateAutomationRule,
  deleteAutomationRule,
  toggleAutomationRule,
  getAutomationExecutions,
} from './automation-service'

type Client = SupabaseClient<Database>

const mockRule = {
  id: 'rule-aaa-111',
  project_id: MOCK_PROJECT_ID,
  name: '완료 시 우선순위 낮춤',
  trigger_type: 'task_moved_to_column',
  trigger_config: { column_id: 'col-done-333' },
  action_type: 'set_priority',
  action_config: { priority: 'low' },
  is_active: true,
  execution_count: 5,
  last_executed_at: '2026-02-10T12:00:00Z',
  created_by: MOCK_USER_ID,
  created_at: '2026-02-01T10:00:00Z',
  updated_at: '2026-02-01T10:00:00Z',
}

const mockExecution = {
  id: 'exec-aaa-111',
  rule_id: 'rule-aaa-111',
  project_id: MOCK_PROJECT_ID,
  trigger_entity_id: 'task-aaa-111',
  trigger_data: { column_id: 'col-done-333' },
  action_result: { priority: 'low' },
  status: 'success',
  error_message: null,
  executed_at: '2026-02-10T12:00:00Z',
}

describe('automation-service', () => {
  describe('getAutomationRules', () => {
    it('프로젝트의 자동화 규칙 목록을 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: [mockRule], error: null }],
      }) as Client

      const result = await getAutomationRules(client, MOCK_PROJECT_ID)

      expect(result.error).toBeNull()
      expect(result.data).toEqual([mockRule])
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'PGRST301', message: 'DB error' } }],
      }) as Client

      const result = await getAutomationRules(client, MOCK_PROJECT_ID)

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('PGRST301')
    })
  })

  describe('createAutomationRule', () => {
    it('자동화 규칙을 생성하고 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: mockRule, error: null }],
      }) as Client

      const result = await createAutomationRule(client, {
        project_id: MOCK_PROJECT_ID,
        name: '완료 시 우선순위 낮춤',
        trigger_type: 'task_moved_to_column',
        trigger_config: { column_id: 'col-done-333' },
        action_type: 'set_priority',
        action_config: { priority: 'low' },
        created_by: MOCK_USER_ID,
      })

      expect(result.error).toBeNull()
      expect(result.data).toEqual(mockRule)
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'LIMIT', message: 'Maximum 20' } }],
      }) as Client

      const result = await createAutomationRule(client, {
        project_id: MOCK_PROJECT_ID,
        name: 'Test',
        trigger_type: 'task_created',
        action_type: 'set_priority',
        created_by: MOCK_USER_ID,
      })

      expect(result.data).toBeNull()
      expect(result.error).not.toBeNull()
    })
  })

  describe('updateAutomationRule', () => {
    it('자동화 규칙을 수정하고 반환한다', async () => {
      const updated = { ...mockRule, name: '수정된 규칙' }
      const client = createMockSupabaseClient({
        fromResponses: [{ data: updated, error: null }],
      }) as Client

      const result = await updateAutomationRule(client, mockRule.id, { name: '수정된 규칙' })

      expect(result.error).toBeNull()
      expect(result.data?.name).toBe('수정된 규칙')
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'PGRST204', message: 'Not found' } }],
      }) as Client

      const result = await updateAutomationRule(client, 'nonexistent', { name: 'X' })

      expect(result.data).toBeNull()
      expect(result.error).not.toBeNull()
    })
  })

  describe('deleteAutomationRule', () => {
    it('자동화 규칙을 삭제한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: null }],
      }) as Client

      const result = await deleteAutomationRule(client, mockRule.id)

      expect(result.error).toBeNull()
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'PGRST301', message: 'Delete failed' } }],
      }) as Client

      const result = await deleteAutomationRule(client, 'nonexistent')

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('PGRST301')
    })
  })

  describe('toggleAutomationRule', () => {
    it('자동화 규칙을 비활성화한다', async () => {
      const toggled = { ...mockRule, is_active: false }
      const client = createMockSupabaseClient({
        fromResponses: [{ data: toggled, error: null }],
      }) as Client

      const result = await toggleAutomationRule(client, mockRule.id, false)

      expect(result.error).toBeNull()
      expect(result.data?.is_active).toBe(false)
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'PGRST204', message: 'Not found' } }],
      }) as Client

      const result = await toggleAutomationRule(client, 'nonexistent', true)

      expect(result.data).toBeNull()
      expect(result.error).not.toBeNull()
    })
  })

  describe('getAutomationExecutions', () => {
    it('실행 로그 목록을 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: [mockExecution], error: null }],
      }) as Client

      const result = await getAutomationExecutions(client, mockRule.id)

      expect(result.error).toBeNull()
      expect(result.data).toEqual([mockExecution])
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'PGRST301', message: 'DB error' } }],
      }) as Client

      const result = await getAutomationExecutions(client, 'nonexistent')

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('PGRST301')
    })
  })
})
