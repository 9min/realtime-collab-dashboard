'use client'

import { useRouter } from 'next/navigation'
import { Calendar } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { PRIORITY_BADGE_STYLES, PRIORITY_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { MyTaskWithProject } from '@/services/my-tasks-service'

interface MyTaskItemProps {
  task: MyTaskWithProject
}

export function MyTaskItem({ task }: MyTaskItemProps) {
  const router = useRouter()

  const handleClick = () => {
    router.push(`/projects/${task.project_id}/board?taskId=${task.id}`)
  }

  return (
    <button
      className="flex w-full items-center gap-3 rounded-lg border bg-card px-4 py-3 text-left transition-colors hover:bg-accent/50"
      onClick={handleClick}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{task.title}</p>
        <div className="mt-1 flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {task.project_name}
          </Badge>
          <span className="text-xs text-muted-foreground">{task.column_title}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Badge variant="secondary" className={cn('text-xs', PRIORITY_BADGE_STYLES[task.priority])}>
          {PRIORITY_LABELS[task.priority]}
        </Badge>
        {task.due_date && (
          <span className={cn(
            'flex items-center gap-1 text-xs',
            task.due_date < new Date().toISOString().split('T')[0]
              ? 'text-rose-500 font-medium'
              : 'text-muted-foreground',
          )}>
            <Calendar className="h-3 w-3" />
            {new Date(task.due_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>
    </button>
  )
}
