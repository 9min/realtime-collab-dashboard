'use client'

import { Search, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TASK_PRIORITY } from '@/lib/constants'
import { UNASSIGNED_ID } from '@/lib/task-filter'
import { cn } from '@/lib/utils'
import { useKanbanFilterStore } from '@/stores/kanban-filter-store'
import type { Tables } from '@/types/database'
import type { TaskPriority } from '@/types/common'

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: '낮음',
  medium: '보통',
  high: '높음',
  urgent: '긴급',
}

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  low: 'border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-300',
  medium: 'border-blue-300 text-blue-700 dark:border-blue-600 dark:text-blue-300',
  high: 'border-orange-300 text-orange-700 dark:border-orange-600 dark:text-orange-300',
  urgent: 'border-red-300 text-red-700 dark:border-red-600 dark:text-red-300',
}

const PRIORITY_ACTIVE_STYLES: Record<TaskPriority, string> = {
  low: 'bg-slate-100 border-slate-500 dark:bg-slate-800',
  medium: 'bg-blue-100 border-blue-500 dark:bg-blue-900',
  high: 'bg-orange-100 border-orange-500 dark:bg-orange-900',
  urgent: 'bg-red-100 border-red-500 dark:bg-red-900',
}

interface MemberOption {
  id: string
  label: string
}

interface TaskFilterBarProps {
  members: (Tables<'project_members'> & { profiles: Tables<'profiles'> })[]
}

export function TaskFilterBar({ members }: TaskFilterBarProps) {
  const {
    searchText,
    setSearchText,
    priorities,
    togglePriority,
    assigneeIds,
    toggleAssigneeId,
    dueDateRange,
    setDueDateFrom,
    setDueDateTo,
    resetFilters,
    hasActiveFilters,
  } = useKanbanFilterStore()

  const memberOptions: MemberOption[] = [
    { id: UNASSIGNED_ID, label: '미배정' },
    ...members.map((m) => ({
      id: m.user_id,
      label: m.profiles.full_name ?? m.profiles.email,
    })),
  ]

  const allPriorities = Object.values(TASK_PRIORITY) as TaskPriority[]

  return (
    <div className="flex flex-wrap items-center gap-3 pb-4">
      {/* 검색 Input */}
      <div className="relative w-56">
        <Search className="text-muted-foreground absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="태스크 검색..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* 우선순위 Badge 토글 */}
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground text-xs">우선순위:</span>
        {allPriorities.map((priority) => {
          const isActive = priorities.includes(priority)
          return (
            <Badge
              key={priority}
              variant="outline"
              className={cn(
                'cursor-pointer select-none transition-colors',
                PRIORITY_STYLES[priority],
                isActive && PRIORITY_ACTIVE_STYLES[priority],
              )}
              onClick={() => togglePriority(priority)}
            >
              {PRIORITY_LABELS[priority]}
            </Badge>
          )
        })}
      </div>

      {/* 담당자 Badge 토글 */}
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground text-xs">담당자:</span>
        <div className="flex flex-wrap gap-1">
          {memberOptions.map((option) => {
            const isActive = assigneeIds.includes(option.id)
            return (
              <Badge
                key={option.id}
                variant="outline"
                className={cn(
                  'cursor-pointer select-none transition-colors',
                  isActive && 'border-primary bg-primary/10',
                )}
                onClick={() => toggleAssigneeId(option.id)}
              >
                {option.label}
              </Badge>
            )
          })}
        </div>
      </div>

      {/* 마감일 범위 */}
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground text-xs">마감일:</span>
        <Input
          type="date"
          value={dueDateRange.from ?? ''}
          onChange={(e) => setDueDateFrom(e.target.value || null)}
          className="h-8 w-36 text-xs"
        />
        <span className="text-muted-foreground text-xs">~</span>
        <Input
          type="date"
          value={dueDateRange.to ?? ''}
          onChange={(e) => setDueDateTo(e.target.value || null)}
          className="h-8 w-36 text-xs"
        />
      </div>

      {/* 필터 초기화 */}
      {hasActiveFilters() && (
        <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 gap-1 text-xs">
          <X className="h-3 w-3" />
          초기화
        </Button>
      )}
    </div>
  )
}
