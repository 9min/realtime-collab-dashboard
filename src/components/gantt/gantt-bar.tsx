'use client'

import { cn } from '@/lib/utils'
import type { TaskBarPosition } from '@/lib/gantt-utils'

const PRIORITY_BAR_COLORS = {
  low: 'bg-slate-400 dark:bg-slate-500',
  medium: 'bg-blue-400 dark:bg-blue-500',
  high: 'bg-orange-400 dark:bg-orange-500',
  urgent: 'bg-red-400 dark:bg-red-500',
} as const

interface GanttBarProps {
  title: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigneeName: string | null
  position: TaskBarPosition
  onClick: () => void
}

export function GanttBar({ title, priority, assigneeName, position, onClick }: GanttBarProps) {
  return (
    <div
      className="absolute top-1 bottom-1 cursor-pointer"
      style={{
        left: `${position.left}%`,
        width: `${position.width}%`,
      }}
    >
      <button
        onClick={onClick}
        className={cn(
          'flex h-full w-full items-center gap-1 overflow-hidden rounded px-2 text-xs font-medium text-white shadow-sm transition-opacity hover:opacity-90',
          PRIORITY_BAR_COLORS[priority],
        )}
        title={`${title}${assigneeName ? ` — ${assigneeName}` : ''}`}
      >
        <span className="truncate">{title}</span>
      </button>
    </div>
  )
}
