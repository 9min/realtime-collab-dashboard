/**
 * 간트 차트 날짜 계산 유틸
 */

/**
 * 날짜 문자열을 로컬 자정 기준 Date로 파싱합니다.
 *
 * `new Date('2026-02-20')`은 UTC 자정(00:00Z)으로 해석되지만,
 * `new Date('2026-02-20T00:00:00')`은 로컬 자정으로 해석됩니다.
 * 타임라인 기준점(startOfWeek 등)이 로컬 자정이므로
 * date-only 문자열도 로컬 자정으로 맞춰야 daysBetween 계산이 정확합니다.
 */
export function parseLocalDate(value: string): Date {
  // 날짜 전용 문자열 (YYYY-MM-DD) → 로컬 자정으로 강제
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(value + 'T00:00:00')
  }
  return new Date(value)
}

export function daysBetween(start: Date, end: Date): number {
  const diffTime = end.getTime() - start.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

export function formatDate(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`
}

export function formatMonthYear(date: Date): string {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`
}

export interface DateColumn {
  date: Date
  label: string
  isToday: boolean
  isWeekend: boolean
}

export function getWeekColumns(start: Date, weeks: number): DateColumn[] {
  const columns: DateColumn[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < weeks * 7; i++) {
    const date = addDays(start, i)
    const day = date.getDay()
    columns.push({
      date,
      label: formatDate(date),
      isToday: date.getTime() === today.getTime(),
      isWeekend: day === 0 || day === 6,
    })
  }
  return columns
}

export function getMonthColumns(start: Date, months: number): DateColumn[] {
  const columns: DateColumn[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setMonth(end.getMonth() + months)

  let current = new Date(start)
  while (current < end) {
    // 주 단위 열
    const weekStart = startOfWeek(current)
    columns.push({
      date: weekStart,
      label: formatDate(weekStart),
      isToday: false,
      isWeekend: false,
    })
    current = addDays(weekStart, 7)
  }
  return columns
}

export interface MonthGroup {
  label: string
  colSpan: number
}

export function getMonthGroups(columns: DateColumn[]): MonthGroup[] {
  if (columns.length === 0) return []

  const groups: MonthGroup[] = []
  let currentLabel = formatMonthYear(columns[0].date)
  let currentSpan = 1

  for (let i = 1; i < columns.length; i++) {
    const label = formatMonthYear(columns[i].date)
    if (label === currentLabel) {
      currentSpan++
    } else {
      groups.push({ label: currentLabel, colSpan: currentSpan })
      currentLabel = label
      currentSpan = 1
    }
  }
  groups.push({ label: currentLabel, colSpan: currentSpan })

  return groups
}

// ── 월 단위 뷰 (실제 월 기반 컬럼) ──

export interface MonthViewColumn {
  date: Date
  label: string
  days: number
  isCurrentMonth: boolean
}

export function getMonthViewColumns(start: Date, months: number): MonthViewColumn[] {
  const now = new Date()
  const columns: MonthViewColumn[] = []
  for (let i = 0; i < months; i++) {
    const date = new Date(start.getFullYear(), start.getMonth() + i, 1)
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
    columns.push({
      date,
      label: `${date.getMonth() + 1}월`,
      days: daysInMonth,
      isCurrentMonth:
        date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth(),
    })
  }
  return columns
}

export interface YearGroup {
  label: string
  totalDays: number
}

export function getYearGroups(columns: MonthViewColumn[]): YearGroup[] {
  if (columns.length === 0) return []
  const groups: YearGroup[] = []
  let currentYear = columns[0].date.getFullYear()
  let totalDays = columns[0].days
  for (let i = 1; i < columns.length; i++) {
    const year = columns[i].date.getFullYear()
    if (year === currentYear) {
      totalDays += columns[i].days
    } else {
      groups.push({ label: `${currentYear}년`, totalDays })
      currentYear = year
      totalDays = columns[i].days
    }
  }
  groups.push({ label: `${currentYear}년`, totalDays })
  return groups
}

export interface TaskBarPosition {
  left: number // % from start
  width: number // % of total
}

const DEFAULT_TASK_DURATION_DAYS = 7

export function taskToBarPosition(
  taskStart: Date,
  taskEnd: Date | null,
  timelineStart: Date,
  totalDays: number,
): TaskBarPosition {
  // taskEnd(마감일)는 해당 날짜를 포함(inclusive)해야 하므로 +1일
  const effectiveEnd = taskEnd
    ? addDays(taskEnd, 1)
    : addDays(taskStart, DEFAULT_TASK_DURATION_DAYS)
  const startOffset = daysBetween(timelineStart, taskStart)
  const duration = Math.max(1, daysBetween(taskStart, effectiveEnd))

  const left = Math.max(0, (startOffset / totalDays) * 100)
  const width = Math.min(100 - left, (duration / totalDays) * 100)

  return { left: Math.max(0, left), width: Math.max(0.5, width) }
}

// ── 날짜 범위 포맷 ──

const DATE_RANGE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }

export function formatDateRange(startDate: string | null, dueDate: string | null): string | null {
  if (startDate && dueDate) {
    return `${parseLocalDate(startDate).toLocaleDateString('ko-KR', DATE_RANGE_FORMAT_OPTIONS)} ~ ${parseLocalDate(dueDate).toLocaleDateString('ko-KR', DATE_RANGE_FORMAT_OPTIONS)}`
  }
  if (startDate) {
    return `${parseLocalDate(startDate).toLocaleDateString('ko-KR', DATE_RANGE_FORMAT_OPTIONS)} ~`
  }
  if (dueDate) {
    return `~ ${parseLocalDate(dueDate).toLocaleDateString('ko-KR', DATE_RANGE_FORMAT_OPTIONS)}`
  }
  return null
}

// ── 캘린더 유틸 ──

export interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

export function getCalendarGrid(year: number, month: number): CalendarDay[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const firstDay = new Date(year, month, 1)
  const startOffset = firstDay.getDay() // 0=Sun

  const start = new Date(year, month, 1 - startOffset)

  const TOTAL_CELLS = 42 // 6 weeks
  const days: CalendarDay[] = []

  for (let i = 0; i < TOTAL_CELLS; i++) {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    days.push({
      date,
      isCurrentMonth: date.getMonth() === month,
      isToday: isSameDay(date, today),
    })
  }

  return days
}

export function getWeekGrid(baseDate: Date): CalendarDay[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const day = baseDate.getDay() // 0=Sun
  const start = new Date(baseDate)
  start.setDate(start.getDate() - day)

  const days: CalendarDay[] = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    days.push({
      date,
      isCurrentMonth: date.getMonth() === baseDate.getMonth(),
      isToday: isSameDay(date, today),
    })
  }

  return days
}
