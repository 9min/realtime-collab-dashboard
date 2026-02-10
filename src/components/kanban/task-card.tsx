'use client'

import { Draggable } from '@hello-pangea/dnd'
import { Calendar, Lock } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { PRIORITY_LABELS, PRIORITY_BADGE_STYLES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Tables } from '@/types/database'
import type { Label } from '@/types/label'

import { LabelBadge } from './label-badge'

interface MemberProfile {
  user_id: string
  profiles: Tables<'profiles'>
}

interface TaskCardProps {
  task: Tables<'tasks'>
  index: number
  onClick: (task: Tables<'tasks'>) => void
  members?: MemberProfile[]
  isDragDisabled?: boolean
  taskLabels?: Label[]
  isBlocked?: boolean
}

export function TaskCard({ task, index, onClick, members, isDragDisabled = false, taskLabels, isBlocked = false }: TaskCardProps) {
  const assignee = task.assignee_id
    ? members?.find((m) => m.user_id === task.assignee_id)?.profiles
    : null

  return (
    <Draggable draggableId={task.id} index={index} isDragDisabled={isDragDisabled}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="mb-2"
        >
          <Card
            className={cn(
              'transition-shadow hover:shadow-md',
              isDragDisabled ? 'cursor-default' : 'cursor-grab active:cursor-grabbing',
              snapshot.isDragging && 'shadow-lg ring-2 ring-primary/20',
              isBlocked && 'border-amber-400 dark:border-amber-600',
            )}
            role="button"
            tabIndex={0}
            onClick={() => onClick(task)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick(task)
              }
            }}
          >
            <CardHeader className="p-3 pb-1">
              {taskLabels && taskLabels.length > 0 && (
                <div className="mb-1 flex flex-wrap gap-1">
                  {taskLabels.map((l) => (
                    <LabelBadge key={l.id} label={l} size="sm" />
                  ))}
                </div>
              )}
              <span className="flex items-center gap-1 text-sm font-medium leading-snug">
                {isBlocked && <Lock className="h-3 w-3 shrink-0 text-amber-500" />}
                {task.title}
              </span>
            </CardHeader>
            <CardContent className="flex items-center gap-2 px-3 pb-3 pt-1">
              <Badge variant="secondary" className={cn('text-xs', PRIORITY_BADGE_STYLES[task.priority])}>
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
