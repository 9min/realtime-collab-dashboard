import { describe, it, expect, beforeEach } from 'vitest'

import { useCalendarStore } from './calendar-store'

describe('calendar-store', () => {
  beforeEach(() => {
    useCalendarStore.setState({
      currentDate: new Date(2026, 1, 1), // 2026-02-01
      viewMode: 'month',
    })
  })

  it('초기 viewMode는 month이다', () => {
    expect(useCalendarStore.getState().viewMode).toBe('month')
  })

  it('setViewMode로 뷰 모드를 변경한다', () => {
    useCalendarStore.getState().setViewMode('week')
    expect(useCalendarStore.getState().viewMode).toBe('week')
  })

  it('goToToday로 오늘 날짜로 이동한다', () => {
    useCalendarStore.getState().goToToday()
    const today = new Date()
    const stored = useCalendarStore.getState().currentDate
    expect(stored.toDateString()).toBe(today.toDateString())
  })

  it('goToPrev - month 모드에서 이전 월로 이동한다', () => {
    useCalendarStore.getState().goToPrev()
    const result = useCalendarStore.getState().currentDate
    expect(result.getMonth()).toBe(0) // January
  })

  it('goToNext - month 모드에서 다음 월로 이동한다', () => {
    useCalendarStore.getState().goToNext()
    const result = useCalendarStore.getState().currentDate
    expect(result.getMonth()).toBe(2) // March
  })

  it('goToPrev - week 모드에서 7일 전으로 이동한다', () => {
    useCalendarStore.getState().setViewMode('week')
    useCalendarStore.getState().goToPrev()
    const result = useCalendarStore.getState().currentDate
    expect(result.getDate()).toBe(25) // 2026-01-25
  })

  it('goToNext - week 모드에서 7일 후로 이동한다', () => {
    useCalendarStore.getState().setViewMode('week')
    useCalendarStore.getState().goToNext()
    const result = useCalendarStore.getState().currentDate
    expect(result.getDate()).toBe(8) // 2026-02-08
  })
})
