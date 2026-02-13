import { describe, it, expect } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database'
import { createMockSupabaseClient } from '@/__tests__/helpers/mock-supabase'
import { MOCK_PROJECT_ID, MOCK_USER_ID, MOCK_COLUMN_ID_TODO } from '@/__tests__/helpers/fixtures'

import {
  getTaskTemplates,
  createTaskTemplate,
  updateTaskTemplate,
  deleteTaskTemplate,
  createTaskFromTemplate,
} from './task-template-service'

type Client = SupabaseClient<Database>

const mockTemplate = {
  id: 'template-aaa-111',
  project_id: MOCK_PROJECT_ID,
  created_by: MOCK_USER_ID,
  name: 'Bug Report',
  description_template: '## Steps to reproduce\n\n## Expected behavior\n\n## Actual behavior',
  priority: 'high' as const,
  subtasks_template: [
    { title: 'Reproduce issue', position: 0 },
    { title: 'Write fix', position: 1 },
  ],
  labels_template: ['label-aaa-111'],
  is_personal: false,
  position: 0,
  created_at: '2026-01-15T10:00:00Z',
  updated_at: '2026-01-15T10:00:00Z',
}

describe('task-template-service', () => {
  describe('getTaskTemplates', () => {
    it('프로젝트의 템플릿 목록을 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: [mockTemplate], error: null }],
      }) as Client

      const result = await getTaskTemplates(client, MOCK_PROJECT_ID)

      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(1)
      expect(result.data?.[0].name).toBe('Bug Report')
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'PGRST301', message: 'DB error' } }],
      }) as Client

      const result = await getTaskTemplates(client, MOCK_PROJECT_ID)

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('PGRST301')
    })
  })

  describe('createTaskTemplate', () => {
    it('템플릿을 생성하고 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: mockTemplate, error: null }],
      }) as Client

      const result = await createTaskTemplate(client, {
        project_id: MOCK_PROJECT_ID,
        created_by: MOCK_USER_ID,
        name: 'Bug Report',
        description_template: '## Steps to reproduce',
        priority: 'high',
        subtasks_template: [{ title: 'Reproduce issue', position: 0 }],
        labels_template: ['label-aaa-111'],
      })

      expect(result.error).toBeNull()
      expect(result.data?.name).toBe('Bug Report')
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: '23505', message: 'Duplicate' } }],
      }) as Client

      const result = await createTaskTemplate(client, {
        project_id: MOCK_PROJECT_ID,
        created_by: MOCK_USER_ID,
        name: 'Bug Report',
      })

      expect(result.data).toBeNull()
      expect(result.error).not.toBeNull()
    })
  })

  describe('updateTaskTemplate', () => {
    it('템플릿을 수정하고 반환한다', async () => {
      const updated = { ...mockTemplate, name: 'Updated Template' }
      const client = createMockSupabaseClient({
        fromResponses: [{ data: updated, error: null }],
      }) as Client

      const result = await updateTaskTemplate(client, mockTemplate.id, { name: 'Updated Template' })

      expect(result.error).toBeNull()
      expect(result.data?.name).toBe('Updated Template')
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'PGRST204', message: 'Not found' } }],
      }) as Client

      const result = await updateTaskTemplate(client, 'nonexistent', { name: 'X' })

      expect(result.data).toBeNull()
      expect(result.error).not.toBeNull()
    })
  })

  describe('deleteTaskTemplate', () => {
    it('템플릿을 삭제한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: null }],
      }) as Client

      const result = await deleteTaskTemplate(client, mockTemplate.id)

      expect(result.error).toBeNull()
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'PGRST301', message: 'Delete failed' } }],
      }) as Client

      const result = await deleteTaskTemplate(client, 'nonexistent')

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('PGRST301')
    })
  })

  describe('createTaskFromTemplate', () => {
    it('템플릿에서 태스크를 생성한다', async () => {
      const createdTask = {
        id: 'new-task-001',
        project_id: MOCK_PROJECT_ID,
        column_id: MOCK_COLUMN_ID_TODO,
        title: 'Bug Report',
        description: '## Steps to reproduce',
        priority: 'high',
        position: 0,
        created_by: MOCK_USER_ID,
      }

      const client = createMockSupabaseClient({
        fromResponses: [
          // 1. fetch template
          { data: mockTemplate, error: null },
          // 2. get column tasks for position
          { data: [], error: null },
          // 3. create task
          { data: createdTask, error: null },
          // 4. create subtasks
          { data: null, error: null },
          // 5. add labels
          { data: null, error: null },
        ],
      }) as Client

      const result = await createTaskFromTemplate(
        client,
        mockTemplate.id,
        MOCK_COLUMN_ID_TODO,
        MOCK_USER_ID,
        MOCK_PROJECT_ID,
      )

      expect(result.error).toBeNull()
      expect(result.data?.taskId).toBe('new-task-001')
    })

    it('템플릿을 찾을 수 없으면 에러를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'PGRST116', message: 'Not found' } }],
      }) as Client

      const result = await createTaskFromTemplate(
        client,
        'nonexistent',
        MOCK_COLUMN_ID_TODO,
        MOCK_USER_ID,
        MOCK_PROJECT_ID,
      )

      expect(result.data).toBeNull()
      expect(result.error).not.toBeNull()
    })

    it('태스크 생성 실패 시 에러를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [
          // 1. fetch template
          { data: mockTemplate, error: null },
          // 2. get column tasks
          { data: [], error: null },
          // 3. create task fails
          { data: null, error: { code: 'PGRST301', message: 'Insert failed' } },
        ],
      }) as Client

      const result = await createTaskFromTemplate(
        client,
        mockTemplate.id,
        MOCK_COLUMN_ID_TODO,
        MOCK_USER_ID,
        MOCK_PROJECT_ID,
      )

      expect(result.data).toBeNull()
      expect(result.error).not.toBeNull()
    })
  })
})
