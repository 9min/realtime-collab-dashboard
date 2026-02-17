'use client'

import { useMemo } from 'react'

import { getCalendarGrid, getWeekGrid, parseLocalDate, type CalendarDay } from '@/lib/gantt-utils'
import { cn } from '@/lib/utils'
import { useCalendarStore } from '@/stores/calendar-store'
import type { Task } from '@/types/kanban'

import { CalendarDayCell } from './calendar-day-cell'
import { CalendarRangeBar, MAX_RANGE_LANES, type CalendarTaskRange } from './calendar-range-bar'

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const

const MS_PER_DAY = 1000 * 60 * 60 * 24

interface CalendarGridProps {
  tasksByDate: Map<string, Task[]>
  allTasks: Task[]
  onTaskClick: (task: Task) => void
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function chunkWeeks(days: CalendarDay[]): CalendarDay[][] {
  const weeks: CalendarDay[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }
  return weeks
}

/** Assign a global lane per task so it stays in the same row across weeks. */
function assignGlobalLanes(tasks: Task[]): Map<string, number> {
  const rangeTasks = tasks.filter((t) => t.start_date && t.due_date)

  const sorted = [...rangeTasks].sort((a, b) => {
    const aStart = parseLocalDate(a.start_date!).getTime()
    const bStart = parseLocalDate(b.start_date!).getTime()
    if (aStart !== bStart) return aStart - bStart
    const aDur = parseLocalDate(a.due_date!).getTime() - aStart
    const bDur = parseLocalDate(b.due_date!).getTime() - bStart
    if (aDur !== bDur) return bDur - aDur
    return a.id.localeCompare(b.id)
  })

  const laneMap = new Map<string, number>()
  const laneEnds: number[] = []

  for (const task of sorted) {
    const taskStart = parseLocalDate(task.start_date!)
    const taskEnd = parseLocalDate(task.due_date!)

    let assignedLane = -1
    for (let lane = 0; lane < laneEnds.length; lane++) {
      if (laneEnds[lane] < taskStart.getTime()) {
        assignedLane = lane
        break
      }
    }

    if (assignedLane === -1) {
      if (laneEnds.length < MAX_RANGE_LANES) {
        assignedLane = laneEnds.length
        laneEnds.push(0)
      } else {
        continue
      }
    }

    laneEnds[assignedLane] = taskEnd.getTime()
    laneMap.set(task.id, assignedLane)
  }

  return laneMap
}

function computeWeekRanges(
  weekDays: CalendarDay[],
  tasks: Task[],
  laneMap: Map<string, number>,
): CalendarTaskRange[] {
  if (weekDays.length === 0) return []

  const weekStart = weekDays[0].date
  const weekEnd = weekDays[weekDays.length - 1].date
  const ranges: CalendarTaskRange[] = []

  for (const task of tasks) {
    if (!task.start_date || !task.due_date) continue
    const lane = laneMap.get(task.id)
    if (lane === undefined) continue

    const taskStart = parseLocalDate(task.start_date)
    const taskEnd = parseLocalDate(task.due_date)

    if (taskStart > weekEnd || taskEnd < weekStart) continue

    const diffStart = Math.round((taskStart.getTime() - weekStart.getTime()) / MS_PER_DAY)
    const diffEnd = Math.round((taskEnd.getTime() - weekStart.getTime()) / MS_PER_DAY)

    ranges.push({
      task,
      startCol: Math.max(0, diffStart),
      endCol: Math.min(6, diffEnd),
      isRangeStart: diffStart >= 0,
      isRangeEnd: diffEnd <= 6,
      lane,
    })
  }

  return ranges
}

export function CalendarGrid({ tasksByDate, allTasks, onTaskClick }: CalendarGridProps) {
  const { currentDate, viewMode } = useCalendarStore()

  const days: CalendarDay[] = useMemo(() => {
    if (viewMode === 'month') {
      return getCalendarGrid(currentDate.getFullYear(), currentDate.getMonth())
    }
    return getWeekGrid(currentDate)
  }, [currentDate, viewMode])

  const weeks = useMemo(() => chunkWeeks(days), [days])

  const laneMap = useMemo(() => assignGlobalLanes(allTasks), [allTasks])

  const weekRanges = useMemo(
    () => weeks.map((weekDays) => computeWeekRanges(weekDays, allTasks, laneMap)),
    [weeks, allTasks, laneMap],
  )

  const rangeTaskIds = useMemo(() => {
    const ids = new Set<string>()
    for (const ranges of weekRanges) {
      for (const range of ranges) {
        ids.add(range.task.id)
      }
    }
    return ids
  }, [weekRanges])

  return (
    <div>
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 bg-blue-50/50 dark:bg-blue-950/30">
        {WEEKDAY_LABELS.map((label, index) => (
          <div
            key={label}
            className={cn(
              'border-border border-r border-b py-2 text-center text-xs font-medium',
              index === 0 || index === 6
                ? 'text-rose-400 dark:text-rose-500'
                : 'text-muted-foreground',
            )}
          >
            {label}
          </div>
        ))}
      </div>

      {/* 주별 행 — 날짜 + 범위 바 + 개별 태스크를 하나의 grid에 통합 */}
      {weeks.map((weekDays, weekIndex) => {
        const ranges = weekRanges[weekIndex]
        const laneCount = ranges.length > 0 ? Math.max(...ranges.map((r) => r.lane)) + 1 : 0

        return (
          <div key={dateKey(weekDays[0].date)} className="relative grid grid-cols-7">
            {weekDays.map((day) => {
              const dayTasks = (tasksByDate.get(dateKey(day.date)) ?? []).filter(
                (t) => !rangeTaskIds.has(t.id),
              )
              return (
                <CalendarDayCell
                  key={dateKey(day.date)}
                  date={day.date}
                  isCurrentMonth={day.isCurrentMonth}
                  isToday={day.isToday}
                  tasks={dayTasks}
                  onTaskClick={onTaskClick}
                  rangeLaneCount={laneCount}
                />
              )
            })}

            {/* 범위 바 — 날짜 숫자 아래에 절대 위치 */}
            {ranges.map((range) => (
              <CalendarRangeBar
                key={`${range.task.id}-w${weekIndex}`}
                range={range}
                onClick={() => onTaskClick(range.task)}
              />
            ))}
          </div>
        )
      })}
    </div>
  )
}
