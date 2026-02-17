'use client'

import { Calendar } from 'lucide-react'

import { PRIORITY_BADGE_STYLES, PRIORITY_LABELS } from '@/lib/constants'
import { formatDateRange } from '@/lib/gantt-utils'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { MyTaskWithProject } from '@/services/my-tasks-service'

interface MyTaskItemProps {
  task: MyTaskWithProject
  onTaskClick?: (task: MyTaskWithProject) => void
  isDone?: boolean
}

export function MyTaskItem({ task, onTaskClick, isDone }: MyTaskItemProps) {
  const handleClick = () => {
    onTaskClick?.(task)
  }

  return (
    <button
      className={cn(
        'bg-card hover:bg-accent/50 focus-visible:ring-ring flex w-full cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors outline-none focus-visible:ring-2',
        isDone && 'opacity-60',
      )}
      onClick={handleClick}
    >
      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-sm font-medium', isDone && 'line-through')}>{task.title}</p>
        <div className="mt-1 flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {task.project_name}
          </Badge>
          <span className="text-muted-foreground text-xs">{task.column_title}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Badge variant="secondary" className={cn('text-xs', PRIORITY_BADGE_STYLES[task.priority])}>
          {PRIORITY_LABELS[task.priority]}
        </Badge>
        {(task.start_date || task.due_date) && (
          <span
            className={cn(
              'flex items-center gap-1 text-xs',
              task.due_date && task.due_date < new Date().toISOString().split('T')[0]
                ? 'font-medium text-rose-500'
                : 'text-muted-foreground',
            )}
          >
            <Calendar className="h-3 w-3" />
            {formatDateRange(task.start_date, task.due_date)}
          </span>
        )}
      </div>
    </button>
  )
}
