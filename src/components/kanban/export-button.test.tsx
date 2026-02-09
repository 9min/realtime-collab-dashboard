import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '@/__tests__/helpers/render-with-providers'
import { MOCK_PROJECT_ID } from '@/__tests__/helpers/fixtures'

const mockMutate = vi.fn()

vi.mock('@/components/providers/supabase-provider', () => ({
  useSupabase: () => ({}),
}))

vi.mock('@/hooks/use-export', () => ({
  useExport: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}))

import { ExportButton } from './export-button'

describe('ExportButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('내보내기 버튼을 렌더링한다', () => {
    renderWithProviders(<ExportButton projectId={MOCK_PROJECT_ID} />)
    expect(screen.getByRole('button', { name: /내보내기/ })).toBeInTheDocument()
  })

  it('버튼 클릭 시 드롭다운이 열린다', async () => {
    const user = userEvent.setup()

    renderWithProviders(<ExportButton projectId={MOCK_PROJECT_ID} />)
    await user.click(screen.getByRole('button', { name: /내보내기/ }))

    expect(screen.getByText('CSV로 내보내기')).toBeInTheDocument()
    expect(screen.getByText('JSON으로 내보내기')).toBeInTheDocument()
  })

  it('CSV 내보내기 클릭 시 csv 포맷으로 mutate를 호출한다', async () => {
    const user = userEvent.setup()

    renderWithProviders(<ExportButton projectId={MOCK_PROJECT_ID} />)
    await user.click(screen.getByRole('button', { name: /내보내기/ }))
    await user.click(screen.getByText('CSV로 내보내기'))

    expect(mockMutate).toHaveBeenCalledWith('csv')
  })

  it('JSON 내보내기 클릭 시 json 포맷으로 mutate를 호출한다', async () => {
    const user = userEvent.setup()

    renderWithProviders(<ExportButton projectId={MOCK_PROJECT_ID} />)
    await user.click(screen.getByRole('button', { name: /내보내기/ }))
    await user.click(screen.getByText('JSON으로 내보내기'))

    expect(mockMutate).toHaveBeenCalledWith('json')
  })
})
