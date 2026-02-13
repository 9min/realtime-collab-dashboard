import { DEMO_USER_ID } from './constants'

type PresenceState = Record<string, unknown[]>
type RealtimeCallback = (...args: unknown[]) => void

interface MockChannel {
  on: (type: string, filter: unknown, callback?: RealtimeCallback) => MockChannel
  subscribe: (callback?: (status: string, err?: unknown) => void) => MockChannel
  unsubscribe: () => Promise<void>
  untrack: () => Promise<void>
  track: (payload: Record<string, unknown>) => Promise<void>
  presenceState: () => PresenceState
  send: (payload: unknown) => Promise<void>
}

export function createMockRealtimeChannel(channelName: string): MockChannel {
  const presenceData: PresenceState = {
    [DEMO_USER_ID]: [
      {
        user_id: DEMO_USER_ID,
        full_name: '데모 사용자',
        avatar_url: null,
        online_at: new Date().toISOString(),
      },
    ],
  }

  let syncCallback: RealtimeCallback | null = null

  const channel: MockChannel = {
    on(type: string, filter: unknown, callback?: RealtimeCallback) {
      // presence sync 이벤트 캡처
      if (
        type === 'presence' &&
        typeof filter === 'object' &&
        filter !== null &&
        (filter as Record<string, unknown>)['event'] === 'sync'
      ) {
        syncCallback = callback ?? null
      }
      // postgres_changes 등은 no-op (데모에서는 realtime 이벤트 없음)
      return channel
    },

    subscribe(callback?: (status: string, err?: unknown) => void) {
      // 즉시 SUBSCRIBED 반환
      setTimeout(() => {
        callback?.('SUBSCRIBED')
        // presence sync 트리거
        syncCallback?.()
      }, 0)
      return channel
    },

    async unsubscribe() {
      // no-op
    },

    async untrack() {
      // no-op
    },

    async track(payload: Record<string, unknown>) {
      const userId = (payload['user_id'] as string) ?? DEMO_USER_ID
      presenceData[userId] = [payload]
      // sync 이벤트 트리거
      syncCallback?.()
    },

    presenceState() {
      return presenceData
    },

    async send() {
      // no-op
    },
  }

  void channelName
  return channel
}

export function createMockRealtime() {
  return {
    setAuth: () => {
      // no-op
    },
  }
}
