'use client'

import { useMemo } from 'react'

import { cn } from '@/lib/utils'
import type { DateColumn } from '@/lib/gantt-utils'
import { getMonthGroups } from '@/lib/gantt-utils'

export const HEADER_HEIGHT = 52

interface GanttHeaderProps {
  columns: DateColumn[]
  columnWidth: number
}

export function GanttHeader({ columns, columnWidth }: GanttHeaderProps) {
  const monthGroups = useMemo(() => getMonthGroups(columns), [columns])

  return (
    <div className="border-border border-b" style={{ minWidth: columns.length * columnWidth }}>
      {/* 상단: 월 그룹 */}
      <div className="flex">
        {monthGroups.map((group, i) => (
          <div
            key={i}
            className="border-border shrink-0 border-r bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/50 dark:text-blue-200"
            style={{ width: group.colSpan * columnWidth }}
          >
            {group.label}
          </div>
        ))}
      </div>
      {/* 하단: 날짜 컬럼 */}
      <div className="flex">
        {columns.map((col, i) => (
          <div
            key={i}
            className={cn(
              'border-border shrink-0 border-r border-t bg-slate-50 px-1 py-1 text-center text-[10px] text-slate-500 dark:bg-slate-900/30 dark:text-slate-400',
              col.isToday && 'bg-blue-100/80 font-bold text-blue-700 dark:bg-blue-900/60 dark:text-blue-200',
              col.isWeekend && !col.isToday && 'bg-slate-100 text-slate-400 dark:bg-slate-800/40 dark:text-slate-400',
            )}
            style={{ width: columnWidth }}
          >
            {col.label}
          </div>
        ))}
      </div>
    </div>
  )
}
