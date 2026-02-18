import { describe, it, expect } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database'
import { createMockSupabaseClient } from '@/__tests__/helpers/mock-supabase'
import { MOCK_PROJECT_ID, MOCK_TASK_ID_1 } from '@/__tests__/helpers/fixtures'

import {
  getLabels,
  createLabel,
  updateLabel,
  deleteLabel,
  addTaskLabel,
  addTaskLabels,
  removeTaskLabel,
} from './label-service'

type Client = SupabaseClient<Database>

const mockLabel = {
  id: 'label-aaa-111',
  project_id: MOCK_PROJECT_ID,
  name: 'Bug',
  color: '#EF4444',
  created_at: '2026-01-15T10:00:00Z',
}

describe('label-service', () => {
  describe('getLabels', () => {
    it('프로젝트의 라벨 목록을 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: [mockLabel], error: null }],
      }) as Client

      const result = await getLabels(client, MOCK_PROJECT_ID)

      expect(result.error).toBeNull()
      expect(result.data).toEqual([mockLabel])
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'PGRST301', message: 'DB error' } }],
      }) as Client

      const result = await getLabels(client, MOCK_PROJECT_ID)

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('PGRST301')
    })
  })

  describe('createLabel', () => {
    it('라벨을 생성하고 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: mockLabel, error: null }],
      }) as Client

      const result = await createLabel(client, {
        project_id: MOCK_PROJECT_ID,
        name: 'Bug',
        color: '#EF4444',
      })

      expect(result.error).toBeNull()
      expect(result.data).toEqual(mockLabel)
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: '23505', message: 'Duplicate' } }],
      }) as Client

      const result = await createLabel(client, {
        project_id: MOCK_PROJECT_ID,
        name: 'Bug',
        color: '#EF4444',
      })

      expect(result.data).toBeNull()
      expect(result.error).not.toBeNull()
    })
  })

  describe('updateLabel', () => {
    it('라벨을 수정하고 반환한다', async () => {
      const updated = { ...mockLabel, name: 'Feature' }
      const client = createMockSupabaseClient({
        fromResponses: [{ data: updated, error: null }],
      }) as Client

      const result = await updateLabel(client, mockLabel.id, { name: 'Feature' })

      expect(result.error).toBeNull()
      expect(result.data?.name).toBe('Feature')
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'PGRST204', message: 'Not found' } }],
      }) as Client

      const result = await updateLabel(client, 'nonexistent', { name: 'X' })

      expect(result.data).toBeNull()
      expect(result.error).not.toBeNull()
    })
  })

  describe('deleteLabel', () => {
    it('라벨을 삭제한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: null }],
      }) as Client

      const result = await deleteLabel(client, mockLabel.id)

      expect(result.error).toBeNull()
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'PGRST301', message: 'Delete failed' } }],
      }) as Client

      const result = await deleteLabel(client, 'nonexistent')

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('PGRST301')
    })
  })

  describe('addTaskLabels', () => {
    it('빈 배열이면 빈 결과를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [],
      }) as Client

      const result = await addTaskLabels(client, MOCK_TASK_ID_1, [])

      expect(result.error).toBeNull()
      expect(result.data).toEqual([])
    })

    it('여러 라벨을 한 번에 할당한다', async () => {
      const taskLabels = [
        { task_id: MOCK_TASK_ID_1, label_id: 'label-aaa-111' },
        { task_id: MOCK_TASK_ID_1, label_id: 'label-bbb-222' },
      ]
      const client = createMockSupabaseClient({
        fromResponses: [{ data: taskLabels, error: null }],
      }) as Client

      const result = await addTaskLabels(client, MOCK_TASK_ID_1, ['label-aaa-111', 'label-bbb-222'])

      expect(result.error).toBeNull()
      expect(result.data).toEqual(taskLabels)
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: '23505', message: 'Duplicate' } }],
      }) as Client

      const result = await addTaskLabels(client, MOCK_TASK_ID_1, ['label-aaa-111'])

      expect(result.data).toBeNull()
      expect(result.error).not.toBeNull()
    })
  })

  describe('addTaskLabel', () => {
    it('태스크에 라벨을 할당한다', async () => {
      const taskLabel = { task_id: MOCK_TASK_ID_1, label_id: mockLabel.id }
      const client = createMockSupabaseClient({
        fromResponses: [{ data: taskLabel, error: null }],
      }) as Client

      const result = await addTaskLabel(client, MOCK_TASK_ID_1, mockLabel.id)

      expect(result.error).toBeNull()
      expect(result.data).toEqual(taskLabel)
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: '23505', message: 'Duplicate' } }],
      }) as Client

      const result = await addTaskLabel(client, MOCK_TASK_ID_1, mockLabel.id)

      expect(result.data).toBeNull()
      expect(result.error).not.toBeNull()
    })
  })

  describe('removeTaskLabel', () => {
    it('태스크에서 라벨을 제거한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: null }],
      }) as Client

      const result = await removeTaskLabel(client, MOCK_TASK_ID_1, mockLabel.id)

      expect(result.error).toBeNull()
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'PGRST301', message: 'Delete failed' } }],
      }) as Client

      const result = await removeTaskLabel(client, MOCK_TASK_ID_1, 'nonexistent')

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('PGRST301')
    })
  })
})
