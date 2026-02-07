'use client'

import { useMemo, useState } from 'react'
import { CalendarRange } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { TaskDetailDialog } from '@/components/kanban/task-detail-dialog'
import { useAuth } from '@/hooks/use-auth'
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
const LABEL_WIDTH = 200

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
    return <div className="text-muted-foreground py-12 text-center">로딩 중...</div>
  }

  const allTasks = groupedTasks.flatMap((g) => g.tasks)
  if (allTasks.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center gap-2 py-12">
        <CalendarRange className="h-8 w-8" />
        <p className="text-sm">표시할 태스크가 없습니다</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 뷰 모드 전환 */}
      <div className="flex items-center gap-2">
        <Button
          variant={viewMode === 'week' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('week')}
        >
          주 단위
        </Button>
        <Button
          variant={viewMode === 'month' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('month')}
        >
          월 단위
        </Button>
      </div>

      {/* 간트 차트 */}
      <div className="border-border overflow-hidden rounded-lg border">
        <ScrollArea className="w-full">
          <div className="flex">
            {/* 왼쪽: 태스크 레이블 */}
            <div className="border-border shrink-0 border-r" style={{ width: LABEL_WIDTH }}>
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
