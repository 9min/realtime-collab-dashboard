'use client'

import { useRouter, useParams } from 'next/navigation'

import { PRIORITY_DOT_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Task } from '@/types/kanban'

const MAX_VISIBLE_TASKS = 3

interface CalendarDayCellProps {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  tasks: Task[]
}

export function CalendarDayCell({ date, isCurrentMonth, isToday, tasks }: CalendarDayCellProps) {
  const router = useRouter()
  const params = useParams()
  const projectId = params.projectId as string

  const visibleTasks = tasks.slice(0, MAX_VISIBLE_TASKS)
  const remainingCount = tasks.length - MAX_VISIBLE_TASKS

  const handleTaskClick = (taskId: string) => {
    router.push(`/projects/${projectId}/board?taskId=${taskId}`)
  }

  return (
    <div
      className={cn(
        'border-border min-h-[100px] border-b border-r p-1.5',
        !isCurrentMonth && 'bg-muted/30',
        isToday && 'ring-primary ring-1 ring-inset bg-blue-50/60 dark:bg-blue-950/20',
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

      <div className="mt-0.5 space-y-0.5">
        {visibleTasks.map((task) => (
          <button
            key={task.id}
            onClick={() => handleTaskClick(task.id)}
            className="hover:bg-accent flex w-full items-center gap-1 rounded px-1 py-0.5 text-left transition-colors"
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
