'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { CalendarRange } from 'lucide-react'

import { EmptyState } from '@/components/ui/empty-state'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'

const TaskDetailDialog = dynamic(
  () => import('@/components/kanban/task-detail-dialog').then((mod) => ({ default: mod.TaskDetailDialog })),
)
import { useAuth } from '@/hooks/use-auth'
import { useMediaQuery } from '@/hooks/use-media-query'
import {
  startOfWeek,
  getWeekColumns,
  getMonthColumns,
  taskToBarPosition,
  daysBetween,
  addDays,
  startOfMonth,
} from '@/lib/gantt-utils'
import { MEMBER_ROLE } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useProjectMembers } from '@/queries/use-projects'
import { useTasks } from '@/queries/use-tasks'
import { useColumns } from '@/queries/use-columns'
import { useGanttStore } from '@/stores/gantt-store'
import type { Tables } from '@/types/database'

import { GanttBar } from './gantt-bar'
import { GanttHeader } from './gantt-header'

const WEEK_VIEW_WEEKS = 6
const MONTH_VIEW_MONTHS = 3
const COL_WIDTH_WEEK = 36
const COL_WIDTH_MONTH = 50
const ROW_HEIGHT = 36
const LABEL_WIDTH_DESKTOP = 200
const LABEL_WIDTH_MOBILE = 120

interface GanttChartProps {
  projectId: string
}

export function GanttChart({ projectId }: GanttChartProps) {
  const { user } = useAuth()
  const { data: tasks, isLoading: tasksLoading } = useTasks(projectId)
  const { data: columns } = useColumns(projectId)
  const { data: members } = useProjectMembers(projectId)
  const { viewMode, setViewMode } = useGanttStore()
  const [selectedTask, setSelectedTask] = useState<Tables<'tasks'> | null>(null)
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const labelWidth = isDesktop ? LABEL_WIDTH_DESKTOP : LABEL_WIDTH_MOBILE

  const currentRole = members?.find((m) => m.user_id === user?.id)?.role
  const isViewer = currentRole === MEMBER_ROLE.VIEWER
  const canEdit = !isViewer
  const canDeleteAll = currentRole === MEMBER_ROLE.OWNER || currentRole === MEMBER_ROLE.ADMIN

  const now = new Date()

  const { timelineColumns, timelineStart, totalDays, columnWidth } = useMemo(() => {
    if (viewMode === 'week') {
      const start = startOfWeek(addDays(now, -7))
      const cols = getWeekColumns(start, WEEK_VIEW_WEEKS)
      return {
        timelineColumns: cols,
        timelineStart: start,
        totalDays: WEEK_VIEW_WEEKS * 7,
        columnWidth: COL_WIDTH_WEEK,
      }
    }
    const start = startOfMonth(addDays(now, -14))
    const cols = getMonthColumns(start, MONTH_VIEW_MONTHS)
    const end = new Date(start)
    end.setMonth(end.getMonth() + MONTH_VIEW_MONTHS)
    return {
      timelineColumns: cols,
      timelineStart: start,
      totalDays: daysBetween(start, end),
      columnWidth: COL_WIDTH_MONTH,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode])

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

  const getMemberName = (assigneeId: string | null) => {
    if (!assigneeId || !members) return null
    const member = members.find((m) => m.user_id === assigneeId)
    return member?.profiles.full_name ?? member?.profiles.email ?? null
  }

  if (tasksLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="h-8 w-16 animate-pulse rounded bg-muted" />
          <div className="h-8 w-16 animate-pulse rounded bg-muted" />
        </div>
        <div className="overflow-hidden rounded-lg border">
          <div className="flex">
            <div className="w-[120px] shrink-0 border-r md:w-[200px]">
              <div className="h-8 border-b" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center border-b px-3" style={{ height: ROW_HEIGHT }}>
                  <div className="h-3 w-full animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
            <div className="flex-1">
              <div className="h-8 animate-pulse border-b bg-muted/30" />
              {[45, 60, 35, 55, 40].map((width, i) => (
                <div key={i} className="flex items-center px-4 border-b" style={{ height: ROW_HEIGHT }}>
                  <div
                    className="h-5 animate-pulse rounded-full bg-muted"
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

  return (
    <div className="space-y-4">
      {/* 뷰 모드 전환 */}
      <div role="tablist" aria-label="간트 차트 뷰 모드" className="inline-flex rounded-lg border bg-muted p-0.5">
        <button
          role="tab"
          aria-selected={viewMode === 'week'}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            viewMode === 'week'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
          onClick={() => setViewMode('week')}
        >
          주 단위
        </button>
        <button
          role="tab"
          aria-selected={viewMode === 'month'}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            viewMode === 'month'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
          onClick={() => setViewMode('month')}
        >
          월 단위
        </button>
      </div>

      {/* 간트 차트 */}
      <div className="border-border overflow-hidden rounded-lg border">
        <ScrollArea className="w-full">
          <div className="flex">
            {/* 왼쪽: 태스크 레이블 */}
            <div className="border-border shrink-0 border-r" style={{ width: labelWidth }}>
              {/* 헤더 스페이서 */}
              <div className="border-border h-8 border-b" />
              {groupedTasks.map((group) => (
                <div key={group.column.id}>
                  {/* 컬럼 헤더 */}
                  <div className="bg-muted/50 border-border border-b px-3 py-1 text-xs font-semibold">
                    {group.column.title}
                  </div>
                  {group.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="border-border flex items-center border-b px-3 text-xs"
                      style={{ height: ROW_HEIGHT }}
                    >
                      <span className="truncate">{task.title}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* 오른쪽: 타임라인 */}
            <div className="min-w-0 flex-1">
              <GanttHeader columns={timelineColumns} columnWidth={columnWidth} />
              <div
                className="relative"
                style={{ minWidth: timelineColumns.length * columnWidth }}
              >
                {/* 오늘 표시선 */}
                {todayOffset >= 0 && todayOffset <= 100 && (
                  <div
                    className="absolute top-0 bottom-0 z-10 w-0.5 bg-red-500"
                    style={{ left: `${todayOffset}%` }}
                  />
                )}

                {/* 태스크 바 */}
                {groupedTasks.map((group) => (
                  <div key={group.column.id}>
                    {/* 컬럼 헤더 스페이서 */}
                    <div className="border-border border-b" style={{ height: 24 }} />
                    {group.tasks.map((task) => (
                      <div
                        key={task.id}
                        className={cn('border-border relative border-b')}
                        style={{ height: ROW_HEIGHT }}
                      >
                        <GanttBar
                          title={task.title}
                          priority={task.priority}
                          assigneeName={getMemberName(task.assignee_id)}
                          position={taskToBarPosition(
                            new Date(task.created_at),
                            task.due_date ? new Date(task.due_date) : null,
                            timelineStart,
                            totalDays,
                          )}
                          onClick={() => setSelectedTask(task)}
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
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
