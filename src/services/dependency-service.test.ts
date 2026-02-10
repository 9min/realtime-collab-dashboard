import { describe, it, expect } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database'
import type { TaskDependency } from '@/types/dependency'
import { createMockSupabaseClient } from '@/__tests__/helpers/mock-supabase'
import {
  MOCK_PROJECT_ID,
  MOCK_TASK_ID_1,
  MOCK_TASK_ID_2,
  MOCK_TASK_ID_3,
  MOCK_USER_ID,
} from '@/__tests__/helpers/fixtures'

import {
  getDependencies,
  createDependency,
  deleteDependency,
  hasCyclicDependency,
} from './dependency-service'

type Client = SupabaseClient<Database>

const MOCK_DEP_ID = 'dep-aaa-111'

const mockDependency: TaskDependency = {
  id: MOCK_DEP_ID,
  project_id: MOCK_PROJECT_ID,
  blocking_task_id: MOCK_TASK_ID_1,
  blocked_task_id: MOCK_TASK_ID_2,
  created_by: MOCK_USER_ID,
  created_at: '2026-01-15T10:00:00Z',
}

describe('dependency-service', () => {
  // ── getDependencies ──
  describe('getDependencies', () => {
    it('프로젝트의 의존성 목록을 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: [mockDependency], error: null }],
      }) as Client

      const result = await getDependencies(client, MOCK_PROJECT_ID)

      expect(result.error).toBeNull()
      expect(result.data).toEqual([mockDependency])
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'PGRST116', message: 'DB error' } }],
      }) as Client

      const result = await getDependencies(client, MOCK_PROJECT_ID)

      expect(result.data).toBeNull()
      expect(result.error).toEqual({ code: 'PGRST116', message: 'DB error' })
    })

    it('빈 목록이면 빈 배열을 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: [], error: null }],
      }) as Client

      const result = await getDependencies(client, MOCK_PROJECT_ID)

      expect(result.error).toBeNull()
      expect(result.data).toEqual([])
    })
  })

  // ── createDependency ──
  describe('createDependency', () => {
    it('의존성을 생성하고 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: mockDependency, error: null }],
      }) as Client

      const result = await createDependency(client, {
        project_id: MOCK_PROJECT_ID,
        blocking_task_id: MOCK_TASK_ID_1,
        blocked_task_id: MOCK_TASK_ID_2,
        created_by: MOCK_USER_ID,
      })

      expect(result.error).toBeNull()
      expect(result.data).toEqual(mockDependency)
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: '23505', message: 'Duplicate' } }],
      }) as Client

      const result = await createDependency(client, {
        project_id: MOCK_PROJECT_ID,
        blocking_task_id: MOCK_TASK_ID_1,
        blocked_task_id: MOCK_TASK_ID_2,
        created_by: MOCK_USER_ID,
      })

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('23505')
    })

    it('data가 null이면 UNKNOWN 에러를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: null }],
      }) as Client

      const result = await createDependency(client, {
        project_id: MOCK_PROJECT_ID,
        blocking_task_id: MOCK_TASK_ID_1,
        blocked_task_id: MOCK_TASK_ID_2,
        created_by: MOCK_USER_ID,
      })

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('UNKNOWN')
    })
  })

  // ── deleteDependency ──
  describe('deleteDependency', () => {
    it('의존성을 삭제하고 성공을 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: null }],
      }) as Client

      const result = await deleteDependency(client, MOCK_DEP_ID)

      expect(result.error).toBeNull()
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'PGRST204', message: 'Not found' } }],
      }) as Client

      const result = await deleteDependency(client, 'nonexistent')

      expect(result.error).toEqual({ code: 'PGRST204', message: 'Not found' })
    })
  })

  // ── hasCyclicDependency ──
  describe('hasCyclicDependency', () => {
    it('순환이 없으면 false를 반환한다', () => {
      // A → B 이미 존재, B → C 추가
      const deps: TaskDependency[] = [
        { ...mockDependency, blocking_task_id: MOCK_TASK_ID_1, blocked_task_id: MOCK_TASK_ID_2 },
      ]

      const result = hasCyclicDependency(deps, MOCK_TASK_ID_2, MOCK_TASK_ID_3)
      expect(result).toBe(false)
    })

    it('직접 순환이면 true를 반환한다', () => {
      // A → B 이미 존재, B → A 추가 시도
      const deps: TaskDependency[] = [
        { ...mockDependency, blocking_task_id: MOCK_TASK_ID_1, blocked_task_id: MOCK_TASK_ID_2 },
      ]

      const result = hasCyclicDependency(deps, MOCK_TASK_ID_2, MOCK_TASK_ID_1)
      expect(result).toBe(true)
    })

    it('간접 순환이면 true를 반환한다', () => {
      // A → B, B → C 이미 존재, C → A 추가 시도
      const deps: TaskDependency[] = [
        { ...mockDependency, id: 'dep-1', blocking_task_id: MOCK_TASK_ID_1, blocked_task_id: MOCK_TASK_ID_2 },
        { ...mockDependency, id: 'dep-2', blocking_task_id: MOCK_TASK_ID_2, blocked_task_id: MOCK_TASK_ID_3 },
      ]

      const result = hasCyclicDependency(deps, MOCK_TASK_ID_3, MOCK_TASK_ID_1)
      expect(result).toBe(true)
    })

    it('빈 의존성 목록에서는 false를 반환한다', () => {
      const result = hasCyclicDependency([], MOCK_TASK_ID_1, MOCK_TASK_ID_2)
      expect(result).toBe(false)
    })

    it('관련 없는 간선이면 false를 반환한다', () => {
      // A → B 존재, C → D 추가 (관련 없음)
      const deps: TaskDependency[] = [
        { ...mockDependency, blocking_task_id: MOCK_TASK_ID_1, blocked_task_id: MOCK_TASK_ID_2 },
      ]

      const result = hasCyclicDependency(deps, MOCK_TASK_ID_3, 'task-ddd-444')
      expect(result).toBe(false)
    })
  })
})
