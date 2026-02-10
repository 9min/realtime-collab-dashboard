import { describe, it, expect, beforeEach } from 'vitest'
import { CONNECTION_STATUS, useRealtimeStore } from './realtime-store'

describe('realtime-store', () => {
  beforeEach(() => {
    useRealtimeStore.setState({
      status: CONNECTION_STATUS.DISCONNECTED,
      retryCount: 0,
      lastConnectedAt: null,
    })
  })

  it('초기 상태는 disconnected, retryCount 0', () => {
    const state = useRealtimeStore.getState()
    expect(state.status).toBe(CONNECTION_STATUS.DISCONNECTED)
    expect(state.retryCount).toBe(0)
    expect(state.lastConnectedAt).toBeNull()
  })

  it('setStatus로 상태 변경', () => {
    useRealtimeStore.getState().setStatus(CONNECTION_STATUS.CONNECTING)
    expect(useRealtimeStore.getState().status).toBe(CONNECTION_STATUS.CONNECTING)

    useRealtimeStore.getState().setStatus(CONNECTION_STATUS.RECONNECTING)
    expect(useRealtimeStore.getState().status).toBe(CONNECTION_STATUS.RECONNECTING)
  })

  it('incrementRetry로 재시도 횟수 증가', () => {
    useRealtimeStore.getState().incrementRetry()
    expect(useRealtimeStore.getState().retryCount).toBe(1)

    useRealtimeStore.getState().incrementRetry()
    expect(useRealtimeStore.getState().retryCount).toBe(2)
  })

  it('resetRetry로 재시도 횟수 초기화', () => {
    useRealtimeStore.getState().incrementRetry()
    useRealtimeStore.getState().incrementRetry()
    expect(useRealtimeStore.getState().retryCount).toBe(2)

    useRealtimeStore.getState().resetRetry()
    expect(useRealtimeStore.getState().retryCount).toBe(0)
  })

  it('setConnected로 연결 상태 + 재시도 초기화 + 타임스탬프 설정', () => {
    useRealtimeStore.getState().setStatus(CONNECTION_STATUS.RECONNECTING)
    useRealtimeStore.getState().incrementRetry()
    useRealtimeStore.getState().incrementRetry()

    const before = Date.now()
    useRealtimeStore.getState().setConnected()
    const after = Date.now()

    const state = useRealtimeStore.getState()
    expect(state.status).toBe(CONNECTION_STATUS.CONNECTED)
    expect(state.retryCount).toBe(0)
    expect(state.lastConnectedAt).toBeGreaterThanOrEqual(before)
    expect(state.lastConnectedAt).toBeLessThanOrEqual(after)
  })

  it('CONNECTION_STATUS 상수값 확인', () => {
    expect(CONNECTION_STATUS.CONNECTING).toBe('connecting')
    expect(CONNECTION_STATUS.CONNECTED).toBe('connected')
    expect(CONNECTION_STATUS.DISCONNECTED).toBe('disconnected')
    expect(CONNECTION_STATUS.RECONNECTING).toBe('reconnecting')
  })
})
