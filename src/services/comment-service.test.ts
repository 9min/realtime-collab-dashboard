import { describe, it, expect } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database'
import { createMockSupabaseClient } from '@/__tests__/helpers/mock-supabase'
import {
  MOCK_TASK_ID_1,
  MOCK_PROJECT_ID,
  MOCK_USER_ID,
  MOCK_COMMENT_ID,
  mockComment,
} from '@/__tests__/helpers/fixtures'

import { getComments, createComment, updateComment, deleteComment } from './comment-service'

type Client = SupabaseClient<Database>

describe('comment-service', () => {
  // ── getComments ──
  describe('getComments', () => {
    it('태스크의 댓글 목록을 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: [mockComment], error: null }],
      }) as Client

      const result = await getComments(client, MOCK_TASK_ID_1)

      expect(result.error).toBeNull()
      expect(result.data).toEqual([mockComment])
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'ERR', message: 'fail' } }],
      }) as Client

      const result = await getComments(client, MOCK_TASK_ID_1)

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('ERR')
    })
  })

  // ── createComment ──
  describe('createComment', () => {
    it('댓글을 생성하고 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: mockComment, error: null }],
      }) as Client

      const result = await createComment(client, {
        taskId: MOCK_TASK_ID_1,
        projectId: MOCK_PROJECT_ID,
        userId: MOCK_USER_ID,
        content: 'Test comment',
      })

      expect(result.error).toBeNull()
      expect(result.data).toEqual(mockComment)
    })

    it('mentions를 포함하여 생성할 수 있다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: { ...mockComment, mentions: ['user-2'] }, error: null }],
      }) as Client

      const result = await createComment(client, {
        taskId: MOCK_TASK_ID_1,
        projectId: MOCK_PROJECT_ID,
        userId: MOCK_USER_ID,
        content: '@Other User',
        mentions: ['user-2'],
      })

      expect(result.error).toBeNull()
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'ERR', message: 'fail' } }],
      }) as Client

      const result = await createComment(client, {
        taskId: MOCK_TASK_ID_1,
        projectId: MOCK_PROJECT_ID,
        userId: MOCK_USER_ID,
        content: 'Test',
      })

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('ERR')
    })

    it('data가 null이면 UNKNOWN 에러를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: null }],
      }) as Client

      const result = await createComment(client, {
        taskId: MOCK_TASK_ID_1,
        projectId: MOCK_PROJECT_ID,
        userId: MOCK_USER_ID,
        content: 'Test',
      })

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('UNKNOWN')
    })
  })

  // ── updateComment ──
  describe('updateComment', () => {
    it('댓글을 수정하고 반환한다', async () => {
      const updated = { ...mockComment, content: 'Updated comment' }
      const client = createMockSupabaseClient({
        fromResponses: [{ data: updated, error: null }],
      }) as Client

      const result = await updateComment(client, {
        commentId: MOCK_COMMENT_ID,
        content: 'Updated comment',
      })

      expect(result.error).toBeNull()
      expect(result.data?.content).toBe('Updated comment')
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'ERR', message: 'fail' } }],
      }) as Client

      const result = await updateComment(client, {
        commentId: MOCK_COMMENT_ID,
        content: 'X',
      })

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('ERR')
    })
  })

  // ── deleteComment ──
  describe('deleteComment', () => {
    it('댓글을 삭제하고 성공을 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: null }],
      }) as Client

      const result = await deleteComment(client, MOCK_COMMENT_ID)

      expect(result.error).toBeNull()
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'ERR', message: 'Delete failed' } }],
      }) as Client

      const result = await deleteComment(client, MOCK_COMMENT_ID)

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('ERR')
    })
  })
})
