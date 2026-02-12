import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/hooks/use-auth', () => ({
  useAuth: vi.fn(() => ({ user: { id: 'user-1' } })),
}))

vi.mock('@/queries/use-favorites', () => ({
  useFavoriteIds: vi.fn(() => ({ data: new Set(['task-1']) })),
  useToggleFavorite: vi.fn(() => ({ mutate: vi.fn() })),
}))

describe('FavoriteButton', () => {
  it('should render with correct aria label for favorited task', async () => {
    const { FavoriteButton } = await import('./favorite-button')
    render(<FavoriteButton taskId="task-1" />)
    expect(screen.getByLabelText('즐겨찾기 해제')).toBeDefined()
  })

  it('should render with correct aria label for non-favorited task', async () => {
    const { useFavoriteIds } = await import('@/queries/use-favorites')
    vi.mocked(useFavoriteIds).mockReturnValue({ data: new Set() } as never)

    const { FavoriteButton } = await import('./favorite-button')
    render(<FavoriteButton taskId="task-2" />)
    expect(screen.getByLabelText('즐겨찾기 추가')).toBeDefined()
  })
})
