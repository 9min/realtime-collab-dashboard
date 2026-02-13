'use client'

import { useState } from 'react'
import { Check, Eye, Plus, UserPlus, X } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useProjectMembers } from '@/queries/use-projects'
import {
  useTaskAssignees,
  useAddTaskAssignee,
  useRemoveTaskAssignee,
  useUpdateTaskAssigneeRole,
} from '@/queries/use-task-assignees'
import { TASK_ASSIGNEE_ROLE } from '@/types/task-assignee'
import type { TaskAssigneeRole } from '@/types/task-assignee'
import type { Tables } from '@/types/database'

interface AssigneePickerProps {
  taskId: string
  projectId: string
  canEdit?: boolean
}

export function AssigneePicker({ taskId, projectId, canEdit = true }: AssigneePickerProps) {
  const [open, setOpen] = useState(false)
  const { data: assignees } = useTaskAssignees(taskId)
  const { data: members } = useProjectMembers(projectId)
  const addMutation = useAddTaskAssignee(projectId)
  const removeMutation = useRemoveTaskAssignee(projectId)
  const updateRoleMutation = useUpdateTaskAssigneeRole(projectId)

  const assigneeCount = assignees?.filter((a) => a.role === TASK_ASSIGNEE_ROLE.ASSIGNEE).length ?? 0
  const watcherCount = assignees?.filter((a) => a.role === TASK_ASSIGNEE_ROLE.WATCHER).length ?? 0

  const handleToggle = (userId: string, role: TaskAssigneeRole) => {
    if (!canEdit) return

    const existing = assignees?.find((a) => a.user_id === userId)
    if (existing) {
      if (existing.role === role) {
        removeMutation.mutate({ taskId, userId })
      } else {
        updateRoleMutation.mutate({ taskId, userId, role })
      }
    } else {
      addMutation.mutate({ taskId, userId, role })
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Current assignees display */}
      <div className="flex flex-wrap items-center gap-1.5">
        {assignees && assignees.length > 0 ? (
          assignees.map((a) => (
            <TooltipProvider key={a.user_id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant={a.role === TASK_ASSIGNEE_ROLE.ASSIGNEE ? 'secondary' : 'outline'}
                    className="gap-1 pr-1 pl-1"
                  >
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={a.profiles.avatar_url ?? undefined} />
                      <AvatarFallback className="text-[8px]">
                        {(a.profiles.full_name ?? a.profiles.email).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="max-w-[80px] truncate text-xs">
                      {a.profiles.full_name ?? a.profiles.email}
                    </span>
                    {a.role === TASK_ASSIGNEE_ROLE.WATCHER && (
                      <Eye className="h-3 w-3 opacity-50" />
                    )}
                    {canEdit && (
                      <button
                        onClick={() => removeMutation.mutate({ taskId, userId: a.user_id })}
                        className="hover:bg-muted ml-0.5 cursor-pointer rounded-full p-0.5"
                        aria-label={`${a.profiles.full_name ?? a.profiles.email} 제거`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {a.profiles.full_name ?? a.profiles.email} (
                    {a.role === TASK_ASSIGNEE_ROLE.ASSIGNEE ? '담당자' : '워처'})
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))
        ) : (
          <span className="text-muted-foreground text-sm">미배정</span>
        )}

        {canEdit && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Plus className="h-3.5 w-3.5" />
                <span className="sr-only">담당자 추가</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64 p-2">
              <div className="space-y-1">
                <p className="text-muted-foreground px-2 py-1 text-xs font-medium">
                  담당자 ({assigneeCount}) · 워처 ({watcherCount})
                </p>
                {members?.map((member) => {
                  const existing = assignees?.find((a) => a.user_id === member.user_id)
                  const profile = member.profiles as Tables<'profiles'>

                  return (
                    <div
                      key={member.user_id}
                      className="flex items-center gap-2 rounded-sm px-2 py-1.5"
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={profile.avatar_url ?? undefined} />
                        <AvatarFallback className="text-[10px]">
                          {(profile.full_name ?? profile.email).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="min-w-0 flex-1 truncate text-sm">
                        {profile.full_name ?? profile.email}
                      </span>
                      <div className="flex gap-0.5">
                        <button
                          onClick={() => handleToggle(member.user_id, TASK_ASSIGNEE_ROLE.ASSIGNEE)}
                          className={cn(
                            'flex h-6 w-6 cursor-pointer items-center justify-center rounded transition-colors',
                            existing?.role === TASK_ASSIGNEE_ROLE.ASSIGNEE
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-accent',
                          )}
                          aria-label={`${profile.full_name ?? profile.email} 담당자 토글`}
                        >
                          {existing?.role === TASK_ASSIGNEE_ROLE.ASSIGNEE ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <UserPlus className="h-3.5 w-3.5 opacity-40" />
                          )}
                        </button>
                        <button
                          onClick={() => handleToggle(member.user_id, TASK_ASSIGNEE_ROLE.WATCHER)}
                          className={cn(
                            'flex h-6 w-6 cursor-pointer items-center justify-center rounded transition-colors',
                            existing?.role === TASK_ASSIGNEE_ROLE.WATCHER
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-accent',
                          )}
                          aria-label={`${profile.full_name ?? profile.email} 워처 토글`}
                        >
                          {existing?.role === TASK_ASSIGNEE_ROLE.WATCHER ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5 opacity-40" />
                          )}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  )
}

// AvatarGroup for task cards (compact display)
interface AvatarGroupProps {
  assignees: Array<{
    user_id: string
    role: string
    profiles: {
      full_name: string | null
      email: string
      avatar_url: string | null
    }
  }>
  maxDisplay?: number
}

export function AvatarGroup({ assignees, maxDisplay = 3 }: AvatarGroupProps) {
  const displayed = assignees.slice(0, maxDisplay)
  const remaining = assignees.length - maxDisplay

  return (
    <TooltipProvider>
      <div className="flex -space-x-1.5">
        {displayed.map((a) => (
          <Tooltip key={a.user_id}>
            <TooltipTrigger asChild>
              <Avatar className="ring-background h-6 w-6 ring-2">
                <AvatarImage src={a.profiles.avatar_url ?? undefined} />
                <AvatarFallback className="text-[10px]">
                  {(a.profiles.full_name ?? a.profiles.email).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {a.profiles.full_name ?? a.profiles.email}
                {a.role === 'watcher' ? ' (워처)' : ''}
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
        {remaining > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className="ring-background h-6 w-6 ring-2">
                <AvatarFallback className="bg-muted text-[10px]">+{remaining}</AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {assignees
                  .slice(maxDisplay)
                  .map((a) => a.profiles.full_name ?? a.profiles.email)
                  .join(', ')}
              </p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
}
