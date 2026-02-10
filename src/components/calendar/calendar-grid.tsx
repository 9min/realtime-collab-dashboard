'use client'

import { useMemo } from 'react'

import { getCalendarGrid, getWeekGrid, type CalendarDay } from '@/lib/gantt-utils'
import { cn } from '@/lib/utils'
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
      <div className="grid grid-cols-7 bg-blue-50/50 dark:bg-blue-950/30">
        {WEEKDAY_LABELS.map((label, index) => (
          <div
            key={label}
            className={cn(
              'border-border border-b border-r py-2 text-center text-xs font-medium',
              index === 0 || index === 6
                ? 'text-rose-400 dark:text-rose-500'
                : 'text-muted-foreground',
            )}
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
