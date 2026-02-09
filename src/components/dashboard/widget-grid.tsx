'use client'

import { useCallback, useMemo, useRef } from 'react'
import {
  ResponsiveGridLayout,
  useContainerWidth,
  type Layout,
  type LayoutItem,
  type ResponsiveLayouts,
} from 'react-grid-layout'
import { Plus, Pencil, Check } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { DEFAULT_DASHBOARD_LAYOUT, GRID_ROW_HEIGHT, MEMBER_ROLE } from '@/lib/constants'
import { useDashboardLayout, useSaveDashboardLayout } from '@/queries/use-dashboard-layout'
import { useProjectMembers } from '@/queries/use-projects'
import { useDashboardStore } from '@/stores/dashboard-store'
import type { WidgetType } from '@/types/common'
import type { WidgetLayoutItem } from '@/types/dashboard'
import { WIDGET_REGISTRY } from '@/types/dashboard'

import { AddWidgetDialog } from './add-widget-dialog'
import { WidgetCard } from './widget-card'

const BREAKPOINTS = { lg: 1200, md: 768, sm: 0 }
const COLS = { lg: 12, md: 8, sm: 1 }

function widgetLayoutToRGL(widgets: WidgetLayoutItem[]): LayoutItem[] {
  return widgets.map((w) => {
    const config = WIDGET_REGISTRY.find((r) => r.type === w.type)
    return {
      i: w.widget_id,
      x: w.x,
      y: w.y,
      w: w.w,
      h: w.h,
      minW: config?.minSize.w ?? 2,
      minH: config?.minSize.h ?? 2,
    }
  })
}

function rglToWidgetLayout(
  rglLayout: Layout,
  widgets: WidgetLayoutItem[],
): WidgetLayoutItem[] {
  return rglLayout.map((item) => {
    const original = widgets.find((w) => w.widget_id === item.i)
    return {
      widget_id: item.i,
      type: original?.type ?? ('task-status' as WidgetType),
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
    }
  })
}

interface WidgetGridProps {
  projectId: string
}

export function WidgetGrid({ projectId }: WidgetGridProps) {
  const { user } = useAuth()
  const { data: savedLayout, isLoading } = useDashboardLayout(projectId)
  const { data: members } = useProjectMembers(projectId)
  const saveMutation = useSaveDashboardLayout(projectId)
  const { width, containerRef, mounted } = useContainerWidth()

  const { isEditMode, toggleEditMode, isAddWidgetOpen, setAddWidgetOpen } = useDashboardStore()

  const currentRole = members?.find((m) => m.user_id === user?.id)?.role
  const canEdit = currentRole !== MEMBER_ROLE.VIEWER

  const layout = useMemo<WidgetLayoutItem[]>(
    () => savedLayout ?? [...DEFAULT_DASHBOARD_LAYOUT],
    [savedLayout],
  )

  const rglLayout = useMemo(() => widgetLayoutToRGL(layout), [layout])

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const persistLayout = useCallback(
    (newLayout: WidgetLayoutItem[]) => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
      const DEBOUNCE_MS = 500
      saveTimerRef.current = setTimeout(() => {
        saveMutation.mutate(newLayout)
      }, DEBOUNCE_MS)
    },
    [saveMutation],
  )

  const handleLayoutChange = useCallback(
    (currentLayout: Layout, _allLayouts: ResponsiveLayouts) => {
      if (!isEditMode) return
      const updated = rglToWidgetLayout(currentLayout, layout)
      persistLayout(updated)
    },
    [isEditMode, layout, persistLayout],
  )

  const handleAddWidget = useCallback(
    (type: WidgetType) => {
      const config = WIDGET_REGISTRY.find((w) => w.type === type)
      if (!config) return

      const newWidget: WidgetLayoutItem = {
        widget_id: `${type}-${Date.now()}`,
        type,
        x: 0,
        y: Infinity,
        w: config.defaultSize.w,
        h: config.defaultSize.h,
      }

      persistLayout([...layout, newWidget])
    },
    [layout, persistLayout],
  )

  const handleRemoveWidget = useCallback(
    (widgetId: string) => {
      persistLayout(layout.filter((w) => w.widget_id !== widgetId))
    },
    [layout, persistLayout],
  )

  const existingTypes = useMemo<WidgetType[]>(
    () => layout.map((w) => w.type),
    [layout],
  )

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-muted h-64 animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-4">
      {canEdit && (
        <div className="flex items-center justify-end gap-2">
          {isEditMode && (
            <Button variant="outline" size="sm" onClick={() => setAddWidgetOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              위젯 추가
            </Button>
          )}
          <Button
            variant={isEditMode ? 'default' : 'outline'}
            size="sm"
            onClick={toggleEditMode}
          >
            {isEditMode ? (
              <>
                <Check className="mr-1 h-4 w-4" />
                완료
              </>
            ) : (
              <>
                <Pencil className="mr-1 h-4 w-4" />
                편집
              </>
            )}
          </Button>
        </div>
      )}

      {layout.length === 0 ? (
        <EmptyDashboard onAddWidget={() => setAddWidgetOpen(true)} />
      ) : mounted ? (
        <ResponsiveGridLayout
          width={width}
          layouts={{ lg: rglLayout }}
          breakpoints={BREAKPOINTS}
          cols={COLS}
          rowHeight={GRID_ROW_HEIGHT}
          dragConfig={{ enabled: isEditMode, handle: '.drag-handle' }}
          resizeConfig={{ enabled: isEditMode, handles: ['se'] }}
          onLayoutChange={handleLayoutChange}
          containerPadding={[0, 0]}
          margin={[16, 16]}
        >
          {layout.map((widget) => (
            <div key={widget.widget_id}>
              <WidgetCard
                widgetId={widget.widget_id}
                type={widget.type}
                projectId={projectId}
                isEditMode={isEditMode}
                onRemove={handleRemoveWidget}
              />
            </div>
          ))}
        </ResponsiveGridLayout>
      ) : null}

      <AddWidgetDialog
        open={isAddWidgetOpen}
        onOpenChange={setAddWidgetOpen}
        onAdd={handleAddWidget}
        existingTypes={existingTypes}
      />
    </div>
  )
}

function EmptyDashboard({ onAddWidget }: { onAddWidget: () => void }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8">
      <p className="text-muted-foreground text-sm">
        대시보드가 비어있습니다. 위젯을 추가해보세요.
      </p>
      <Button variant="outline" onClick={onAddWidget}>
        <Plus className="mr-1 h-4 w-4" />
        위젯 추가
      </Button>
    </div>
  )
}
