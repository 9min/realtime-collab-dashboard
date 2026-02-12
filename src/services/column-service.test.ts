import { describe, it, expect } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database'
import { createMockSupabaseClient } from '@/__tests__/helpers/mock-supabase'
import {
  MOCK_PROJECT_ID,
  MOCK_COLUMN_ID_TODO,
  MOCK_COLUMN_ID_PROGRESS,
  MOCK_COLUMN_ID_DONE,
  mockColumns,
} from '@/__tests__/helpers/fixtures'

import {
  getColumns,
  createColumn,
  updateColumn,
  deleteColumn,
  reorderColumns,
} from './column-service'

type Client = SupabaseClient<Database>

describe('column-service', () => {
  // ── getColumns ──
  describe('getColumns', () => {
    it('프로젝트의 컬럼 목록을 position 순으로 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: mockColumns, error: null }],
      }) as Client

      const result = await getColumns(client, MOCK_PROJECT_ID)

      expect(result.error).toBeNull()
      expect(result.data).toEqual(mockColumns)
      expect(result.data).toHaveLength(3)
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'PGRST116', message: 'DB error' } }],
      }) as Client

      const result = await getColumns(client, MOCK_PROJECT_ID)

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('PGRST116')
    })
  })

  // ── createColumn ──
  describe('createColumn', () => {
    it('컬럼을 생성하고 반환한다', async () => {
      const newColumn = mockColumns[0]
      const client = createMockSupabaseClient({
        fromResponses: [{ data: newColumn, error: null }],
      }) as Client

      const result = await createColumn(client, {
        project_id: MOCK_PROJECT_ID,
        title: '할 일',
        position: 0,
      })

      expect(result.error).toBeNull()
      expect(result.data).toEqual(newColumn)
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: '23505', message: 'Duplicate' } }],
      }) as Client

      const result = await createColumn(client, {
        project_id: MOCK_PROJECT_ID,
        title: 'Duplicate',
        position: 0,
      })

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('23505')
    })

    it('data가 null이면 UNKNOWN 에러를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: null }],
      }) as Client

      const result = await createColumn(client, {
        project_id: MOCK_PROJECT_ID,
        title: 'Col',
        position: 0,
      })

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('UNKNOWN')
    })
  })

  // ── updateColumn ──
  describe('updateColumn', () => {
    it('컬럼을 수정하고 반환한다', async () => {
      const updated = { ...mockColumns[0], title: 'Updated' }
      const client = createMockSupabaseClient({
        fromResponses: [{ data: updated, error: null }],
      }) as Client

      const result = await updateColumn(client, MOCK_COLUMN_ID_TODO, { title: 'Updated' })

      expect(result.error).toBeNull()
      expect(result.data?.title).toBe('Updated')
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'PGRST204', message: 'Not found' } }],
      }) as Client

      const result = await updateColumn(client, 'nonexistent', { title: 'X' })

      expect(result.data).toBeNull()
      expect(result.error).not.toBeNull()
    })
  })

  // ── deleteColumn ──
  describe('deleteColumn', () => {
    it('컬럼을 삭제하고 성공을 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: null }],
      }) as Client

      const result = await deleteColumn(client, MOCK_COLUMN_ID_TODO)

      expect(result.error).toBeNull()
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: '23503', message: 'FK violation' } }],
      }) as Client

      const result = await deleteColumn(client, MOCK_COLUMN_ID_TODO)

      expect(result.error?.code).toBe('23503')
    })
  })

  // ── reorderColumns ──
  describe('reorderColumns', () => {
    it('컬럼 순서를 변경하고 전체 목록을 반환한다', async () => {
      const reordered = [mockColumns[2], mockColumns[0], mockColumns[1]]
      const orderedIds = [MOCK_COLUMN_ID_DONE, MOCK_COLUMN_ID_TODO, MOCK_COLUMN_ID_PROGRESS]

      const client = createMockSupabaseClient({
        fromResponses: [
          // update 호출 3회 (각 컬럼)
          { data: null, error: null },
          { data: null, error: null },
          { data: null, error: null },
          // getColumns 재조회
          { data: reordered, error: null },
        ],
      }) as Client

      const result = await reorderColumns(client, MOCK_PROJECT_ID, orderedIds)

      expect(result.error).toBeNull()
      expect(result.data).toEqual(reordered)
    })

    it('업데이트 중 에러 발생 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [
          { data: null, error: null },
          { data: null, error: { code: 'PGRST204', message: 'Update failed' } },
          { data: null, error: null },
        ],
      }) as Client

      const result = await reorderColumns(client, MOCK_PROJECT_ID, [
        MOCK_COLUMN_ID_DONE,
        MOCK_COLUMN_ID_TODO,
        MOCK_COLUMN_ID_PROGRESS,
      ])

      expect(result.data).toBeNull()
      expect(result.error).not.toBeNull()
    })
  })
})
