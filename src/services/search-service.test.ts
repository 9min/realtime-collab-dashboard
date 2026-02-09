import { describe, it, expect } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database'
import { createMockSupabaseClient } from '@/__tests__/helpers/mock-supabase'

import { globalSearch } from './search-service'

type Client = SupabaseClient<Database>

describe('search-service', () => {
  describe('globalSearch', () => {
    it('검색 결과를 그룹별로 반환한다', async () => {
      const projectData = [{ id: 'p1', name: 'Test Project', description: null }]
      const taskData = [{ id: 't1', title: 'Test Task', project_id: 'p1', column_id: 'c1', projects: { name: 'Test Project' } }]
      const commentData = [{ id: 'cm1', content: 'Test comment', task_id: 't1', project_id: 'p1', tasks: { title: 'Test Task' } }]

      const client = createMockSupabaseClient({
        fromResponses: [
          { data: projectData, error: null },
          { data: taskData, error: null },
          { data: commentData, error: null },
        ],
      }) as Client

      const result = await globalSearch(client, 'Test')

      expect(result.error).toBeNull()
      expect(result.data?.projects).toHaveLength(1)
      expect(result.data?.projects[0].name).toBe('Test Project')
      expect(result.data?.tasks).toHaveLength(1)
      expect(result.data?.tasks[0].title).toBe('Test Task')
      expect(result.data?.comments).toHaveLength(1)
      expect(result.data?.comments[0].content).toBe('Test comment')
    })

    it('프로젝트 검색 에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [
          { data: null, error: { code: 'PGRST301', message: 'DB error' } },
          { data: [], error: null },
          { data: [], error: null },
        ],
      }) as Client

      const result = await globalSearch(client, 'Test')

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('PGRST301')
    })

    it('빈 쿼리에도 빈 결과를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [
          { data: [], error: null },
          { data: [], error: null },
          { data: [], error: null },
        ],
      }) as Client

      const result = await globalSearch(client, '')

      expect(result.error).toBeNull()
      expect(result.data?.projects).toHaveLength(0)
      expect(result.data?.tasks).toHaveLength(0)
      expect(result.data?.comments).toHaveLength(0)
    })

    it('긴 댓글 내용은 100자로 잘린다', async () => {
      const longContent = 'A'.repeat(150)
      const client = createMockSupabaseClient({
        fromResponses: [
          { data: [], error: null },
          { data: [], error: null },
          { data: [{ id: 'cm1', content: longContent, task_id: 't1', project_id: 'p1', tasks: { title: 'Task' } }], error: null },
        ],
      }) as Client

      const result = await globalSearch(client, 'A')

      expect(result.data?.comments[0].content).toHaveLength(103) // 100 + '...'
      expect(result.data?.comments[0].content.endsWith('...')).toBe(true)
    })
  })
})
