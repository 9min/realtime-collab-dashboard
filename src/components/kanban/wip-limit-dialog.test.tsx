import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '@/__tests__/helpers/render-with-providers'

import { WipLimitDialog } from './wip-limit-dialog'

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  columnTitle: '진행 중',
  currentLimit: 5,
  onSave: vi.fn(),
}

describe('WipLimitDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('다이얼로그에 컬럼 제목을 포함한 설명을 렌더링한다', () => {
    renderWithProviders(<WipLimitDialog {...defaultProps} />)

    expect(screen.getByText('WIP 제한 설정')).toBeInTheDocument()
    expect(screen.getByText(/진행 중/, { exact: false })).toBeInTheDocument()
  })

  it('현재 WIP 제한이 있을 때 활성화 스위치가 켜져 있다', () => {
    renderWithProviders(<WipLimitDialog {...defaultProps} currentLimit={5} />)

    const toggle = screen.getByRole('switch', { name: 'WIP 제한 활성화' })
    expect(toggle).toBeChecked()
  })

  it('현재 WIP 제한이 null이면 활성화 스위치가 꺼져 있다', () => {
    renderWithProviders(<WipLimitDialog {...defaultProps} currentLimit={null} />)

    const toggle = screen.getByRole('switch', { name: 'WIP 제한 활성화' })
    expect(toggle).not.toBeChecked()
  })

  it('WIP 제한이 활성화되면 입력 필드에 현재 값이 표시된다', () => {
    renderWithProviders(<WipLimitDialog {...defaultProps} currentLimit={5} />)

    const input = screen.getByLabelText('최대 태스크 수')
    expect(input).toHaveValue(5)
  })

  it('입력 필드에 새 값을 입력할 수 있다', async () => {
    const user = userEvent.setup()
    renderWithProviders(<WipLimitDialog {...defaultProps} currentLimit={5} />)

    const input = screen.getByLabelText('최대 태스크 수')
    await user.clear(input)
    await user.type(input, '10')

    expect(input).toHaveValue(10)
  })

  it('저장 버튼 클릭 시 onSave 콜백을 호출한다', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    renderWithProviders(<WipLimitDialog {...defaultProps} onSave={onSave} currentLimit={5} />)

    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(onSave).toHaveBeenCalledWith(5)
  })

  it('새 값을 입력 후 저장하면 해당 값으로 onSave를 호출한다', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    renderWithProviders(<WipLimitDialog {...defaultProps} onSave={onSave} currentLimit={5} />)

    const input = screen.getByLabelText('최대 태스크 수')
    await user.clear(input)
    await user.type(input, '8')
    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(onSave).toHaveBeenCalledWith(8)
  })

  it('취소 버튼 클릭 시 onOpenChange(false)를 호출한다', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    renderWithProviders(<WipLimitDialog {...defaultProps} onOpenChange={onOpenChange} />)

    await user.click(screen.getByRole('button', { name: '취소' }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('WIP 스위치를 끄고 저장하면 null로 onSave를 호출한다', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    renderWithProviders(<WipLimitDialog {...defaultProps} onSave={onSave} currentLimit={5} />)

    // 스위치를 꺼서 WIP 제한 비활성화
    const toggle = screen.getByRole('switch', { name: 'WIP 제한 활성화' })
    await user.click(toggle)

    // 저장
    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(onSave).toHaveBeenCalledWith(null)
  })

  it('WIP 제한이 비활성화되면 입력 필드가 숨겨진다', async () => {
    const user = userEvent.setup()
    renderWithProviders(<WipLimitDialog {...defaultProps} currentLimit={null} />)

    // currentLimit이 null이면 스위치가 꺼져 있고 입력 필드가 없어야 함
    expect(screen.queryByLabelText('최대 태스크 수')).not.toBeInTheDocument()

    // 스위치를 켜면 입력 필드가 나타남
    const toggle = screen.getByRole('switch', { name: 'WIP 제한 활성화' })
    await user.click(toggle)

    expect(screen.getByLabelText('최대 태스크 수')).toBeInTheDocument()
  })

  it('isPending이 true이면 저장 버튼이 비활성화된다', () => {
    renderWithProviders(<WipLimitDialog {...defaultProps} isPending={true} />)

    expect(screen.getByRole('button', { name: '저장' })).toBeDisabled()
  })

  it('open이 false이면 다이얼로그가 렌더링되지 않는다', () => {
    renderWithProviders(<WipLimitDialog {...defaultProps} open={false} />)

    expect(screen.queryByText('WIP 제한 설정')).not.toBeInTheDocument()
  })
})
