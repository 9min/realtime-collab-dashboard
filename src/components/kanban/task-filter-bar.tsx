'use client'

import { useEffect, useRef, useState } from 'react'
import {
  CalendarDays,
  Check,
  ChevronDown,
  Download,
  MoreHorizontal,
  Search,
  Trash2,
  X,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { useExport } from '@/hooks/use-export'
import { PRIORITY_LABELS, PRIORITY_DOT_COLORS, SWIMLANE_MODE, TASK_PRIORITY } from '@/lib/constants'
import { UNASSIGNED_ID } from '@/lib/task-filter'
import { cn } from '@/lib/utils'
import {
  useKanbanFilterPreset,
  useSaveKanbanFilterPreset,
} from '@/queries/use-kanban-filter-preset'
import { useKanbanFilterStore } from '@/stores/kanban-filter-store'
import type { Tables } from '@/types/database'
import type { SwimlaneMode, TaskPriority } from '@/types/common'
import type { Task } from '@/types/kanban'

import { BulkDeleteDialog } from './bulk-delete-dialog'

interface MemberOption {
  id: string
  label: string
}

interface TaskFilterBarProps {
  members: (Tables<'project_members'> & { profiles: Tables<'profiles'> })[]
  labels?: Tables<'labels'>[]
  projectId?: string
  projectName?: string
  canDeleteAll?: boolean
  tasks?: Task[]
}

const FILTER_SAVE_DEBOUNCE_MS = 1000

export function TaskFilterBar({
  members,
  labels,
  projectId,
  projectName,
  canDeleteAll,
  tasks,
}: TaskFilterBarProps) {
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
    clearDueDateRange,
    labelIds,
    toggleLabelId,
    swimlaneMode,
    setSwimlaneMode,
    resetFilters,
    hasActiveFilters,
    hydrate,
    getSavedState,
  } = useKanbanFilterStore()

  const [dueDateOpen, setDueDateOpen] = useState(false)

  // ── 필터 프리셋 로드 & 자동 저장 ──
  const { data: presetData, isSuccess: presetLoaded } = useKanbanFilterPreset(projectId ?? '')
  const saveMutation = useSaveKanbanFilterPreset(projectId ?? '')
  const hydratedRef = useRef(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 최초 로드 시 서버 프리셋으로 hydrate
  useEffect(() => {
    if (presetLoaded && !hydratedRef.current) {
      hydratedRef.current = true
      if (presetData) {
        hydrate(presetData)
      }
    }
  }, [presetLoaded, presetData, hydrate])

  // 필터 변경 시 debounce 자동 저장
  useEffect(() => {
    if (!projectId || !hydratedRef.current) return

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      saveMutation.mutate(getSavedState())
    }, FILTER_SAVE_DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priorities, assigneeIds, dueDateRange, labelIds, swimlaneMode, projectId])

  const exportMutation = useExport(projectId ?? '', projectName)

  const memberOptions: MemberOption[] = [
    { id: UNASSIGNED_ID, label: '미배정' },
    ...members.map((m) => ({
      id: m.user_id,
      label: m.profiles.full_name ?? m.profiles.email,
    })),
  ]

  const allPriorities = Object.values(TASK_PRIORITY) as TaskPriority[]

  const hasDueDateFilter = dueDateRange.from !== null || dueDateRange.to !== null

  const formatDate = (dateStr: string) => {
    const parts = dateStr.split('-')
    return `${parts[1]}/${parts[2]}`
  }

  return (
    <div className="space-y-2 pb-3">
      {/* Row 1: 검색 + 필터 트리거 + 뷰 + 액션 */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {/* 검색 */}
        <div className="relative w-full sm:max-w-sm sm:flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="태스크 검색..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="h-8 pl-9 text-sm"
          />
        </div>

        <Separator orientation="vertical" className="hidden h-5 sm:block" />

        {/* 필터 트리거 그룹 */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {/* 우선순위 */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={priorities.length > 0 ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 shrink-0 gap-1 text-xs"
              >
                우선순위
                {priorities.length > 0 && (
                  <Badge className="h-4 min-w-4 px-1 text-[10px]">{priorities.length}</Badge>
                )}
                <ChevronDown className="h-3 w-3" />
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
                      'flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors outline-none',
                      'hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring focus-visible:ring-2',
                      isActive && 'bg-accent/50',
                    )}
                  >
                    <div
                      aria-hidden="true"
                      className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border',
                        isActive
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/30',
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

          {/* 담당자 */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={assigneeIds.length > 0 ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 shrink-0 gap-1 text-xs"
              >
                담당자
                {assigneeIds.length > 0 && (
                  <Badge className="h-4 min-w-4 px-1 text-[10px]">{assigneeIds.length}</Badge>
                )}
                <ChevronDown className="h-3 w-3" />
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
                      'flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors outline-none',
                      'hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring focus-visible:ring-2',
                      isActive && 'bg-accent/50',
                    )}
                  >
                    <div
                      aria-hidden="true"
                      className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border',
                        isActive
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/30',
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

          {/* 라벨 */}
          {labels && labels.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={labelIds.length > 0 ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-8 shrink-0 gap-1 text-xs"
                >
                  라벨
                  {labelIds.length > 0 && (
                    <Badge className="h-4 min-w-4 px-1 text-[10px]">{labelIds.length}</Badge>
                  )}
                  <ChevronDown className="h-3 w-3" />
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
                        'flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors',
                        'hover:bg-accent hover:text-accent-foreground',
                        isActive && 'bg-accent/50',
                      )}
                    >
                      <div
                        aria-hidden="true"
                        className={cn(
                          'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border',
                          isActive
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-muted-foreground/30',
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

          {/* 마감일 */}
          <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={hasDueDateFilter ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 shrink-0 gap-1 text-xs"
              >
                <CalendarDays className="h-3.5 w-3.5" />
                마감일
                <ChevronDown className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64 space-y-3 p-3">
              <div className="space-y-2">
                <label className="text-xs font-medium" htmlFor="due-date-from">
                  시작일
                </label>
                <Input
                  id="due-date-from"
                  type="date"
                  value={dueDateRange.from ?? ''}
                  onChange={(e) => setDueDateFrom(e.target.value || null)}
                  className="h-8 text-xs"
                  aria-label="마감일 시작"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium" htmlFor="due-date-to">
                  종료일
                </label>
                <Input
                  id="due-date-to"
                  type="date"
                  value={dueDateRange.to ?? ''}
                  onChange={(e) => setDueDateTo(e.target.value || null)}
                  className="h-8 text-xs"
                  aria-label="마감일 종료"
                />
              </div>
              {hasDueDateFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-full text-xs"
                  onClick={() => {
                    clearDueDateRange()
                    setDueDateOpen(false)
                  }}
                >
                  초기화
                </Button>
              )}
            </PopoverContent>
          </Popover>

          <Separator orientation="vertical" className="hidden h-5 sm:block" />

          {/* 뷰 모드 */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={swimlaneMode !== SWIMLANE_MODE.NONE ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 shrink-0 gap-1 text-xs"
              >
                뷰
                {swimlaneMode !== SWIMLANE_MODE.NONE && (
                  <span className="text-muted-foreground">
                    {swimlaneMode === SWIMLANE_MODE.ASSIGNEE ? '담당자별' : '우선순위별'}
                  </span>
                )}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-40 p-1">
              {(
                [
                  { value: SWIMLANE_MODE.NONE, label: '기본' },
                  { value: SWIMLANE_MODE.ASSIGNEE, label: '담당자별' },
                  { value: SWIMLANE_MODE.PRIORITY, label: '우선순위별' },
                ] as const
              ).map((option) => {
                const isActive = swimlaneMode === option.value
                return (
                  <button
                    key={option.value}
                    role="radio"
                    aria-checked={isActive}
                    onClick={() => setSwimlaneMode(option.value as SwimlaneMode)}
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors outline-none',
                      'hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring focus-visible:ring-2',
                      isActive && 'bg-accent/50',
                    )}
                  >
                    <div
                      aria-hidden="true"
                      className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                        isActive
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/30',
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
        </div>

        <Separator orientation="vertical" className="hidden h-5 sm:block" />

        {/* 오버플로우 액션 메뉴 */}
        {projectId && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 shrink-0 p-0">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">더보기</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => exportMutation.mutate('csv')}
                disabled={exportMutation.isPending}
              >
                <Download className="mr-2 h-4 w-4" />
                CSV로 내보내기
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => exportMutation.mutate('json')}
                disabled={exportMutation.isPending}
              >
                <Download className="mr-2 h-4 w-4" />
                JSON으로 내보내기
              </DropdownMenuItem>
              {canDeleteAll && (
                <>
                  <DropdownMenuSeparator />
                  <BulkDeleteMenuItem projectId={projectId} tasks={tasks ?? []} />
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Row 2: 활성 필터 Badge 칩 */}
      {hasActiveFilters() && (
        <div className="flex flex-wrap items-center gap-1.5">
          {/* 우선순위 Badges */}
          {priorities.map((p) => (
            <Badge key={p} variant="secondary" className="gap-1 pr-1 pl-1.5">
              <span className={cn('h-2 w-2 rounded-full', PRIORITY_DOT_COLORS[p])} />
              {PRIORITY_LABELS[p]}
              <button
                onClick={() => togglePriority(p)}
                className="hover:bg-muted ml-0.5 cursor-pointer rounded-full p-0.5"
                aria-label={`${PRIORITY_LABELS[p]} 필터 제거`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          {/* 담당자 Badges */}
          {assigneeIds.map((id) => {
            const name = memberOptions.find((m) => m.id === id)?.label ?? id
            return (
              <Badge key={id} variant="secondary" className="gap-1 pr-1">
                {name}
                <button
                  onClick={() => toggleAssigneeId(id)}
                  className="hover:bg-muted ml-0.5 cursor-pointer rounded-full p-0.5"
                  aria-label={`${name} 필터 제거`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )
          })}

          {/* 라벨 Badges */}
          {labels &&
            labelIds.map((id) => {
              const label = labels.find((l) => l.id === id)
              if (!label) return null
              return (
                <Badge
                  key={id}
                  variant="outline"
                  className="gap-1 pr-1"
                  style={{ borderColor: label.color }}
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: label.color }}
                  />
                  {label.name}
                  <button
                    onClick={() => toggleLabelId(id)}
                    className="hover:bg-muted ml-0.5 cursor-pointer rounded-full p-0.5"
                    aria-label={`${label.name} 필터 제거`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )
            })}

          {/* 마감일 Badge */}
          {hasDueDateFilter && (
            <Badge variant="secondary" className="gap-1 pr-1">
              <CalendarDays className="h-3 w-3" />
              {dueDateRange.from ? formatDate(dueDateRange.from) : '...'}
              {' ~ '}
              {dueDateRange.to ? formatDate(dueDateRange.to) : '...'}
              <button
                onClick={clearDueDateRange}
                className="hover:bg-muted ml-0.5 cursor-pointer rounded-full p-0.5"
                aria-label="마감일 필터 제거"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          <Button variant="link" size="sm" className="h-6 px-1 text-xs" onClick={resetFilters}>
            모두 초기화
          </Button>
        </div>
      )}
    </div>
  )
}

/** BulkDeleteDialog를 DropdownMenuItem에서 트리거하기 위한 내부 컴포넌트 */
function BulkDeleteMenuItem({ projectId, tasks }: { projectId: string; tasks: Task[] }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <DropdownMenuItem
        onSelect={(e) => {
          e.preventDefault()
          setOpen(true)
        }}
        className="text-destructive"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        일괄 삭제
      </DropdownMenuItem>
      {open && (
        <BulkDeleteDialog
          projectId={projectId}
          tasks={tasks}
          externalOpen={open}
          onExternalOpenChange={setOpen}
        />
      )}
    </>
  )
}
