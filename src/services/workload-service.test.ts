import { describe, it, expect, vi } from 'vitest'

import { getWorkload } from './workload-service'

describe('workload-service', () => {
  describe('getWorkload', () => {
    it('should aggregate tasks by member and priority', async () => {
      const members = [
        {
          user_id: 'user-1',
          profiles: { full_name: 'Alice', email: 'alice@test.com', avatar_url: null },
        },
        {
          user_id: 'user-2',
          profiles: { full_name: 'Bob', email: 'bob@test.com', avatar_url: null },
        },
      ]

      const tasks = [
        { assignee_id: 'user-1', priority: 'high' },
        { assignee_id: 'user-1', priority: 'medium' },
        { assignee_id: 'user-2', priority: 'low' },
      ]

      const selectFn = vi.fn()
      const eqFn = vi.fn()
      const notFn = vi.fn()
      const neqFn = vi.fn()

      const mock = {
        from: vi.fn((table: string) => {
          if (table === 'project_members') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: members, error: null }),
              }),
            }
          }
          if (table === 'kanban_columns') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ data: [{ id: 'done-col' }], error: null }),
                }),
              }),
            }
          }
          // tasks
          selectFn.mockReturnValue({ eq: eqFn })
          eqFn.mockReturnValue({ not: notFn })
          notFn.mockReturnValue({ neq: neqFn })
          neqFn.mockResolvedValue({ data: tasks, error: null })
          return { select: selectFn }
        }),
      }

      const result = await getWorkload(mock as never, 'proj-1')
      expect(result.error).toBeNull()
      expect(result.data).toBeDefined()
      expect(result.data!.length).toBe(2)

      const alice = result.data!.find((m) => m.userId === 'user-1')
      expect(alice?.totalTasks).toBe(2)
      expect(alice?.tasksByPriority.high).toBe(1)
      expect(alice?.tasksByPriority.medium).toBe(1)

      const bob = result.data!.find((m) => m.userId === 'user-2')
      expect(bob?.totalTasks).toBe(1)
      expect(bob?.tasksByPriority.low).toBe(1)
    })

    it('should return error when members query fails', async () => {
      const mock = {
        from: vi.fn(() => ({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'ERR', message: 'Failed' },
            }),
          }),
        })),
      }

      const result = await getWorkload(mock as never, 'proj-1')
      expect(result.data).toBeNull()
      expect(result.error?.message).toBe('Failed')
    })
  })
})
