import { describe, it, expect } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database'
import { createMockSupabaseClient } from '@/__tests__/helpers/mock-supabase'
import { MOCK_PROJECT_ID, MOCK_TASK_ID_1 } from '@/__tests__/helpers/fixtures'

import {
  getCustomFieldDefinitions,
  createCustomFieldDefinition,
  updateCustomFieldDefinition,
  deleteCustomFieldDefinition,
  getTaskCustomFieldValues,
  setTaskCustomFieldValue,
} from './custom-field-service'

type Client = SupabaseClient<Database>

const mockFieldDef = {
  id: 'field-aaa-111',
  project_id: MOCK_PROJECT_ID,
  name: '우선순위 점수',
  field_type: 'number' as const,
  options: null,
  is_required: false,
  position: 0,
  created_at: '2026-01-15T10:00:00Z',
  updated_at: '2026-01-15T10:00:00Z',
}

const mockFieldValue = {
  id: 'val-aaa-111',
  task_id: MOCK_TASK_ID_1,
  field_id: 'field-aaa-111',
  value: '42',
  created_at: '2026-01-15T10:00:00Z',
  updated_at: '2026-01-15T10:00:00Z',
}

describe('custom-field-service', () => {
  describe('getCustomFieldDefinitions', () => {
    it('프로젝트의 커스텀 필드 정의 목록을 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: [mockFieldDef], error: null }],
      }) as Client

      const result = await getCustomFieldDefinitions(client, MOCK_PROJECT_ID)

      expect(result.error).toBeNull()
      expect(result.data).toEqual([mockFieldDef])
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'PGRST301', message: 'DB error' } }],
      }) as Client

      const result = await getCustomFieldDefinitions(client, MOCK_PROJECT_ID)

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('PGRST301')
    })
  })

  describe('createCustomFieldDefinition', () => {
    it('커스텀 필드를 생성하고 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: mockFieldDef, error: null }],
      }) as Client

      const result = await createCustomFieldDefinition(client, {
        project_id: MOCK_PROJECT_ID,
        name: '우선순위 점수',
        field_type: 'number',
      })

      expect(result.error).toBeNull()
      expect(result.data).toEqual(mockFieldDef)
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: '23505', message: 'Duplicate' } }],
      }) as Client

      const result = await createCustomFieldDefinition(client, {
        project_id: MOCK_PROJECT_ID,
        name: '우선순위 점수',
        field_type: 'number',
      })

      expect(result.data).toBeNull()
      expect(result.error).not.toBeNull()
    })
  })

  describe('updateCustomFieldDefinition', () => {
    it('커스텀 필드를 수정하고 반환한다', async () => {
      const updated = { ...mockFieldDef, name: '점수' }
      const client = createMockSupabaseClient({
        fromResponses: [{ data: updated, error: null }],
      }) as Client

      const result = await updateCustomFieldDefinition(client, mockFieldDef.id, { name: '점수' })

      expect(result.error).toBeNull()
      expect(result.data?.name).toBe('점수')
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'PGRST204', message: 'Not found' } }],
      }) as Client

      const result = await updateCustomFieldDefinition(client, 'nonexistent', { name: 'X' })

      expect(result.data).toBeNull()
      expect(result.error).not.toBeNull()
    })
  })

  describe('deleteCustomFieldDefinition', () => {
    it('커스텀 필드를 삭제한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: null }],
      }) as Client

      const result = await deleteCustomFieldDefinition(client, mockFieldDef.id)

      expect(result.error).toBeNull()
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'PGRST301', message: 'Delete failed' } }],
      }) as Client

      const result = await deleteCustomFieldDefinition(client, 'nonexistent')

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('PGRST301')
    })
  })

  describe('getTaskCustomFieldValues', () => {
    it('프로젝트의 커스텀 필드 값 목록을 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [
          {
            data: [
              {
                ...mockFieldValue,
                custom_field_definitions: { project_id: MOCK_PROJECT_ID },
              },
            ],
            error: null,
          },
        ],
      }) as Client

      const result = await getTaskCustomFieldValues(client, MOCK_PROJECT_ID)

      expect(result.error).toBeNull()
      expect(result.data).toEqual([mockFieldValue])
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'PGRST301', message: 'DB error' } }],
      }) as Client

      const result = await getTaskCustomFieldValues(client, MOCK_PROJECT_ID)

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('PGRST301')
    })
  })

  describe('setTaskCustomFieldValue', () => {
    it('커스텀 필드 값을 설정한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: mockFieldValue, error: null }],
      }) as Client

      const result = await setTaskCustomFieldValue(client, MOCK_TASK_ID_1, 'field-aaa-111', '42')

      expect(result.error).toBeNull()
      expect(result.data).toEqual(mockFieldValue)
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: '23503', message: 'FK violation' } }],
      }) as Client

      const result = await setTaskCustomFieldValue(client, MOCK_TASK_ID_1, 'nonexistent', '42')

      expect(result.data).toBeNull()
      expect(result.error).not.toBeNull()
    })
  })
})
