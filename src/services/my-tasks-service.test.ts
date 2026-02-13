import { describe, it, expect, vi } from 'vitest'

import { getMyTasks } from './my-tasks-service'

function createMockClient(opts: {
  assigneeEntries?: { task_id: string }[]
  assigneeError?: { code: string; message: string } | null
  tasksData?: unknown[]
  tasksError?: { code: string; message: string } | null
}) {
  const { assigneeEntries = [], assigneeError = null, tasksData = [], tasksError = null } = opts

  return {
    from: vi.fn((table: string) => {
      if (table === 'task_assignees') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: assigneeEntries,
              error: assigneeError,
            }),
          }),
        }
      }
      // tasks: select() → order() → eq() or or()
      const resolve = { data: tasksData, error: tasksError }
      const eqFn = vi.fn().mockResolvedValue(resolve)
      const orFn = vi.fn().mockResolvedValue(resolve)
      const orderFn = vi.fn().mockReturnValue({ eq: eqFn, or: orFn })
      return {
        select: vi.fn().mockReturnValue({ order: orderFn }),
      }
    }),
  }
}

describe('my-tasks-service', () => {
  describe('getMyTasks', () => {
    it('should return tasks with project and column names', async () => {
      const mock = createMockClient({
        assigneeEntries: [],
        tasksData: [
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
      })

      const result = await getMyTasks(mock as never, 'user-1')
      expect(result.data).toHaveLength(1)
      expect(result.data![0].project_name).toBe('My Project')
      expect(result.data![0].column_title).toBe('진행 중')
      expect(result.error).toBeNull()
    })

    it('should return error on failure', async () => {
      const mock = createMockClient({
        assigneeEntries: [],
        tasksData: null as unknown as unknown[],
        tasksError: { code: 'ERR', message: 'DB error' },
      })

      const result = await getMyTasks(mock as never, 'user-1')
      expect(result.data).toBeNull()
      expect(result.error?.message).toBe('DB error')
    })

    it('should include tasks from task_assignees', async () => {
      const mock = createMockClient({
        assigneeEntries: [{ task_id: 'task-2' }],
        tasksData: [
          {
            id: 'task-2',
            title: 'Assigned Task',
            project_id: 'proj-1',
            column_id: 'col-1',
            priority: 'high',
            assignee_id: null,
            due_date: null,
            projects: { name: 'Project' },
            kanban_columns: { title: 'To Do' },
          },
        ],
      })

      const result = await getMyTasks(mock as never, 'user-1')
      expect(result.data).toHaveLength(1)
      expect(result.data![0].title).toBe('Assigned Task')
      expect(result.error).toBeNull()
    })
  })
})
