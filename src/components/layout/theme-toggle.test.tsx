import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '@/__tests__/helpers/render-with-providers'

const mockSetTheme = vi.fn()

vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: mockSetTheme,
  }),
}))

import { ThemeToggle } from './theme-toggle'

describe('ThemeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('토글 버튼을 렌더링한다', () => {
    renderWithProviders(<ThemeToggle />)

    const button = screen.getByRole('button', { name: '테마 변경' })
    expect(button).toBeInTheDocument()
  })

  it('드롭다운 메뉴에 테마 옵션이 표시된다', async () => {
    const user = userEvent.setup()

    renderWithProviders(<ThemeToggle />)

    await user.click(screen.getByRole('button', { name: '테마 변경' }))

    expect(screen.getByText('라이트')).toBeInTheDocument()
    expect(screen.getByText('다크')).toBeInTheDocument()
    expect(screen.getByText('시스템')).toBeInTheDocument()
  })

  it('다크 테마를 클릭하면 setTheme("dark")를 호출한다', async () => {
    const user = userEvent.setup()

    renderWithProviders(<ThemeToggle />)

    await user.click(screen.getByRole('button', { name: '테마 변경' }))
    await user.click(screen.getByText('다크'))

    expect(mockSetTheme).toHaveBeenCalledWith('dark')
  })

  it('라이트 테마를 클릭하면 setTheme("light")를 호출한다', async () => {
    const user = userEvent.setup()

    renderWithProviders(<ThemeToggle />)

    await user.click(screen.getByRole('button', { name: '테마 변경' }))
    await user.click(screen.getByText('라이트'))

    expect(mockSetTheme).toHaveBeenCalledWith('light')
  })

  it('시스템 테마를 클릭하면 setTheme("system")를 호출한다', async () => {
    const user = userEvent.setup()

    renderWithProviders(<ThemeToggle />)

    await user.click(screen.getByRole('button', { name: '테마 변경' }))
    await user.click(screen.getByText('시스템'))

    expect(mockSetTheme).toHaveBeenCalledWith('system')
  })
})
