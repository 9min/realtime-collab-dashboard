'use client'

import { useMemo } from 'react'

import { useTasks } from '@/queries/use-tasks'
import type { Task } from '@/types/kanban'

import { CalendarHeader } from './calendar-header'
import { CalendarGrid } from './calendar-grid'

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
  const { data: tasks, isLoading } = useTasks(projectId)

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
        <CalendarGrid tasksByDate={tasksByDate} />
      </div>
    </div>
  )
}
