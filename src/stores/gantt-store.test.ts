import { describe, it, expect, beforeEach } from 'vitest'

import { useGanttStore } from './gantt-store'

describe('useGanttStore', () => {
  beforeEach(() => {
    useGanttStore.setState({ viewMode: 'week' })
  })

  it('초기 상태는 week이다', () => {
    expect(useGanttStore.getState().viewMode).toBe('week')
  })

  it('setViewMode로 month로 변경할 수 있다', () => {
    useGanttStore.getState().setViewMode('month')
    expect(useGanttStore.getState().viewMode).toBe('month')
  })

  it('setViewMode로 다시 week으로 변경할 수 있다', () => {
    useGanttStore.getState().setViewMode('month')
    useGanttStore.getState().setViewMode('week')
    expect(useGanttStore.getState().viewMode).toBe('week')
  })
})
