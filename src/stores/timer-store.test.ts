import { describe, it, expect, beforeEach, vi } from 'vitest'

import { useTimerStore } from './timer-store'

describe('useTimerStore', () => {
  beforeEach(() => {
    useTimerStore.setState({
      activeTaskId: null,
      activeProjectId: null,
      startedAt: null,
      elapsedSeconds: 0,
      isRunning: false,
    })
  })

  describe('startTimer', () => {
    it('타이머를 시작한다', () => {
      const now = Date.now()
      vi.spyOn(Date, 'now').mockReturnValue(now)

      useTimerStore.getState().startTimer('task-1', 'project-1')

      const state = useTimerStore.getState()
      expect(state.activeTaskId).toBe('task-1')
      expect(state.activeProjectId).toBe('project-1')
      expect(state.startedAt).toBe(now)
      expect(state.elapsedSeconds).toBe(0)
      expect(state.isRunning).toBe(true)

      vi.restoreAllMocks()
    })
  })

  describe('stopTimer', () => {
    it('타이머를 멈추고 기록 데이터를 반환한다', () => {
      const now = Date.now()
      vi.spyOn(Date, 'now').mockReturnValue(now)

      useTimerStore.getState().startTimer('task-1', 'project-1')
      // Simulate 5 minutes elapsed
      useTimerStore.setState({ elapsedSeconds: 300 })

      const result = useTimerStore.getState().stopTimer()

      expect(result).toEqual({
        taskId: 'task-1',
        projectId: 'project-1',
        durationMinutes: 5,
      })

      const state = useTimerStore.getState()
      expect(state.isRunning).toBe(false)
      expect(state.activeTaskId).toBeNull()

      vi.restoreAllMocks()
    })

    it('타이머가 실행 중이 아니면 null을 반환한다', () => {
      const result = useTimerStore.getState().stopTimer()
      expect(result).toBeNull()
    })

    it('최소 1분으로 반올림한다', () => {
      useTimerStore.getState().startTimer('task-1', 'project-1')
      // Simulate 10 seconds elapsed
      useTimerStore.setState({ elapsedSeconds: 10 })

      const result = useTimerStore.getState().stopTimer()

      expect(result?.durationMinutes).toBe(1)
    })
  })

  describe('resetTimer', () => {
    it('타이머를 초기화한다', () => {
      useTimerStore.getState().startTimer('task-1', 'project-1')
      useTimerStore.setState({ elapsedSeconds: 100 })

      useTimerStore.getState().resetTimer()

      const state = useTimerStore.getState()
      expect(state.isRunning).toBe(false)
      expect(state.activeTaskId).toBeNull()
      expect(state.elapsedSeconds).toBe(0)
    })
  })

  describe('tick', () => {
    it('경과 시간을 업데이트한다', () => {
      const baseTime = 1700000000000
      vi.spyOn(Date, 'now').mockReturnValue(baseTime)
      useTimerStore.getState().startTimer('task-1', 'project-1')

      // Simulate 5 seconds later
      vi.spyOn(Date, 'now').mockReturnValue(baseTime + 5000)
      useTimerStore.getState().tick()

      expect(useTimerStore.getState().elapsedSeconds).toBe(5)

      vi.restoreAllMocks()
    })

    it('타이머가 실행 중이 아니면 아무것도 하지 않는다', () => {
      useTimerStore.getState().tick()
      expect(useTimerStore.getState().elapsedSeconds).toBe(0)
    })
  })
})
