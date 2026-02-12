'use client'

import dynamic from 'next/dynamic'
import { X, GripVertical } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { WIDGET_TYPE } from '@/lib/constants'
import { useProjectMembers } from '@/queries/use-projects'
import type { WidgetType } from '@/types/common'
import { WIDGET_REGISTRY } from '@/types/dashboard'

const TaskStatusChart = dynamic(
  () => import('../charts/task-status-chart').then((mod) => ({ default: mod.TaskStatusChart })),
  { loading: () => <WidgetSkeleton /> },
)

const WeeklyProgressChart = dynamic(
  () => import('../charts/weekly-progress-chart').then((mod) => ({ default: mod.WeeklyProgressChart })),
  { loading: () => <WidgetSkeleton /> },
)

const BurndownChart = dynamic(
  () => import('../charts/burndown-chart').then((mod) => ({ default: mod.BurndownChart })),
  { loading: () => <WidgetSkeleton /> },
)

const MemberListWidget = dynamic(
  () => import('./member-list-widget').then((mod) => ({ default: mod.MemberListWidget })),
  { loading: () => <WidgetSkeleton /> },
)

const FavoritesWidget = dynamic(
  () => import('./favorites-widget').then((mod) => ({ default: mod.FavoritesWidget })),
  { loading: () => <WidgetSkeleton /> },
)

const WIDGET_ACCENT: Record<string, string> = {
  [WIDGET_TYPE.TASK_STATUS]: 'border-t-blue-500',
  [WIDGET_TYPE.WEEKLY_PROGRESS]: 'border-t-emerald-500',
  [WIDGET_TYPE.BURNDOWN]: 'border-t-orange-500',
  [WIDGET_TYPE.MEMBER_LIST]: 'border-t-violet-500',
  [WIDGET_TYPE.MY_FAVORITES]: 'border-t-amber-500',
}

interface WidgetCardProps {
  widgetId: string
  type: WidgetType
  projectId: string
  isEditMode: boolean
  onRemove: (widgetId: string) => void
}

export function WidgetCard({
  widgetId,
  type,
  projectId,
  isEditMode,
  onRemove,
}: WidgetCardProps) {
  const config = WIDGET_REGISTRY.find((w) => w.type === type)
  const title = config?.title ?? '위젯'

  return (
    <Card className={cn('flex h-full flex-col border-t-2 shadow-sm', WIDGET_ACCENT[type])}>
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
        {isEditMode && (
          <div className="drag-handle cursor-grab active:cursor-grabbing p-1">
            <GripVertical className="text-muted-foreground h-4 w-4" />
          </div>
        )}
        <CardTitle className="flex-1 text-sm font-medium">
          <WidgetTitleText type={type} title={title} projectId={projectId} />
        </CardTitle>
        {isEditMode && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onRemove(widgetId)}
            aria-label="위젯 제거"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-hidden p-4 pt-0">
        <WidgetContent type={type} projectId={projectId} />
      </CardContent>
    </Card>
  )
}

// 위젯 타입에 따라 적절한 컴포넌트 렌더링
function WidgetContent({ type, projectId }: { type: WidgetType; projectId: string }) {
  switch (type) {
    case WIDGET_TYPE.TASK_STATUS:
      return <TaskStatusChart projectId={projectId} />
    case WIDGET_TYPE.WEEKLY_PROGRESS:
      return <WeeklyProgressChart projectId={projectId} />
    case WIDGET_TYPE.BURNDOWN:
      return <BurndownChart projectId={projectId} />
    case WIDGET_TYPE.MEMBER_LIST:
      return <MemberListWidget projectId={projectId} />
    case WIDGET_TYPE.MY_FAVORITES:
      return <FavoritesWidget />
    default:
      return (
        <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
          알 수 없는 위젯
        </div>
      )
  }
}

function WidgetTitleText({ type, title, projectId }: { type: WidgetType; title: string; projectId: string }) {
  if (type === WIDGET_TYPE.MEMBER_LIST) {
    return <MemberCountTitle title={title} projectId={projectId} />
  }
  return <>{title}</>
}

function MemberCountTitle({ title, projectId }: { title: string; projectId: string }) {
  const { data: members } = useProjectMembers(projectId)
  const count = members?.length ?? 0
  return (
    <>
      {title}
      {count > 0 && (
        <span className="text-muted-foreground ml-1 font-normal">({count})</span>
      )}
    </>
  )
}

function WidgetSkeleton() {
  return (
    <div className="flex h-full min-h-[200px] flex-col gap-3 p-4">
      <div className="flex items-end gap-2">
        <div className="h-20 flex-1 animate-pulse rounded bg-muted" />
        <div className="h-14 flex-1 animate-pulse rounded bg-muted" />
        <div className="h-24 flex-1 animate-pulse rounded bg-muted" />
        <div className="h-16 flex-1 animate-pulse rounded bg-muted" />
      </div>
      <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
    </div>
  )
}
