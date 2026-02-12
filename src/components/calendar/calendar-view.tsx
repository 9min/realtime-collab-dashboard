'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'

import { useAuth } from '@/hooks/use-auth'
import { MEMBER_ROLE } from '@/lib/constants'
import { useProjectMembers } from '@/queries/use-projects'
import { useTasks } from '@/queries/use-tasks'
import type { Tables } from '@/types/database'
import type { Task } from '@/types/kanban'

import { CalendarHeader } from './calendar-header'
import { CalendarGrid } from './calendar-grid'

const TaskDetailDialog = dynamic(
  () => import('@/components/kanban/task-detail-dialog').then((mod) => ({ default: mod.TaskDetailDialog })),
)

interface CalendarViewProps {
  projectId: string
}

function groupTasksByDate(tasks: Task[]): Map<string, Task[]> {
  const map = new Map<string, Task[]>()
  for (const task of tasks) {
    if (!task.due_date) continue
    const key = task.due_date // YYYY-MM-DD format
    const list = map.get(key) ?? []
    list.push(task)
    map.set(key, list)
  }
  return map
}

export function CalendarView({ projectId }: CalendarViewProps) {
  const { user } = useAuth()
  const { data: tasks, isLoading } = useTasks(projectId)
  const { data: members } = useProjectMembers(projectId)
  const [selectedTask, setSelectedTask] = useState<Tables<'tasks'> | null>(null)

  const currentRole = members?.find((m) => m.user_id === user?.id)?.role
  const isViewer = currentRole === MEMBER_ROLE.VIEWER
  const canEdit = !isViewer
  const canDeleteAll = currentRole === MEMBER_ROLE.OWNER || currentRole === MEMBER_ROLE.ADMIN

  const tasksByDate = useMemo(
    () => groupTasksByDate(tasks ?? []),
    [tasks],
  )

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-muted h-10 w-64 animate-pulse rounded" />
        <div className="bg-muted h-96 animate-pulse rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <CalendarHeader />
      <div className="bg-card overflow-hidden rounded-lg border shadow-sm">
        <CalendarGrid tasksByDate={tasksByDate} onTaskClick={setSelectedTask} />
      </div>

      <TaskDetailDialog
        projectId={projectId}
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => { if (!open) setSelectedTask(null) }}
        canEdit={canEdit}
        canDeleteAll={canDeleteAll}
      />
    </div>
  )
}
