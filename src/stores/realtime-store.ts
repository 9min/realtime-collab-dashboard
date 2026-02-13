import { create } from 'zustand'

const CONNECTION_STATUS = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  RECONNECTING: 'reconnecting',
} as const

type ConnectionStatus = (typeof CONNECTION_STATUS)[keyof typeof CONNECTION_STATUS]

interface RealtimeState {
  status: ConnectionStatus
  retryCount: number
  lastConnectedAt: number | null
  setStatus: (status: ConnectionStatus) => void
  incrementRetry: () => void
  resetRetry: () => void
  setConnected: () => void
}

export { CONNECTION_STATUS }

export const useRealtimeStore = create<RealtimeState>((set) => ({
  status: CONNECTION_STATUS.DISCONNECTED,
  retryCount: 0,
  lastConnectedAt: null,

  setStatus: (status) => set({ status }),

  incrementRetry: () => set((state) => ({ retryCount: state.retryCount + 1 })),

  resetRetry: () => set({ retryCount: 0 }),

  setConnected: () =>
    set({
      status: CONNECTION_STATUS.CONNECTED,
      retryCount: 0,
      lastConnectedAt: Date.now(),
    }),
}))
