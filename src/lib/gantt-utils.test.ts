import { describe, it, expect } from 'vitest'

import {
  daysBetween,
  addDays,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  formatDate,
  formatMonthYear,
  getWeekColumns,
  getMonthColumns,
  taskToBarPosition,
  isSameDay,
  isSameMonth,
  getCalendarGrid,
  getWeekGrid,
} from './gantt-utils'

describe('gantt-utils', () => {
  // ── daysBetween ──
  describe('daysBetween', () => {
    it('두 날짜 간의 일수를 반환한다', () => {
      const start = new Date(2026, 0, 1)
      const end = new Date(2026, 0, 4)
      expect(daysBetween(start, end)).toBe(3)
    })

    it('같은 날이면 0을 반환한다', () => {
      const date = new Date(2026, 0, 1)
      expect(daysBetween(date, date)).toBe(0)
    })

    it('end가 start보다 이전이면 음수를 반환한다', () => {
      const start = new Date(2026, 0, 5)
      const end = new Date(2026, 0, 1)
      expect(daysBetween(start, end)).toBeLessThan(0)
    })
  })

  // ── addDays ──
  describe('addDays', () => {
    it('양수 일수를 더한다', () => {
      const date = new Date(2026, 0, 1)
      const result = addDays(date, 5)
      expect(result.getDate()).toBe(6)
    })

    it('음수 일수를 빼낸다', () => {
      const date = new Date(2026, 0, 10)
      const result = addDays(date, -3)
      expect(result.getDate()).toBe(7)
    })

    it('월 경계를 넘을 수 있다', () => {
      const date = new Date(2026, 0, 30) // 1월 30일
      const result = addDays(date, 3)
      expect(result.getMonth()).toBe(1) // 2월
      expect(result.getDate()).toBe(2)
    })
  })

  // ── startOfWeek ──
  describe('startOfWeek', () => {
    it('평일이면 해당 주의 월요일을 반환한다', () => {
      // 2026-01-07 = 수요일
      const wed = new Date(2026, 0, 7)
      const result = startOfWeek(wed)
      expect(result.getDay()).toBe(1) // 월요일
      expect(result.getDate()).toBe(5)
    })

    it('일요일이면 이전 주 월요일을 반환한다', () => {
      // 2026-01-04 = 일요일
      const sun = new Date(2026, 0, 4)
      const result = startOfWeek(sun)
      expect(result.getDay()).toBe(1)
      expect(result.getDate()).toBe(29) // 전주 월요일: 12/29
    })

    it('월요일이면 자기 자신을 반환한다', () => {
      // 2026-01-05 = 월요일
      const mon = new Date(2026, 0, 5)
      const result = startOfWeek(mon)
      expect(result.getDate()).toBe(5)
    })
  })

  // ── startOfMonth / endOfMonth ──
  describe('startOfMonth', () => {
    it('해당 월의 1일을 반환한다', () => {
      const date = new Date(2026, 5, 15)
      const result = startOfMonth(date)
      expect(result.getDate()).toBe(1)
      expect(result.getMonth()).toBe(5)
    })
  })

  describe('endOfMonth', () => {
    it('해당 월의 마지막 날을 반환한다', () => {
      const date = new Date(2026, 0, 15) // 1월
      const result = endOfMonth(date)
      expect(result.getDate()).toBe(31)
    })

    it('12월의 마지막 날을 반환한다', () => {
      const date = new Date(2026, 11, 1) // 12월
      const result = endOfMonth(date)
      expect(result.getDate()).toBe(31)
      expect(result.getMonth()).toBe(11)
    })
  })

  // ── formatDate / formatMonthYear ──
  describe('formatDate', () => {
    it('M/D 형식으로 포맷한다', () => {
      const date = new Date(2026, 0, 5)
      expect(formatDate(date)).toBe('1/5')
    })
  })

  describe('formatMonthYear', () => {
    it('YYYY년 M월 형식으로 포맷한다', () => {
      const date = new Date(2026, 11, 1)
      expect(formatMonthYear(date)).toBe('2026년 12월')
    })
  })

  // ── getWeekColumns ──
  describe('getWeekColumns', () => {
    it('weeks * 7 개의 열을 생성한다', () => {
      const start = new Date(2026, 0, 5) // 월요일
      const columns = getWeekColumns(start, 2)
      expect(columns).toHaveLength(14)
    })

    it('주말 열에 isWeekend가 true이다', () => {
      // 2026-01-05 = 월요일 → 토(10일), 일(11일)
      const start = new Date(2026, 0, 5)
      const columns = getWeekColumns(start, 1)
      const weekendCols = columns.filter((c) => c.isWeekend)
      expect(weekendCols).toHaveLength(2)
    })
  })

  // ── getMonthColumns ──
  describe('getMonthColumns', () => {
    it('월별 주 단위 열을 생성한다', () => {
      const start = new Date(2026, 0, 1)
      const columns = getMonthColumns(start, 1)
      expect(columns.length).toBeGreaterThan(0)
    })
  })

  // ── taskToBarPosition ──
  describe('taskToBarPosition', () => {
    it('정상적인 시작/종료로 위치를 계산한다', () => {
      const timelineStart = new Date(2026, 0, 1)
      const taskStart = new Date(2026, 0, 3)
      const taskEnd = new Date(2026, 0, 10)
      const result = taskToBarPosition(taskStart, taskEnd, timelineStart, 30)

      expect(result.left).toBeGreaterThan(0)
      expect(result.width).toBeGreaterThan(0)
    })

    it('taskEnd가 null이면 기본 7일 duration을 사용한다', () => {
      const timelineStart = new Date(2026, 0, 1)
      const taskStart = new Date(2026, 0, 1)
      const result = taskToBarPosition(taskStart, null, timelineStart, 30)

      expect(result.width).toBeGreaterThan(0)
    })

    it('타임라인 시작보다 이전인 태스크는 left가 0으로 클램핑된다', () => {
      const timelineStart = new Date(2026, 0, 10)
      const taskStart = new Date(2026, 0, 1)
      const taskEnd = new Date(2026, 0, 15)
      const result = taskToBarPosition(taskStart, taskEnd, timelineStart, 30)

      expect(result.left).toBe(0)
    })

    it('width는 최소 0.5를 보장한다', () => {
      const timelineStart = new Date(2026, 0, 1)
      const taskStart = new Date(2026, 0, 1)
      const taskEnd = new Date(2026, 0, 1)
      const result = taskToBarPosition(taskStart, taskEnd, timelineStart, 1000)

      expect(result.width).toBeGreaterThanOrEqual(0.5)
    })
  })

  // ── isSameDay ──
  describe('isSameDay', () => {
    it('같은 날이면 true를 반환한다', () => {
      const a = new Date(2026, 1, 15, 10, 30)
      const b = new Date(2026, 1, 15, 23, 59)
      expect(isSameDay(a, b)).toBe(true)
    })

    it('다른 날이면 false를 반환한다', () => {
      const a = new Date(2026, 1, 15)
      const b = new Date(2026, 1, 16)
      expect(isSameDay(a, b)).toBe(false)
    })
  })

  // ── isSameMonth ──
  describe('isSameMonth', () => {
    it('같은 월이면 true를 반환한다', () => {
      expect(isSameMonth(new Date(2026, 1, 1), new Date(2026, 1, 28))).toBe(true)
    })

    it('다른 월이면 false를 반환한다', () => {
      expect(isSameMonth(new Date(2026, 0, 31), new Date(2026, 1, 1))).toBe(false)
    })
  })

  // ── getCalendarGrid ──
  describe('getCalendarGrid', () => {
    it('42개의 날짜 셀을 반환한다 (6주)', () => {
      const grid = getCalendarGrid(2026, 1) // 2026년 2월
      expect(grid).toHaveLength(42)
    })

    it('해당 월의 날짜는 isCurrentMonth가 true이다', () => {
      const grid = getCalendarGrid(2026, 1)
      const currentMonthDays = grid.filter((d) => d.isCurrentMonth)
      expect(currentMonthDays.length).toBe(28) // 2026년 2월은 28일
    })

    it('첫 번째 셀은 일요일이다', () => {
      const grid = getCalendarGrid(2026, 1)
      expect(grid[0].date.getDay()).toBe(0)
    })
  })

  // ── getWeekGrid ──
  describe('getWeekGrid', () => {
    it('7개의 날짜 셀을 반환한다', () => {
      const grid = getWeekGrid(new Date(2026, 1, 10))
      expect(grid).toHaveLength(7)
    })

    it('일요일부터 시작한다', () => {
      const grid = getWeekGrid(new Date(2026, 1, 10))
      expect(grid[0].date.getDay()).toBe(0)
    })

    it('토요일로 끝난다', () => {
      const grid = getWeekGrid(new Date(2026, 1, 10))
      expect(grid[6].date.getDay()).toBe(6)
    })
  })
})
