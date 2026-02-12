import { describe, it, expect, vi } from 'vitest'

import { getMyFavoriteIds, addFavorite, removeFavorite, getFavoriteTasks } from './favorite-service'

describe('favorite-service', () => {
  describe('getMyFavoriteIds', () => {
    it('should return task ids on success', async () => {
      const eq = vi.fn().mockResolvedValue({
        data: [{ task_id: 'task-1' }, { task_id: 'task-2' }],
        error: null,
      })
      const mock = {
        from: vi.fn(() => ({ select: vi.fn(() => ({ eq })) })),
      }

      const result = await getMyFavoriteIds(mock as never, 'user-1')
      expect(result.data).toEqual(['task-1', 'task-2'])
      expect(result.error).toBeNull()
    })

    it('should return error on failure', async () => {
      const eq = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'ERR', message: 'DB error' },
      })
      const mock = {
        from: vi.fn(() => ({ select: vi.fn(() => ({ eq })) })),
      }

      const result = await getMyFavoriteIds(mock as never, 'user-1')
      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('ERR')
    })
  })

  describe('addFavorite', () => {
    it('should return favorite on success', async () => {
      const fav = { id: 'fav-1', user_id: 'user-1', task_id: 'task-1', created_at: '2025-01-01' }
      const mock = {
        from: vi.fn(() => ({
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: fav, error: null }),
            })),
          })),
        })),
      }

      const result = await addFavorite(mock as never, 'user-1', 'task-1')
      expect(result.data).toBeDefined()
      expect(result.error).toBeNull()
    })
  })

  describe('removeFavorite', () => {
    it('should return success on delete', async () => {
      const secondEq = vi.fn().mockResolvedValue({ error: null })
      const firstEq = vi.fn(() => ({ eq: secondEq }))
      const mock = {
        from: vi.fn(() => ({
          delete: vi.fn(() => ({ eq: firstEq })),
        })),
      }

      const result = await removeFavorite(mock as never, 'user-1', 'task-1')
      expect(result.data).toBeNull()
      expect(result.error).toBeNull()
    })
  })

  describe('getFavoriteTasks', () => {
    it('should return empty array when no favorites', async () => {
      const mock = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            })),
          })),
        })),
      }

      const result = await getFavoriteTasks(mock as never, 'user-1')
      expect(result.data).toEqual([])
      expect(result.error).toBeNull()
    })
  })
})
