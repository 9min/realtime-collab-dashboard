'use client'

import { Draggable } from '@hello-pangea/dnd'
import { Calendar } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
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

interface MemberProfile {
  user_id: string
  profiles: Tables<'profiles'>
}

interface TaskCardProps {
  task: Tables<'tasks'>
  index: number
  onClick: (task: Tables<'tasks'>) => void
  members?: MemberProfile[]
}

export function TaskCard({ task, index, onClick, members }: TaskCardProps) {
  const assignee = task.assignee_id
    ? members?.find((m) => m.user_id === task.assignee_id)?.profiles
    : null

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="mb-2"
        >
          <Card
            className={cn(
              'cursor-grab transition-shadow hover:shadow-md active:cursor-grabbing',
              snapshot.isDragging && 'shadow-lg ring-2 ring-primary/20',
            )}
            onClick={() => onClick(task)}
          >
            <CardHeader className="p-3 pb-1">
              <span className="text-sm font-medium leading-snug">{task.title}</span>
            </CardHeader>
            <CardContent className="flex items-center gap-2 px-3 pb-3 pt-1">
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
              {assignee && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Avatar className="ml-auto h-6 w-6">
                        <AvatarImage src={assignee.avatar_url ?? undefined} />
                        <AvatarFallback className="text-[10px]">
                          {(assignee.full_name ?? assignee.email).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{assignee.full_name ?? assignee.email}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  )
}
