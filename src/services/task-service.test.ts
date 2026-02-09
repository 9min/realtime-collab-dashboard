import { describe, it, expect } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database'
import { createMockSupabaseClient } from '@/__tests__/helpers/mock-supabase'
import {
  MOCK_PROJECT_ID,
  MOCK_TASK_ID_1,
  MOCK_TASK_ID_2,
  MOCK_COLUMN_ID_TODO,
  MOCK_COLUMN_ID_PROGRESS,
  MOCK_USER_ID,
  mockTasks,
} from '@/__tests__/helpers/fixtures'

import {
  getTasksByProject,
  createTask,
  updateTask,
  deleteTask,
  deleteTasksBefore,
  moveTask,
} from './task-service'

type Client = SupabaseClient<Database>

describe('task-service', () => {
  // ── getTasksByProject ──
  describe('getTasksByProject', () => {
    it('프로젝트의 태스크 목록을 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: mockTasks, error: null }],
      }) as Client

      const result = await getTasksByProject(client, MOCK_PROJECT_ID)

      expect(result.error).toBeNull()
      expect(result.data).toEqual(mockTasks)
      expect((client as unknown as { from: ReturnType<typeof import('vitest')['vi']['fn']> }).from).toHaveBeenCalledWith('tasks')
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'PGRST116', message: 'DB error' } }],
      }) as Client

      const result = await getTasksByProject(client, MOCK_PROJECT_ID)

      expect(result.data).toBeNull()
      expect(result.error).toEqual({ code: 'PGRST116', message: 'DB error' })
    })
  })

  // ── createTask ──
  describe('createTask', () => {
    it('태스크를 생성하고 반환한다', async () => {
      const newTask = mockTasks[0]
      const client = createMockSupabaseClient({
        fromResponses: [{ data: newTask, error: null }],
      }) as Client

      const input = {
        project_id: MOCK_PROJECT_ID,
        column_id: MOCK_COLUMN_ID_TODO,
        title: 'Task 1',
        position: 0,
        created_by: MOCK_USER_ID,
      }

      const result = await createTask(client, input)

      expect(result.error).toBeNull()
      expect(result.data).toEqual(newTask)
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: '23505', message: 'Duplicate' } }],
      }) as Client

      const result = await createTask(client, {
        project_id: MOCK_PROJECT_ID,
        column_id: MOCK_COLUMN_ID_TODO,
        title: 'Task',
        position: 0,
        created_by: MOCK_USER_ID,
      })

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('23505')
    })

    it('data가 null이면 UNKNOWN 에러를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: null }],
      }) as Client

      const result = await createTask(client, {
        project_id: MOCK_PROJECT_ID,
        column_id: MOCK_COLUMN_ID_TODO,
        title: 'Task',
        position: 0,
        created_by: MOCK_USER_ID,
      })

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('UNKNOWN')
    })
  })

  // ── updateTask ──
  describe('updateTask', () => {
    it('태스크를 수정하고 반환한다', async () => {
      const updated = { ...mockTasks[0], title: 'Updated' }
      const client = createMockSupabaseClient({
        fromResponses: [{ data: updated, error: null }],
      }) as Client

      const result = await updateTask(client, MOCK_TASK_ID_1, { title: 'Updated' })

      expect(result.error).toBeNull()
      expect(result.data?.title).toBe('Updated')
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'PGRST204', message: 'Not found' } }],
      }) as Client

      const result = await updateTask(client, 'nonexistent', { title: 'X' })

      expect(result.data).toBeNull()
      expect(result.error).not.toBeNull()
    })
  })

  // ── deleteTask ──
  describe('deleteTask', () => {
    it('태스크를 삭제하고 성공을 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: null }],
      }) as Client

      const result = await deleteTask(client, MOCK_TASK_ID_1)

      expect(result.error).toBeNull()
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'PGRST204', message: 'Not found' } }],
      }) as Client

      const result = await deleteTask(client, 'nonexistent')

      expect(result.error).toEqual({ code: 'PGRST204', message: 'Not found' })
    })
  })

  // ── deleteTasksBefore ──
  describe('deleteTasksBefore', () => {
    it('기준 날짜 이전 태스크를 삭제하고 deletedCount를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: [{ id: MOCK_TASK_ID_1 }, { id: MOCK_TASK_ID_2 }], error: null }],
      }) as Client

      const result = await deleteTasksBefore(client, MOCK_PROJECT_ID, '2026-01-01T00:00:00Z')

      expect(result.error).toBeNull()
      expect(result.data).toEqual({ deletedCount: 2 })
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'PGRST204', message: 'Delete failed' } }],
      }) as Client

      const result = await deleteTasksBefore(client, MOCK_PROJECT_ID, '2026-01-01T00:00:00Z')

      expect(result.data).toBeNull()
      expect(result.error).toEqual({ code: 'PGRST204', message: 'Delete failed' })
    })

    it('대상 없으면 deletedCount 0을 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: [], error: null }],
      }) as Client

      const result = await deleteTasksBefore(client, MOCK_PROJECT_ID, '2025-01-01T00:00:00Z')

      expect(result.error).toBeNull()
      expect(result.data).toEqual({ deletedCount: 0 })
    })
  })

  // ── moveTask ──
  describe('moveTask', () => {
    it('태스크를 다른 컬럼으로 이동한다', async () => {
      const destTasks = [{ id: MOCK_TASK_ID_2, position: 0 }]
      const movedTask = { ...mockTasks[0], column_id: MOCK_COLUMN_ID_PROGRESS, position: 0 }

      const client = createMockSupabaseClient({
        fromResponses: [
          // 1. 대상 컬럼의 기존 태스크 조회
          { data: destTasks, error: null },
          // 2. 기존 태스크 position 재정렬 (destTasks 길이만큼)
          { data: null, error: null },
          // 3. 이동 대상 태스크 업데이트
          { data: movedTask, error: null },
        ],
      }) as Client

      const result = await moveTask(client, {
        taskId: MOCK_TASK_ID_1,
        sourceColumnId: MOCK_COLUMN_ID_TODO,
        destinationColumnId: MOCK_COLUMN_ID_PROGRESS,
        newPosition: 0,
      })

      expect(result.error).toBeNull()
      expect(result.data?.column_id).toBe(MOCK_COLUMN_ID_PROGRESS)
    })

    it('대상 컬럼이 비어있어도 이동에 성공한다', async () => {
      const movedTask = { ...mockTasks[0], column_id: MOCK_COLUMN_ID_PROGRESS, position: 0 }

      const client = createMockSupabaseClient({
        fromResponses: [
          // 빈 컬럼
          { data: [], error: null },
          // 이동 업데이트
          { data: movedTask, error: null },
        ],
      }) as Client

      const result = await moveTask(client, {
        taskId: MOCK_TASK_ID_1,
        sourceColumnId: MOCK_COLUMN_ID_TODO,
        destinationColumnId: MOCK_COLUMN_ID_PROGRESS,
        newPosition: 0,
      })

      expect(result.error).toBeNull()
      expect(result.data).toEqual(movedTask)
    })

    it('이동 업데이트 실패 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [
          { data: [], error: null },
          { data: null, error: { code: 'PGRST204', message: 'Failed' } },
        ],
      }) as Client

      const result = await moveTask(client, {
        taskId: MOCK_TASK_ID_1,
        sourceColumnId: MOCK_COLUMN_ID_TODO,
        destinationColumnId: MOCK_COLUMN_ID_PROGRESS,
        newPosition: 0,
      })

      expect(result.data).toBeNull()
      expect(result.error).not.toBeNull()
    })
  })
})
