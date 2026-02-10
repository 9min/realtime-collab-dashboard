import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'

import { renderWithProviders } from '@/__tests__/helpers/render-with-providers'

const mockUseRealtimeStore = vi.fn()

vi.mock('@/stores/realtime-store', () => ({
  CONNECTION_STATUS: {
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    DISCONNECTED: 'disconnected',
    RECONNECTING: 'reconnecting',
  },
  useRealtimeStore: (...args: unknown[]) => mockUseRealtimeStore(...args),
}))

import { ConnectionStatus } from './connection-status'

describe('ConnectionStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('연결됨 상태를 표시한다', () => {
    mockUseRealtimeStore.mockReturnValue({ status: 'connected' })

    renderWithProviders(<ConnectionStatus />)

    const statusEl = screen.getByRole('status')
    expect(statusEl).toHaveAttribute('aria-label', '실시간 연결됨')
  })

  it('연결 중 상태를 표시한다', () => {
    mockUseRealtimeStore.mockReturnValue({ status: 'connecting' })

    renderWithProviders(<ConnectionStatus />)

    const statusEl = screen.getByRole('status')
    expect(statusEl).toHaveAttribute('aria-label', '연결 중...')
  })

  it('재연결 중 상태를 표시한다', () => {
    mockUseRealtimeStore.mockReturnValue({ status: 'reconnecting' })

    renderWithProviders(<ConnectionStatus />)

    const statusEl = screen.getByRole('status')
    expect(statusEl).toHaveAttribute('aria-label', '재연결 중...')
  })

  it('연결 끊김 상태를 표시한다', () => {
    mockUseRealtimeStore.mockReturnValue({ status: 'disconnected' })

    renderWithProviders(<ConnectionStatus />)

    const statusEl = screen.getByRole('status')
    expect(statusEl).toHaveAttribute('aria-label', '연결 끊김')
  })

  it('연결됨 상태에서 emerald 색상 클래스를 적용한다', () => {
    mockUseRealtimeStore.mockReturnValue({ status: 'connected' })

    const { container } = renderWithProviders(<ConnectionStatus />)

    const icon = container.querySelector('svg')
    expect(icon).toHaveClass('text-emerald-500')
  })

  it('연결 중 상태에서 blue 색상과 spin 클래스를 적용한다', () => {
    mockUseRealtimeStore.mockReturnValue({ status: 'connecting' })

    const { container } = renderWithProviders(<ConnectionStatus />)

    const icon = container.querySelector('svg')
    expect(icon).toHaveClass('text-blue-500')
    expect(icon).toHaveClass('animate-spin')
  })

  it('재연결 중 상태에서 amber 색상과 spin 클래스를 적용한다', () => {
    mockUseRealtimeStore.mockReturnValue({ status: 'reconnecting' })

    const { container } = renderWithProviders(<ConnectionStatus />)

    const icon = container.querySelector('svg')
    expect(icon).toHaveClass('text-amber-500')
    expect(icon).toHaveClass('animate-spin')
  })

  it('연결 끊김 상태에서 red 색상 클래스를 적용한다', () => {
    mockUseRealtimeStore.mockReturnValue({ status: 'disconnected' })

    const { container } = renderWithProviders(<ConnectionStatus />)

    const icon = container.querySelector('svg')
    expect(icon).toHaveClass('text-red-500')
  })
})
