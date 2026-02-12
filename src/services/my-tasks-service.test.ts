import { describe, it, expect, vi } from 'vitest'

import { getMyTasks } from './my-tasks-service'

function createMockClient(resolvedValue: { data: unknown; error: unknown }) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue(resolvedValue),
  }
  return {
    from: vi.fn(() => chain),
    _chain: chain,
  }
}

describe('my-tasks-service', () => {
  describe('getMyTasks', () => {
    it('should return tasks with project and column names', async () => {
      const mock = createMockClient({
        data: [
          {
            id: 'task-1',
            title: 'Test Task',
            project_id: 'proj-1',
            column_id: 'col-1',
            priority: 'medium',
            assignee_id: 'user-1',
            due_date: '2025-06-01',
            projects: { name: 'My Project' },
            kanban_columns: { title: '진행 중' },
          },
        ],
        error: null,
      })

      const result = await getMyTasks(mock as never, 'user-1')
      expect(result.data).toHaveLength(1)
      expect(result.data![0].project_name).toBe('My Project')
      expect(result.data![0].column_title).toBe('진행 중')
      expect(result.error).toBeNull()
    })

    it('should return error on failure', async () => {
      const mock = createMockClient({
        data: null,
        error: { code: 'ERR', message: 'DB error' },
      })

      const result = await getMyTasks(mock as never, 'user-1')
      expect(result.data).toBeNull()
      expect(result.error?.message).toBe('DB error')
    })
  })
})
