'use client'

import { PRIORITY_DOT_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Task } from '@/types/kanban'

import { RANGE_LANE_HEIGHT } from './calendar-range-bar'

const MAX_VISIBLE_TASKS = 3

interface CalendarDayCellProps {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  tasks: Task[]
  onTaskClick: (task: Task) => void
  rangeLaneCount?: number
}

export function CalendarDayCell({
  date,
  isCurrentMonth,
  isToday,
  tasks,
  onTaskClick,
  rangeLaneCount = 0,
}: CalendarDayCellProps) {
  const visibleTasks = tasks.slice(0, MAX_VISIBLE_TASKS)
  const remainingCount = tasks.length - MAX_VISIBLE_TASKS

  return (
    <div
      className={cn(
        'border-border min-h-[100px] border-r border-b p-1.5',
        !isCurrentMonth && 'bg-muted/30',
        isToday && 'ring-primary bg-blue-50/60 ring-1 ring-inset dark:bg-blue-950/20',
      )}
    >
      <span
        className={cn(
          'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs',
          isToday && 'bg-primary text-primary-foreground font-bold',
          !isCurrentMonth && 'text-muted-foreground',
        )}
      >
        {date.getDate()}
      </span>

      {/* 범위 바가 배치되는 영역 확보 */}
      {rangeLaneCount > 0 && (
        <div style={{ height: `${rangeLaneCount * RANGE_LANE_HEIGHT + 4}px` }} />
      )}

      <div className="mt-0.5 space-y-0.5">
        {visibleTasks.map((task) => (
          <button
            key={task.id}
            onClick={() => onTaskClick(task)}
            className="hover:bg-accent flex w-full cursor-pointer items-center gap-1 rounded px-1 py-0.5 text-left transition-colors"
          >
            <span
              className={cn(
                'h-1.5 w-1.5 shrink-0 rounded-full',
                PRIORITY_DOT_COLORS[task.priority],
              )}
            />
            <span className="truncate text-[11px] leading-tight">{task.title}</span>
          </button>
        ))}
        {remainingCount > 0 && (
          <span className="text-muted-foreground block px-1 text-[10px]">
            +{remainingCount} 더보기
          </span>
        )}
      </div>
    </div>
  )
}
