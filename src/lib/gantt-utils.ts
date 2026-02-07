/**
 * 간트 차트 날짜 계산 유틸
 */

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

export interface TaskBarPosition {
  left: number   // % from start
  width: number  // % of total
}

const DEFAULT_TASK_DURATION_DAYS = 7

export function taskToBarPosition(
  taskStart: Date,
  taskEnd: Date | null,
  timelineStart: Date,
  totalDays: number,
): TaskBarPosition {
  const effectiveEnd = taskEnd ?? addDays(taskStart, DEFAULT_TASK_DURATION_DAYS)
  const startOffset = daysBetween(timelineStart, taskStart)
  const duration = Math.max(1, daysBetween(taskStart, effectiveEnd))

  const left = Math.max(0, (startOffset / totalDays) * 100)
  const width = Math.min(100 - left, (duration / totalDays) * 100)

  return { left: Math.max(0, left), width: Math.max(0.5, width) }
}
