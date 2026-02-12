import { describe, it, expect, vi } from 'vitest'

import { getRecurrence, getProjectRecurrenceTaskIds, createRecurrence, deleteRecurrence } from './recurrence-service'

describe('recurrence-service', () => {
  describe('getRecurrence', () => {
    it('should return null when no recurrence', async () => {
      const mock = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            })),
          })),
        })),
      }

      const result = await getRecurrence(mock as never, 'task-1')
      expect(result.data).toBeNull()
      expect(result.error).toBeNull()
    })

    it('should return recurrence when exists', async () => {
      const rec = { id: 'rec-1', task_id: 'task-1', frequency: 'weekly' }
      const mock = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({ data: rec, error: null }),
            })),
          })),
        })),
      }

      const result = await getRecurrence(mock as never, 'task-1')
      expect(result.data).toBeDefined()
      expect(result.error).toBeNull()
    })
  })

  describe('getProjectRecurrenceTaskIds', () => {
    it('should return task ids', async () => {
      const secondEq = vi.fn().mockResolvedValue({
        data: [{ task_id: 'task-1' }, { task_id: 'task-2' }],
        error: null,
      })
      const firstEq = vi.fn(() => ({ eq: secondEq }))
      const mock = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({ eq: firstEq })),
        })),
      }

      const result = await getProjectRecurrenceTaskIds(mock as never, 'proj-1')
      expect(result.data).toEqual(['task-1', 'task-2'])
    })
  })

  describe('createRecurrence', () => {
    it('should return created recurrence', async () => {
      const rec = { id: 'rec-1', task_id: 'task-1' }
      const mock = {
        from: vi.fn(() => ({
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: rec, error: null }),
            })),
          })),
        })),
      }

      const result = await createRecurrence(mock as never, {
        task_id: 'task-1',
        project_id: 'proj-1',
        frequency: 'weekly',
        next_due_date: '2025-06-01',
        created_by: 'user-1',
      })
      expect(result.data).toBeDefined()
      expect(result.error).toBeNull()
    })
  })

  describe('deleteRecurrence', () => {
    it('should return success', async () => {
      const mock = {
        from: vi.fn(() => ({
          delete: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ error: null }),
          })),
        })),
      }

      const result = await deleteRecurrence(mock as never, 'rec-1')
      expect(result.data).toBeNull()
      expect(result.error).toBeNull()
    })
  })
})
