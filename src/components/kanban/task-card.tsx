'use client'

import { Draggable } from '@hello-pangea/dnd'
import { Calendar, GripVertical } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Tables } from '@/types/database'

const PRIORITY_STYLES = {
  low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
} as const

const PRIORITY_LABELS = {
  low: '낮음',
  medium: '보통',
  high: '높음',
  urgent: '긴급',
} as const

interface TaskCardProps {
  task: Tables<'tasks'>
  index: number
  onClick: (task: Tables<'tasks'>) => void
}

export function TaskCard({ task, index, onClick }: TaskCardProps) {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="mb-2"
        >
          <Card
            className={cn(
              'cursor-pointer transition-shadow hover:shadow-md',
              snapshot.isDragging && 'shadow-lg ring-2 ring-primary/20',
            )}
            onClick={() => onClick(task)}
          >
            <CardHeader className="flex flex-row items-start gap-2 p-3 pb-1">
              <div {...provided.dragHandleProps} className="mt-0.5 cursor-grab active:cursor-grabbing">
                <GripVertical className="text-muted-foreground h-4 w-4" />
              </div>
              <span className="flex-1 text-sm font-medium leading-snug">{task.title}</span>
            </CardHeader>
            <CardContent className="flex items-center gap-2 px-3 pb-3 pt-1 pl-9">
              <Badge variant="secondary" className={cn('text-xs', PRIORITY_STYLES[task.priority])}>
                {PRIORITY_LABELS[task.priority]}
              </Badge>
              {task.due_date && (
                <span className="text-muted-foreground flex items-center gap-1 text-xs">
                  <Calendar className="h-3 w-3" />
                  {new Date(task.due_date).toLocaleDateString('ko-KR', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  )
}
