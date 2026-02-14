'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import {
  AlertTriangle,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CalendarOff,
  CheckCircle2,
  ChevronDown,
  Inbox,
} from 'lucide-react'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

import { useAuth } from '@/hooks/use-auth'
import { useMyTasks } from '@/queries/use-my-tasks'
import { groupMyTasks, type GroupedMyTasks } from '@/lib/my-tasks-utils'
import type { MyTaskWithProject } from '@/services/my-tasks-service'

import { MyTaskItem } from './my-task-item'

const TaskDetailDialog = dynamic(() =>
  import('@/components/kanban/task-detail-dialog').then((mod) => ({
    default: mod.TaskDetailDialog,
  })),
)

const SECTIONS: Array<{
  key: keyof GroupedMyTasks
  label: string
  icon: typeof AlertTriangle
  emptyText: string
  accentClass: string
}> = [
  {
    key: 'overdue',
    label: '기한 초과',
    icon: AlertTriangle,
    emptyText: '',
    accentClass: 'text-rose-500',
  },
  { key: 'today', label: '오늘', icon: CalendarCheck, emptyText: '', accentClass: 'text-blue-500' },
  {
    key: 'thisWeek',
    label: '이번 주',
    icon: CalendarDays,
    emptyText: '',
    accentClass: 'text-emerald-500',
  },
  {
    key: 'upcoming',
    label: '예정',
    icon: CalendarClock,
    emptyText: '',
    accentClass: 'text-amber-500',
  },
  {
    key: 'noDueDate',
    label: '마감일 미정',
    icon: CalendarOff,
    emptyText: '',
    accentClass: 'text-muted-foreground',
  },
]

export function MyTasksView() {
  const { user } = useAuth()
  const { data: tasks, isLoading } = useMyTasks(user?.id)
  const [selectedTask, setSelectedTask] = useState<MyTaskWithProject | null>(null)
  const [isDoneOpen, setIsDoneOpen] = useState(false)

  const grouped = useMemo(() => {
    if (!tasks) return null
    return groupMyTasks(tasks)
  }, [tasks])

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-muted h-16 animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center justify-center gap-3 py-16">
        <Inbox className="h-12 w-12 opacity-30" />
        <p className="text-sm">배정된 태스크가 없습니다</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {grouped &&
        SECTIONS.map(({ key, label, icon: Icon, accentClass }) => {
          const sectionTasks = grouped[key]
          if (sectionTasks.length === 0) return null

          return (
            <section key={key}>
              <h3 className={`mb-3 flex items-center gap-2 text-sm font-semibold ${accentClass}`}>
                <Icon className="h-4 w-4" />
                {label}
                <span className="text-muted-foreground font-normal">({sectionTasks.length})</span>
              </h3>
              <div className="space-y-2">
                {sectionTasks.map((task) => (
                  <MyTaskItem key={task.id} task={task} onTaskClick={setSelectedTask} />
                ))}
              </div>
            </section>
          )
        })}

      {grouped && grouped.done.length > 0 && (
        <section>
          <div className="border-t pt-4">
            <Collapsible open={isDoneOpen} onOpenChange={setIsDoneOpen}>
              <CollapsibleTrigger className="hover:bg-accent/50 flex w-full cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-sm font-semibold text-green-600 transition-colors dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                완료됨
                <span className="text-muted-foreground font-normal">({grouped.done.length})</span>
                <ChevronDown
                  className={cn('ml-auto h-4 w-4 transition-transform', isDoneOpen && 'rotate-180')}
                />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-3 space-y-2">
                  {grouped.done.map((task) => (
                    <MyTaskItem key={task.id} task={task} onTaskClick={setSelectedTask} isDone />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </section>
      )}

      {selectedTask && (
        <TaskDetailDialog
          projectId={selectedTask.project_id}
          task={selectedTask}
          open={!!selectedTask}
          onOpenChange={(open) => {
            if (!open) setSelectedTask(null)
          }}
          canEdit
        />
      )}
    </div>
  )
}
