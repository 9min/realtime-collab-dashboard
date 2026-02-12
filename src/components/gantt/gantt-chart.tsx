'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { CalendarDays, CalendarRange } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TooltipProvider } from '@/components/ui/tooltip'

const TaskDetailDialog = dynamic(
  () => import('@/components/kanban/task-detail-dialog').then((mod) => ({ default: mod.TaskDetailDialog })),
)
import { useAuth } from '@/hooks/use-auth'
import { useMediaQuery } from '@/hooks/use-media-query'
import {
  startOfWeek,
  getWeekColumns,
  getMonthViewColumns,
  taskToBarPosition,
  daysBetween,
  addDays,
} from '@/lib/gantt-utils'
import type { DateColumn, MonthViewColumn } from '@/lib/gantt-utils'
import { MEMBER_ROLE, PRIORITY_LABELS, PRIORITY_DOT_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useProjectMembers } from '@/queries/use-projects'
import { useTasks } from '@/queries/use-tasks'
import { useColumns } from '@/queries/use-columns'
import { useDependencies } from '@/queries/use-dependencies'
import { useGanttStore } from '@/stores/gantt-store'
import type { TaskPriority } from '@/types/common'
import type { Tables } from '@/types/database'

import { GanttBar } from './gantt-bar'
import { GanttDependencyArrows } from './gantt-dependency-arrows'
import { GanttHeader, HEADER_HEIGHT } from './gantt-header'

const MIN_WEEK_VIEW_WEEKS = 6
const MIN_MONTH_VIEW_MONTHS = 6
const COL_WIDTH_WEEK = 36
const DAY_WIDTH_MONTH = 6
const ROW_HEIGHT = 36
const LABEL_WIDTH_DESKTOP = 200
const LABEL_WIDTH_MOBILE = 120
const COLUMN_HEADER_ROW_HEIGHT = 24

const PRIORITY_ORDER: TaskPriority[] = ['urgent', 'high', 'medium', 'low']

interface GanttChartProps {
  projectId: string
}

