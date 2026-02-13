import { create } from 'zustand'

interface TimerState {
  activeTaskId: string | null
  activeProjectId: string | null
  startedAt: number | null
  elapsedSeconds: number
  isRunning: boolean
  startTimer: (taskId: string, projectId: string) => void
  stopTimer: () => { taskId: string; projectId: string; durationMinutes: number } | null
  resetTimer: () => void
  tick: () => void
}

export const useTimerStore = create<TimerState>((set, get) => ({
  activeTaskId: null,
  activeProjectId: null,
  startedAt: null,
  elapsedSeconds: 0,
  isRunning: false,

  startTimer: (taskId, projectId) =>
    set({
      activeTaskId: taskId,
      activeProjectId: projectId,
      startedAt: Date.now(),
      elapsedSeconds: 0,
      isRunning: true,
    }),

  stopTimer: () => {
    const { activeTaskId, activeProjectId, elapsedSeconds, isRunning } = get()
    if (!isRunning || !activeTaskId || !activeProjectId) return null

    const durationMinutes = Math.max(1, Math.round(elapsedSeconds / 60))

    set({
      activeTaskId: null,
      activeProjectId: null,
      startedAt: null,
      elapsedSeconds: 0,
      isRunning: false,
    })

    return { taskId: activeTaskId, projectId: activeProjectId, durationMinutes }
  },

  resetTimer: () =>
    set({
      activeTaskId: null,
      activeProjectId: null,
      startedAt: null,
      elapsedSeconds: 0,
      isRunning: false,
    }),

  tick: () => {
    const { startedAt, isRunning } = get()
    if (!isRunning || !startedAt) return
    set({ elapsedSeconds: Math.floor((Date.now() - startedAt) / 1000) })
  },
}))
