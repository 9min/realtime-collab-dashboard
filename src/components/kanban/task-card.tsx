'use client'

import { Draggable } from '@hello-pangea/dnd'
import { Calendar, Lock } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { PRIORITY_LABELS, PRIORITY_DOT_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Tables } from '@/types/database'
import type { Label } from '@/types/label'
import type { TaskAssigneeWithProfile } from '@/types/task-assignee'

import { AvatarGroup } from './assignee-picker'
import { FavoriteButton } from './favorite-button'
import { LabelBadge } from './label-badge'
import { RecurrenceBadge } from './recurrence-badge'

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
  isRecurring?: boolean
  taskAssignees?: TaskAssigneeWithProfile[]
}

export function TaskCard({
  task,
  index,
  onClick,
  members,
  isDragDisabled = false,
  taskLabels,
  isBlocked = false,
  isRecurring = false,
  taskAssignees,
}: TaskCardProps) {
  // Multi-assignee mode: use taskAssignees if available, otherwise fallback to single assignee_id
  const hasMultiAssignees = taskAssignees && taskAssignees.length > 0
  const assignee =
    !hasMultiAssignees && task.assignee_id
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
              'group bg-card focus-visible:ring-ring gap-0 py-0 shadow-sm transition-shadow outline-none hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-1',
              isDragDisabled ? 'cursor-default' : 'cursor-grab active:cursor-grabbing',
              snapshot.isDragging && 'ring-primary/20 shadow-lg ring-2',
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
            <CardHeader className="gap-0 px-2.5 pt-2 pb-0.5">
              {taskLabels && taskLabels.length > 0 && (
                <div className="mb-0.5 flex flex-wrap gap-1">
                  {taskLabels.map((l) => (
                    <LabelBadge key={l.id} label={l} size="sm" />
                  ))}
                </div>
              )}
              <span className="flex min-w-0 items-center gap-1 text-sm leading-snug font-medium">
                {isBlocked && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex shrink-0 items-center gap-0.5 rounded bg-amber-100 px-1 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                          <Lock className="h-3 w-3" />
                          대기 중
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>선행 작업 완료 후 진행 가능</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <RecurrenceBadge isRecurring={isRecurring} />
                <span className="break-words">{task.title}</span>
              </span>
            </CardHeader>
            <CardContent className="flex items-center gap-2 px-2.5 pt-0.5 pb-2">
              <FavoriteButton
                taskId={task.id}
                size="sm"
                className="opacity-0 transition-opacity group-hover:opacity-100"
              />
              <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                <span
                  className={cn(
                    'h-2 w-2 shrink-0 rounded-full',
                    PRIORITY_DOT_COLORS[task.priority],
                  )}
                />
                {PRIORITY_LABELS[task.priority]}
              </span>
              {task.due_date && (
                <span className="text-muted-foreground flex items-center gap-1 text-xs">
                  <Calendar className="h-3 w-3" />
                  {new Date(task.due_date).toLocaleDateString('ko-KR', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
              {hasMultiAssignees ? (
                <div className="ml-auto">
                  <AvatarGroup assignees={taskAssignees} maxDisplay={3} />
                </div>
              ) : (
                assignee && (
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
                )
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  )
}
