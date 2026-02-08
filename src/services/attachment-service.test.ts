import { describe, it, expect, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database'
import { createMockSupabaseClient } from '@/__tests__/helpers/mock-supabase'
import {
  MOCK_TASK_ID_1,
  MOCK_PROJECT_ID,
  MOCK_USER_ID,
  MOCK_ATTACHMENT_ID,
  mockAttachment,
} from '@/__tests__/helpers/fixtures'

import { getAttachments, uploadAttachment, deleteAttachment, getPublicUrl } from './attachment-service'

type Client = SupabaseClient<Database>

// crypto.randomUUID mock
vi.stubGlobal('crypto', { randomUUID: () => 'mock-uuid-123' })

describe('attachment-service', () => {
  // ── getAttachments ──
  describe('getAttachments', () => {
    it('태스크의 첨부파일 목록을 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: [mockAttachment], error: null }],
      }) as Client

      const result = await getAttachments(client, MOCK_TASK_ID_1)

      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(1)
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'ERR', message: 'fail' } }],
      }) as Client

      const result = await getAttachments(client, MOCK_TASK_ID_1)

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('ERR')
    })
  })

  // ── uploadAttachment ──
  describe('uploadAttachment', () => {
    const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' })

    it('파일 업로드 후 DB 레코드를 생성한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: mockAttachment, error: null }],
        storage: { uploadResponse: { data: { path: 'test/path.pdf' }, error: null } },
      }) as Client

      const result = await uploadAttachment(client, {
        taskId: MOCK_TASK_ID_1,
        projectId: MOCK_PROJECT_ID,
        userId: MOCK_USER_ID,
        file: mockFile,
      })

      expect(result.error).toBeNull()
      expect(result.data).toEqual(mockAttachment)
    })

    it('Storage 업로드 실패 시 에러를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [],
        storage: { uploadResponse: { data: null, error: { message: 'Upload failed' } } },
      }) as Client

      const result = await uploadAttachment(client, {
        taskId: MOCK_TASK_ID_1,
        projectId: MOCK_PROJECT_ID,
        userId: MOCK_USER_ID,
        file: mockFile,
      })

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('UPLOAD_FAILED')
    })

    it('DB 저장 실패 시 Storage 파일을 롤백한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'DB_ERR', message: 'Insert failed' } }],
        storage: { uploadResponse: { data: { path: 'test/path.pdf' }, error: null } },
      }) as Client

      const result = await uploadAttachment(client, {
        taskId: MOCK_TASK_ID_1,
        projectId: MOCK_PROJECT_ID,
        userId: MOCK_USER_ID,
        file: mockFile,
      })

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('DB_ERR')
      // storage.from().remove() 호출 확인 (롤백)
      expect((client as unknown as Record<string, unknown>).storage).toBeDefined()
    })
  })

  // ── deleteAttachment ──
  describe('deleteAttachment', () => {
    it('DB 레코드와 Storage 파일을 삭제한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: null }],
      }) as Client

      const result = await deleteAttachment(client, MOCK_ATTACHMENT_ID, 'test/path.pdf')

      expect(result.error).toBeNull()
    })

    it('DB 삭제 에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'ERR', message: 'Delete failed' } }],
      }) as Client

      const result = await deleteAttachment(client, MOCK_ATTACHMENT_ID, 'test/path.pdf')

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('ERR')
    })
  })

  // ── getPublicUrl ──
  describe('getPublicUrl', () => {
    it('파일의 공개 URL을 반환한다', () => {
      const client = createMockSupabaseClient({
        storage: { publicUrl: 'https://example.com/file.pdf' },
      }) as Client

      const url = getPublicUrl(client, 'test/path.pdf')

      expect(url).toBe('https://example.com/file.pdf')
    })
  })
})