export function GanttChart({ projectId }: GanttChartProps) {
  const { user } = useAuth()
  const { data: tasks, isLoading: tasksLoading } = useTasks(projectId)
  const { data: columns } = useColumns(projectId)
  const { data: members } = useProjectMembers(projectId)
  const { viewMode, setViewMode } = useGanttStore()
  const { data: dependencies } = useDependencies(projectId)
  const [selectedTask, setSelectedTask] = useState<Tables<'tasks'> | null>(null)
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const labelWidth = isDesktop ? LABEL_WIDTH_DESKTOP : LABEL_WIDTH_MOBILE

  const currentRole = members?.find((m) => m.user_id === user?.id)?.role
  const isViewer = currentRole === MEMBER_ROLE.VIEWER
  const canEdit = !isViewer
  const canDeleteAll = currentRole === MEMBER_ROLE.OWNER || currentRole === MEMBER_ROLE.ADMIN

  const now = new Date()

  const { timelineColumns, timelineStart, totalDays, columnWidth, monthViewColumns, timelineTotalWidth } = useMemo(() => {
    // 태스크 날짜 범위 계산
    let taskMin: Date | null = null
    let taskMax: Date | null = null
    if (tasks && tasks.length > 0) {
      for (const t of tasks) {
        const s = new Date(t.created_at)
        const e = t.due_date ? new Date(t.due_date) : null
        if (!taskMin || s < taskMin) taskMin = s
        if (e && (!taskMax || e > taskMax)) taskMax = e
      }
    }

    if (viewMode === 'week') {
      let start = startOfWeek(addDays(now, -7))
      let end = addDays(start, MIN_WEEK_VIEW_WEEKS * 7)

      if (taskMin && taskMin < start) {
        start = startOfWeek(addDays(taskMin, -7))
      }
      if (taskMax && taskMax > end) {
        end = addDays(taskMax, 7)
      }

      const weeksNeeded = Math.max(MIN_WEEK_VIEW_WEEKS, Math.ceil(daysBetween(start, end) / 7))
      const cols = getWeekColumns(start, weeksNeeded)
      return {
        timelineColumns: cols,
        timelineStart: start,
        totalDays: weeksNeeded * 7,
        columnWidth: COL_WIDTH_WEEK,
        monthViewColumns: null as MonthViewColumn[] | null,
        timelineTotalWidth: cols.length * COL_WIDTH_WEEK,
      }
    }

    // 월 단위: 전월부터 시작, 태스크 범위에 맞게 확장
    let monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    let monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + MIN_MONTH_VIEW_MONTHS, 1)

    if (taskMin) {
      const taskMinMonth = new Date(taskMin.getFullYear(), taskMin.getMonth(), 1)
      if (taskMinMonth < monthStart) monthStart = taskMinMonth
    }
    if (taskMax && taskMax >= monthEnd) {
      monthEnd = new Date(taskMax.getFullYear(), taskMax.getMonth() + 2, 1)
    }

    const monthCount = Math.max(
      MIN_MONTH_VIEW_MONTHS,
      (monthEnd.getFullYear() - monthStart.getFullYear()) * 12 + monthEnd.getMonth() - monthStart.getMonth(),
    )
    const monthCols = getMonthViewColumns(monthStart, monthCount)
    const actualEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + monthCount, 1)
    const total = daysBetween(monthStart, actualEnd)
    return {
      timelineColumns: [] as DateColumn[],
      timelineStart: monthStart,
      totalDays: total,
      columnWidth: 0,
      monthViewColumns: monthCols,
      timelineTotalWidth: total * DAY_WIDTH_MONTH,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, tasks])

  // 컬럼별로 태스크 그룹핑
  const groupedTasks = useMemo(() => {
    if (!tasks || !columns) return []

    const sortedColumns = [...columns].sort((a, b) => a.position - b.position)
    return sortedColumns.map((col) => ({
      column: col,
      tasks: tasks
        .filter((t) => t.column_id === col.id)
        .sort((a, b) => a.position - b.position),
    }))
  }, [tasks, columns])

  // 오늘 위치 (%)
  const todayOffset = useMemo(() => {
    const days = daysBetween(timelineStart, now)
    return (days / totalDays) * 100
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timelineStart, totalDays])

  // 주말 컬럼 인덱스 (주 단위 뷰에서만)
  const weekendColumns = useMemo(() => {
    if (viewMode !== 'week') return []
    return timelineColumns
      .map((col, idx) => (col.isWeekend ? idx : -1))
      .filter((idx) => idx >= 0)
  }, [timelineColumns, viewMode])

  const getMemberName = (assigneeId: string | null) => {
    if (!assigneeId || !members) return null
    const member = members.find((m) => m.user_id === assigneeId)
    return member?.profiles.full_name ?? member?.profiles.email ?? null
  }

  const getMemberInitials = (assigneeId: string | null) => {
    if (!assigneeId || !members) return null
    const member = members.find((m) => m.user_id === assigneeId)
    const name = member?.profiles.full_name ?? member?.profiles.email
    if (!name) return null
    return name.slice(0, 2).toUpperCase()
  }

  if (tasksLoading) {
    return (
      <div className="space-y-4">
        {/* 스켈레톤: 뷰 토글 + 레전드 */}
        <div className="flex items-center gap-3">
          <div className="flex gap-0.5 rounded-lg border bg-muted p-0.5">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
          <div className="hidden md:flex items-center gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <Skeleton className="h-2.5 w-2.5 rounded-full" />
                <Skeleton className="h-3 w-8" />
              </div>
            ))}
          </div>
        </div>
        {/* 스켈레톤: 차트 */}
        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="flex">
            <div className="shrink-0 border-r bg-card" style={{ width: isDesktop ? LABEL_WIDTH_DESKTOP : LABEL_WIDTH_MOBILE }}>
              {/* 헤더 스페이서 (2행) */}
              <div style={{ height: HEADER_HEIGHT }} className="border-b" />
              {/* 컬럼 헤더 스켈레톤 */}
              <div className="bg-slate-100/80 dark:bg-slate-800/50 border-b px-3 py-1" style={{ height: COLUMN_HEADER_ROW_HEIGHT }}>
                <Skeleton className="h-3 w-16" />
              </div>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center border-b px-3 gap-2" style={{ height: ROW_HEIGHT }}>
                  <Skeleton className="h-2.5 w-2.5 shrink-0 rounded-full" />
                  <Skeleton className="h-3 flex-1" />
                </div>
              ))}
            </div>
            <div className="flex-1">
              {/* 2행 헤더 스켈레톤 */}
              <Skeleton className="border-b rounded-none" style={{ height: HEADER_HEIGHT }} />
              <div style={{ height: COLUMN_HEADER_ROW_HEIGHT }} className="border-b" />
              {[45, 60, 35, 55, 40].map((width, i) => (
                <div
                  key={i}
                  className={cn('flex items-center px-4 border-b', i % 2 === 1 && 'bg-blue-50/70 dark:bg-blue-950/20')}
                  style={{ height: ROW_HEIGHT }}
                >
                  <Skeleton
                    className="h-5"
                    style={{ width: `${width}%`, marginLeft: `${i * 8}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const allTasks = groupedTasks.flatMap((g) => g.tasks)
  if (allTasks.length === 0) {
    return (
      <EmptyState
        icon={CalendarRange}
        title="표시할 태스크가 없습니다"
        description="칸반 보드에서 마감일이 있는 태스크를 추가하면 간트 차트에 표시됩니다"
      />
    )
  }

  // 전체 행 인덱스 (제브라 스트라이핑용)
  let globalRowIndex = 0

  return (
    <div className="space-y-4">
      {/* 뷰 모드 전환 + 우선순위 레전드 */}
      <div className="flex items-center gap-4">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'week' | 'month')}>
          <TabsList>
            <TabsTrigger value="week">
              <CalendarDays className="h-3.5 w-3.5" />
              주 단위
            </TabsTrigger>
            <TabsTrigger value="month">
              <CalendarRange className="h-3.5 w-3.5" />
              월 단위
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* 우선순위 레전드 */}
        <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground">
          {PRIORITY_ORDER.map((p) => (
            <div key={p} className="flex items-center gap-1.5">
              <span className={cn('inline-block h-2.5 w-2.5 rounded-full', PRIORITY_DOT_COLORS[p])} />
              <span>{PRIORITY_LABELS[p]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 간트 차트 */}
      <div className="border-border overflow-hidden rounded-lg border bg-card">
        <TooltipProvider delayDuration={300}>
          <ScrollArea className="w-full">
            <div className="flex">
              {/* 왼쪽: 태스크 레이블 */}
              <div className="border-border shrink-0 border-r bg-card" style={{ width: labelWidth }}>
                {/* 헤더 스페이서 (2행 헤더 높이 매칭) */}
                <div className="border-border border-b bg-blue-50 dark:bg-blue-950/30" style={{ height: HEADER_HEIGHT }} />
                {groupedTasks.map((group) => {
                  const columnRowIdx = globalRowIndex
                  return (
                    <div key={group.column.id}>
                      {/* 컬럼 헤더 */}
                      <div
                        className="bg-slate-100/80 border-border flex items-center gap-2 border-b px-3 text-xs font-semibold dark:bg-slate-800/50"
                        style={{ height: COLUMN_HEADER_ROW_HEIGHT }}
                      >
                        <span>{group.column.title}</span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                          {group.tasks.length}
                        </Badge>
                      </div>
                      {group.tasks.map((task, taskIdx) => {
                        const rowIdx = columnRowIdx + 1 + taskIdx
                        return (
                          <div
                            key={task.id}
                            className={cn(
                              'border-border flex items-center gap-2 border-b px-3 text-xs',
                              rowIdx % 2 === 1 && 'bg-blue-50/70 dark:bg-blue-950/20',
                            )}
                            style={{ height: ROW_HEIGHT }}
                          >
                            <span className={cn('inline-block h-2 w-2 shrink-0 rounded-full', PRIORITY_DOT_COLORS[task.priority as TaskPriority])} />
                            <span className="truncate flex-1">{task.title}</span>
                            {isDesktop && getMemberInitials(task.assignee_id) && (
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[9px] font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                                {getMemberInitials(task.assignee_id)}
                              </span>
                            )}
                          </div>
                        )
                      })}
                      {/* globalRowIndex를 다음 그룹으로 진행시키기 위해 부수효과 없이 숨김 처리 */}
                      <span className="hidden">{(globalRowIndex += 1 + group.tasks.length) && ''}</span>
                    </div>
                  )
                })}
              </div>

              {/* 오른쪽: 타임라인 */}
              <div className="min-w-0 flex-1">
                {viewMode === 'week' ? (
                  <GanttHeader viewMode="week" columns={timelineColumns} columnWidth={columnWidth} />
                ) : (
                  monthViewColumns && <GanttHeader viewMode="month" monthViewColumns={monthViewColumns} dayWidth={DAY_WIDTH_MONTH} />
                )}
                <div
                  className="relative"
                  style={{ minWidth: timelineTotalWidth }}
                >
                  {/* 주말 음영 (주 단위만) */}
                  {viewMode === 'week' && weekendColumns.map((colIdx) => (
                    <div
                      key={`weekend-${colIdx}`}
                      className="pointer-events-none absolute top-0 bottom-0 bg-slate-200/50 dark:bg-slate-700/25"
                      style={{
                        left: colIdx * columnWidth,
                        width: columnWidth,
                      }}
                    />
                  ))}

                  {/* 수직 그리드 라인 */}
                  {viewMode === 'week' ? (
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{
                        backgroundImage: `repeating-linear-gradient(to right, transparent, transparent ${columnWidth - 1}px, var(--border) ${columnWidth - 1}px, var(--border) ${columnWidth}px)`,
                        backgroundSize: `${columnWidth}px 100%`,
                      }}
                    />
                  ) : (
                    monthViewColumns && (() => {
                      let offset = 0
                      return monthViewColumns.map((col, i) => {
                        offset += col.days * DAY_WIDTH_MONTH
                        return (
                          <div
                            key={`month-line-${i}`}
                            className="pointer-events-none absolute top-0 bottom-0"
                            style={{
                              left: offset,
                              width: 1,
                              backgroundColor: 'var(--border)',
                            }}
                          />
                        )
                      })
                    })()
                  )}

                  {/* 오늘 표시선 + 라벨 */}
                  {todayOffset >= 0 && todayOffset <= 100 && (
                    <>
                      {/* 글로우 배경 */}
                      <div
                        className="pointer-events-none absolute top-0 bottom-0 z-[5] w-5 bg-blue-500/10 blur-sm dark:bg-blue-400/10"
                        style={{ left: `calc(${todayOffset}% - 10px)` }}
                      />
                      {/* 선 */}
                      <div
                        className="absolute top-0 bottom-0 z-10 w-0.5 bg-blue-600 dark:bg-blue-400"
                        style={{ left: `${todayOffset}%` }}
                      />
                      {/* 라벨 */}
                      <div
                        className="absolute z-10 -translate-x-1/2 rounded-b bg-blue-600 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm dark:bg-blue-500"
                        style={{ left: `${todayOffset}%`, top: 0 }}
                      >
                        오늘
                      </div>
                    </>
                  )}

                  {/* 태스크 바 */}
                  {(() => {
                    let rowIdx = 0
                    return groupedTasks.map((group) => (
                      <div key={group.column.id}>
                        {/* 컬럼 헤더 스페이서 */}
                        <div className="border-border border-b" style={{ height: COLUMN_HEADER_ROW_HEIGHT }} />
                        {group.tasks.map((task) => {
                          const currentRowIdx = ++rowIdx
                          return (
                            <div
                              key={task.id}
                              className={cn(
                                'border-border relative border-b',
                                currentRowIdx % 2 === 1 && 'bg-blue-50/70 dark:bg-blue-950/20',
                              )}
                              style={{ height: ROW_HEIGHT }}
                            >
                              <GanttBar
                                title={task.title}
                                priority={task.priority as 'low' | 'medium' | 'high' | 'urgent'}
                                assigneeName={getMemberName(task.assignee_id)}
                                dueDate={task.due_date}
                                position={taskToBarPosition(
                                  new Date(task.created_at),
                                  task.due_date ? new Date(task.due_date) : null,
                                  timelineStart,
                                  totalDays,
                                )}
                                onClick={() => setSelectedTask(task)}
                              />
                            </div>
                          )
                        })}
                        {(() => { rowIdx++; return null })()}
                      </div>
                    ))
                  })()}

                  {/* 의존성 화살표 SVG 오버레이 */}
                  {dependencies && dependencies.length > 0 && (
                    <GanttDependencyArrows
                      dependencies={dependencies}
                      groupedTasks={groupedTasks}
                      timelineStart={timelineStart}
                      totalDays={totalDays}
                      rowHeight={ROW_HEIGHT}
                      columnHeaderHeight={COLUMN_HEADER_ROW_HEIGHT}
                    />
                  )}
                </div>
              </div>
            </div>
            {/* 스크롤바 여백 — Radix ScrollBar(h-2.5)가 마지막 행을 가리지 않도록 */}
            <div className="h-3 shrink-0" aria-hidden="true" />
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </TooltipProvider>
      </div>

      {/* 태스크 상세 다이얼로그 */}
      <TaskDetailDialog
        projectId={projectId}
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => { if (!open) setSelectedTask(null) }}
        canEdit={canEdit}
        canDeleteAll={canDeleteAll}
      />
    </div>
  )
}
