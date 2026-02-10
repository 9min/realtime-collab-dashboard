import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '@/__tests__/helpers/render-with-providers'
import { mockNotification, mockProfile2 } from '@/__tests__/helpers/fixtures'
import type { NotificationWithActor } from '@/types/notification'

import { NotificationItem } from './notification-item'

function createNotification(overrides: Partial<NotificationWithActor> = {}): NotificationWithActor {
  return {
    ...mockNotification,
    ...overrides,
  } as NotificationWithActor
}

describe('NotificationItem', () => {
  const mockOnClick = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('알림 메시지를 렌더링한다', () => {
    const notification = createNotification()
    renderWithProviders(<NotificationItem notification={notification} onClick={mockOnClick} />)

    expect(screen.getByText('Other User commented on Task 1')).toBeInTheDocument()
  })

  it('읽지 않은 알림에 파란 점 인디케이터를 표시한다', () => {
    const notification = createNotification({ is_read: false })
    const { container } = renderWithProviders(
      <NotificationItem notification={notification} onClick={mockOnClick} />,
    )

    // Unread indicator: small blue dot
    const dot = container.querySelector('.bg-blue-500')
    expect(dot).toBeInTheDocument()
  })

  it('읽은 알림에는 파란 점 인디케이터를 표시하지 않는다', () => {
    const notification = createNotification({ is_read: true })
    const { container } = renderWithProviders(
      <NotificationItem notification={notification} onClick={mockOnClick} />,
    )

    const dot = container.querySelector('.rounded-full.bg-blue-500')
    expect(dot).not.toBeInTheDocument()
  })

  it('읽지 않은 알림 메시지에 font-medium 스타일을 적용한다', () => {
    const notification = createNotification({ is_read: false })
    renderWithProviders(<NotificationItem notification={notification} onClick={mockOnClick} />)

    const message = screen.getByText('Other User commented on Task 1')
    expect(message).toHaveClass('font-medium')
  })

  it('읽은 알림 메시지에 font-medium 스타일을 적용하지 않는다', () => {
    const notification = createNotification({ is_read: true })
    renderWithProviders(<NotificationItem notification={notification} onClick={mockOnClick} />)

    const message = screen.getByText('Other User commented on Task 1')
    expect(message).not.toHaveClass('font-medium')
  })

  it('타임스탬프를 렌더링한다', () => {
    // Use a recent timestamp for "방금 전"
    const notification = createNotification({
      created_at: new Date().toISOString(),
    })
    renderWithProviders(<NotificationItem notification={notification} onClick={mockOnClick} />)

    expect(screen.getByText('방금 전')).toBeInTheDocument()
  })

  it('actor 이름을 표시한다', () => {
    const notification = createNotification({ actor: mockProfile2 })
    renderWithProviders(<NotificationItem notification={notification} onClick={mockOnClick} />)

    expect(screen.getByText('Other User')).toBeInTheDocument()
  })

  it('actor가 없으면 actor 이름을 표시하지 않는다', () => {
    const notification = createNotification({ actor: null })
    renderWithProviders(<NotificationItem notification={notification} onClick={mockOnClick} />)

    expect(screen.queryByText('Other User')).not.toBeInTheDocument()
  })

  it('클릭 시 onClick 콜백을 호출한다', async () => {
    const user = userEvent.setup()
    const notification = createNotification()
    renderWithProviders(<NotificationItem notification={notification} onClick={mockOnClick} />)

    await user.click(screen.getByRole('button'))

    expect(mockOnClick).toHaveBeenCalledTimes(1)
    expect(mockOnClick).toHaveBeenCalledWith(notification)
  })

  it('task_assigned 타입 알림을 렌더링한다', () => {
    const notification = createNotification({ type: 'task_assigned' })
    renderWithProviders(<NotificationItem notification={notification} onClick={mockOnClick} />)

    expect(screen.getByText('Other User commented on Task 1')).toBeInTheDocument()
  })

  it('mentioned 타입 알림을 렌더링한다', () => {
    const notification = createNotification({
      type: 'mentioned',
      message: 'You were mentioned in a comment',
    })
    renderWithProviders(<NotificationItem notification={notification} onClick={mockOnClick} />)

    expect(screen.getByText('You were mentioned in a comment')).toBeInTheDocument()
  })

  it('due_soon 타입 알림을 렌더링한다', () => {
    const notification = createNotification({
      type: 'due_soon',
      message: 'Task is due tomorrow',
    })
    renderWithProviders(<NotificationItem notification={notification} onClick={mockOnClick} />)

    expect(screen.getByText('Task is due tomorrow')).toBeInTheDocument()
  })
})
