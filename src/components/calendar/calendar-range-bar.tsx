'use client'

import { cn } from '@/lib/utils'
import type { TaskPriority } from '@/types/common'
import type { Task } from '@/types/kanban'

export const RANGE_LANE_HEIGHT = 22
export const MAX_RANGE_LANES = 10

/**
 * CalendarDayCell 내부에서 날짜 숫자 영역의 높이 (p-1.5=6px + h-6=24px = 30px).
 * 범위 바의 top 오프셋 기준으로 사용됩니다.
 */
export const DATE_AREA_HEIGHT = 30

const PRIORITY_BAR_COLORS: Record<TaskPriority, { bg: string; text: string }> = {
  low: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  medium: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
  },
  high: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
  },
  urgent: {
    bg: 'bg-rose-100 dark:bg-rose-900/30',
    text: 'text-rose-700 dark:text-rose-300',
  },
}

export interface CalendarTaskRange {
  task: Task
  startCol: number
  endCol: number
  isRangeStart: boolean
  isRangeEnd: boolean
  lane: number
}

interface CalendarRangeBarProps {
  range: CalendarTaskRange
  onClick: () => void
}

export function CalendarRangeBar({ range, onClick }: CalendarRangeBarProps) {
  const { task, startCol, endCol, isRangeStart, isRangeEnd, lane } = range
  const colors = PRIORITY_BAR_COLORS[task.priority]

  const leftPercent = (startCol / 7) * 100
  const widthPercent = ((endCol - startCol + 1) / 7) * 100
  const insetLeft = isRangeStart ? 3 : 0
  const insetRight = isRangeEnd ? 3 : 0

  return (
    <button
      onClick={onClick}
      className={cn(
        'absolute z-10 flex cursor-pointer items-center overflow-hidden px-1.5 text-[11px] leading-tight font-medium transition-opacity hover:opacity-80',
        colors.bg,
        colors.text,
        isRangeStart && 'rounded-l-md',
        isRangeEnd && 'rounded-r-md',
      )}
      style={{
        left: `calc(${leftPercent}% + ${insetLeft}px)`,
        width: `calc(${widthPercent}% - ${insetLeft + insetRight}px)`,
        top: `${DATE_AREA_HEIGHT + lane * RANGE_LANE_HEIGHT + 2}px`,
        height: `${RANGE_LANE_HEIGHT - 4}px`,
      }}
    >
      <span className="truncate">{task.title}</span>
    </button>
  )
}
