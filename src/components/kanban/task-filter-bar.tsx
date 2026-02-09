'use client'

import { Check, ChevronDown, Search, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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

const PRIORITY_DOT_COLORS: Record<TaskPriority, string> = {
  low: 'bg-slate-400',
  medium: 'bg-blue-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
}

interface MemberOption {
  id: string
  label: string
}

interface TaskFilterBarProps {
  members: (Tables<'project_members'> & { profiles: Tables<'profiles'> })[]
  labels?: Tables<'labels'>[]
}

export function TaskFilterBar({ members, labels }: TaskFilterBarProps) {
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
    labelIds,
    toggleLabelId,
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

  const priorityLabel =
    priorities.length === 0
      ? '전체'
      : priorities.length === 1
        ? PRIORITY_LABELS[priorities[0]]
        : `${priorities.length}개 선택`

  const assigneeLabel =
    assigneeIds.length === 0
      ? '전체'
      : assigneeIds.length === 1
        ? (memberOptions.find((m) => m.id === assigneeIds[0])?.label ?? '1명')
        : `${assigneeIds.length}명 선택`

  return (
    <div className="flex flex-wrap items-center gap-2 pb-4 sm:gap-3">
      {/* 검색 Input */}
      <div className="relative w-full sm:w-56">
        <Search className="text-muted-foreground absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="태스크 검색..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* 우선순위 셀렉트 */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-1.5 text-sm font-normal">
            <span className="text-muted-foreground">우선순위:</span>
            <span>{priorityLabel}</span>
            <ChevronDown className="text-muted-foreground h-3.5 w-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-44 p-1">
          {allPriorities.map((priority) => {
            const isActive = priorities.includes(priority)
            return (
              <button
                key={priority}
                role="checkbox"
                aria-checked={isActive}
                onClick={() => togglePriority(priority)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  isActive && 'bg-accent/50',
                )}
              >
                <div
                  aria-hidden="true"
                  className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border',
                    isActive ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30',
                  )}
                >
                  {isActive && <Check className="h-3 w-3" />}
                </div>
                <span className={cn('h-2 w-2 rounded-full', PRIORITY_DOT_COLORS[priority])} />
                {PRIORITY_LABELS[priority]}
              </button>
            )
          })}
        </PopoverContent>
      </Popover>

      {/* 담당자 셀렉트 */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-1.5 text-sm font-normal">
            <span className="text-muted-foreground">담당자:</span>
            <span>{assigneeLabel}</span>
            <ChevronDown className="text-muted-foreground h-3.5 w-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-48 p-1">
          {memberOptions.map((option) => {
            const isActive = assigneeIds.includes(option.id)
            return (
              <button
                key={option.id}
                role="checkbox"
                aria-checked={isActive}
                onClick={() => toggleAssigneeId(option.id)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  isActive && 'bg-accent/50',
                )}
              >
                <div
                  aria-hidden="true"
                  className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border',
                    isActive ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30',
                  )}
                >
                  {isActive && <Check className="h-3 w-3" />}
                </div>
                {option.label}
              </button>
            )
          })}
        </PopoverContent>
      </Popover>

      {/* 라벨 필터 */}
      {labels && labels.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-1.5 text-sm font-normal">
              <span className="text-muted-foreground">라벨:</span>
              <span>
                {labelIds.length === 0
                  ? '전체'
                  : labelIds.length === 1
                    ? (labels.find((l) => l.id === labelIds[0])?.name ?? '1개')
                    : `${labelIds.length}개 선택`}
              </span>
              <ChevronDown className="text-muted-foreground h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-48 p-1">
            {labels.map((label) => {
              const isActive = labelIds.includes(label.id)
              return (
                <button
                  key={label.id}
                  role="checkbox"
                  aria-checked={isActive}
                  onClick={() => toggleLabelId(label.id)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors',
                    'hover:bg-accent hover:text-accent-foreground',
                    isActive && 'bg-accent/50',
                  )}
                >
                  <div
                    aria-hidden="true"
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border',
                      isActive ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30',
                    )}
                  >
                    {isActive && <Check className="h-3 w-3" />}
                  </div>
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: label.color }}
                  />
                  {label.name}
                </button>
              )
            })}
          </PopoverContent>
        </Popover>
      )}

      {/* 마감일 범위 */}
      <div className="flex w-full items-center gap-1.5 sm:w-auto">
        <span className="text-muted-foreground shrink-0 text-xs">마감일:</span>
        <Input
          type="date"
          value={dueDateRange.from ?? ''}
          onChange={(e) => setDueDateFrom(e.target.value || null)}
          className="h-9 min-w-0 flex-1 text-xs sm:w-36 sm:flex-none"
          aria-label="마감일 시작"
        />
        <span className="text-muted-foreground text-xs">~</span>
        <Input
          type="date"
          value={dueDateRange.to ?? ''}
          onChange={(e) => setDueDateTo(e.target.value || null)}
          className="h-9 min-w-0 flex-1 text-xs sm:w-36 sm:flex-none"
          aria-label="마감일 종료"
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
