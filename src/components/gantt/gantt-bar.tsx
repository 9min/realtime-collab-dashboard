'use client'

import { memo } from 'react'

import { cn } from '@/lib/utils'
import { PRIORITY_LABELS, PRIORITY_DOT_COLORS } from '@/lib/constants'
import type { TaskBarPosition } from '@/lib/gantt-utils'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const PRIORITY_BAR_COLORS = {
  low: 'bg-gradient-to-r from-emerald-500 to-emerald-400 dark:from-emerald-600 dark:to-emerald-500',
  medium: 'bg-gradient-to-r from-blue-600 to-blue-400 dark:from-blue-700 dark:to-blue-500',
  high: 'bg-gradient-to-r from-amber-500 to-orange-400 dark:from-amber-600 dark:to-orange-500',
  urgent: 'bg-gradient-to-r from-rose-600 to-rose-400 dark:from-rose-700 dark:to-rose-500',
} as const

interface GanttBarProps {
  title: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigneeName: string | null
  startDate: string | null
  dueDate: string | null
  position: TaskBarPosition
  onClick: () => void
}

export const GanttBar = memo(function GanttBar({
  title,
  priority,
  assigneeName,
  startDate,
  dueDate,
  position,
  onClick,
}: GanttBarProps) {
  return (
    <div
      className="absolute top-1 bottom-1 cursor-pointer"
      style={{
        left: `${position.left}%`,
        width: `${position.width}%`,
      }}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={cn(
              'relative flex h-full w-full items-center gap-1 overflow-hidden rounded-md px-2 text-xs font-medium text-white shadow-sm outline-none',
              'focus-visible:ring-ring transition-all hover:shadow-md hover:ring-1 hover:ring-white/30 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-offset-1',
              PRIORITY_BAR_COLORS[priority],
            )}
          >
            {/* 우선순위 좌측 스트라이프 */}
            <span className="absolute top-0 bottom-0 left-0 w-[3px] rounded-l-md bg-white/30" />
            <span className="truncate pl-1">{title}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={6} className="max-w-[240px] space-y-1.5 p-3">
          <p className="text-sm leading-tight font-semibold">{title}</p>
          <div className="flex items-center gap-1.5">
            <span
              className={cn('inline-block h-2 w-2 rounded-full', PRIORITY_DOT_COLORS[priority])}
            />
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
              {PRIORITY_LABELS[priority]}
            </Badge>
          </div>
          {assigneeName && <p className="text-[11px] opacity-80">담당: {assigneeName}</p>}
          {startDate && <p className="text-[11px] opacity-80">시작: {startDate}</p>}
          {dueDate && <p className="text-[11px] opacity-80">마감: {dueDate}</p>}
        </TooltipContent>
      </Tooltip>
    </div>
  )
})
