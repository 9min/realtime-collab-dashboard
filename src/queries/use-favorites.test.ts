import { describe, it, expect, vi } from 'vitest'

vi.mock('@/components/providers/supabase-provider', () => ({
  useSupabase: vi.fn(() => ({})),
}))

vi.mock('@/services/favorite-service', () => ({
  getMyFavoriteIds: vi.fn(),
  addFavorite: vi.fn(),
  removeFavorite: vi.fn(),
  getFavoriteTasks: vi.fn(),
}))

describe('use-favorites', () => {
  it('should export favoriteKeys', async () => {
    const { favoriteKeys } = await import('./use-favorites')
    expect(favoriteKeys.ids('user-1')).toEqual(['favorite-ids', 'user-1'])
    expect(favoriteKeys.tasks('user-1')).toEqual(['favorite-tasks', 'user-1'])
  })
})
