'use client'

import { cn } from '@/lib/utils'
import type { DateColumn } from '@/lib/gantt-utils'

interface GanttHeaderProps {
  columns: DateColumn[]
  columnWidth: number
}

export function GanttHeader({ columns, columnWidth }: GanttHeaderProps) {
  return (
    <div className="border-border flex border-b" style={{ minWidth: columns.length * columnWidth }}>
      {columns.map((col, i) => (
        <div
          key={i}
          className={cn(
            'border-border shrink-0 border-r px-1 py-1.5 text-center text-[10px]',
            col.isToday && 'bg-red-50 font-bold text-red-600 dark:bg-red-950/30 dark:text-red-400',
            col.isWeekend && 'bg-muted/50',
          )}
          style={{ width: columnWidth }}
        >
          {col.label}
        </div>
      ))}
    </div>
  )
}
