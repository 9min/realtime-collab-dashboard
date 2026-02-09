'use client'

import { useMemo } from 'react'

import { getCalendarGrid, getWeekGrid, type CalendarDay } from '@/lib/gantt-utils'
import { useCalendarStore } from '@/stores/calendar-store'
import type { Task } from '@/types/kanban'

import { CalendarDayCell } from './calendar-day-cell'

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const

interface CalendarGridProps {
  tasksByDate: Map<string, Task[]>
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function CalendarGrid({ tasksByDate }: CalendarGridProps) {
  const { currentDate, viewMode } = useCalendarStore()

  const days: CalendarDay[] = useMemo(() => {
    if (viewMode === 'month') {
      return getCalendarGrid(currentDate.getFullYear(), currentDate.getMonth())
    }
    return getWeekGrid(currentDate)
  }, [currentDate, viewMode])

  return (
    <div>
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="border-border text-muted-foreground border-b border-r py-2 text-center text-xs font-medium"
          >
            {label}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7">
        {days.map((day) => (
          <CalendarDayCell
            key={dateKey(day.date)}
            date={day.date}
            isCurrentMonth={day.isCurrentMonth}
            isToday={day.isToday}
            tasks={tasksByDate.get(dateKey(day.date)) ?? []}
          />
        ))}
      </div>
    </div>
  )
}
