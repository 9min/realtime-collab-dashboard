'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Star } from 'lucide-react'

import { useAuth } from '@/hooks/use-auth'
import { useFavoriteTasks } from '@/queries/use-favorites'
import { PRIORITY_DOT_COLORS, PRIORITY_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { FavoriteTaskWithProject } from '@/types/favorite'

const TaskDetailDialog = dynamic(
  () => import('@/components/kanban/task-detail-dialog').then((mod) => ({ default: mod.TaskDetailDialog })),
)

export function FavoritesWidget() {
  const { user } = useAuth()
  const { data: tasks, isLoading } = useFavoriteTasks(user?.id)
  const [selectedTask, setSelectedTask] = useState<FavoriteTaskWithProject | null>(null)

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
      </div>
    )
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
        <Star className="h-8 w-8 opacity-30" />
        <p className="text-sm">즐겨찾기한 태스크가 없습니다</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-1 overflow-y-auto">
      {tasks.map((task) => (
        <button
          key={task.id}
          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted/60"
          onClick={() => setSelectedTask(task)}
        >
          <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm">{task.title}</p>
            <p className="truncate text-xs text-muted-foreground">{task.project_name}</p>
          </div>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <span className={cn('h-2 w-2 rounded-full shrink-0', PRIORITY_DOT_COLORS[task.priority])} />
            {PRIORITY_LABELS[task.priority]}
          </span>
        </button>
      ))}

      {selectedTask && (
        <TaskDetailDialog
          projectId={selectedTask.project_id}
          task={selectedTask}
          open={!!selectedTask}
          onOpenChange={(open) => { if (!open) setSelectedTask(null) }}
          canEdit
        />
      )}
    </div>
  )
}
