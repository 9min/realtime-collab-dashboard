'use client'

import { useCallback, useMemo, useRef } from 'react'
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import { Plus, Pencil, Check } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { DEFAULT_DASHBOARD_LAYOUT } from '@/lib/constants'
import { useDashboardLayout, useSaveDashboardLayout } from '@/queries/use-dashboard-layout'
import { useDashboardStore } from '@/stores/dashboard-store'
import type { WidgetType } from '@/types/common'
import type { WidgetLayoutItem } from '@/types/dashboard'
import { WIDGET_REGISTRY } from '@/types/dashboard'

import { AddWidgetDialog } from './add-widget-dialog'
import { WidgetCard } from './widget-card'

interface WidgetGridProps {
  projectId: string
}

export function WidgetGrid({ projectId }: WidgetGridProps) {
  const { data: savedLayout, isLoading } = useDashboardLayout(projectId)
  const saveMutation = useSaveDashboardLayout(projectId)

  const { isEditMode, toggleEditMode, isAddWidgetOpen, setAddWidgetOpen } = useDashboardStore()

  // 현재 레이아웃: 저장된 값 또는 기본값
  const layout = useMemo<WidgetLayoutItem[]>(
    () => savedLayout ?? [...DEFAULT_DASHBOARD_LAYOUT],
    [savedLayout],
  )

  // 저장 debounce를 위한 타이머 ref
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 레이아웃 변경 + 자동 저장
  const persistLayout = useCallback(
    (newLayout: WidgetLayoutItem[]) => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
      // 500ms debounce로 저장
      const DEBOUNCE_MS = 500
      saveTimerRef.current = setTimeout(() => {
        saveMutation.mutate(newLayout)
      }, DEBOUNCE_MS)
    },
    [saveMutation],
  )

  // 위젯 리오더링
  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return
      const sourceIdx = result.source.index
      const destIdx = result.destination.index
      if (sourceIdx === destIdx) return

      const reordered = [...layout]
      const [removed] = reordered.splice(sourceIdx, 1)
      reordered.splice(destIdx, 0, removed)

      persistLayout(reordered)
    },
    [layout, persistLayout],
  )

  // 위젯 추가
  const handleAddWidget = useCallback(
    (type: WidgetType) => {
      const config = WIDGET_REGISTRY.find((w) => w.type === type)
      if (!config) return

      const newWidget: WidgetLayoutItem = {
        widget_id: `${type}-${Date.now()}`,
        type,
        x: 0,
        y: 0,
        w: config.defaultSize.w,
        h: config.defaultSize.h,
      }

      persistLayout([...layout, newWidget])
    },
    [layout, persistLayout],
  )

  // 위젯 제거
  const handleRemoveWidget = useCallback(
    (widgetId: string) => {
      persistLayout(layout.filter((w) => w.widget_id !== widgetId))
    },
    [layout, persistLayout],
  )

  // 현재 레이아웃에 있는 위젯 타입 목록
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
    <div className="flex flex-col gap-4">
      {/* 툴바 */}
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

      {/* 위젯 그리드 */}
      {layout.length === 0 ? (
        <EmptyDashboard onAddWidget={() => setAddWidgetOpen(true)} />
      ) : isEditMode ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="widget-grid" direction="horizontal">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
              >
                {layout.map((widget, index) => (
                  <Draggable key={widget.widget_id} draggableId={widget.widget_id} index={index}>
                    {(dragProvided) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        className="min-h-64"
                      >
                        <WidgetCard
                          widgetId={widget.widget_id}
                          type={widget.type}
                          projectId={projectId}
                          isEditMode={isEditMode}
                          onRemove={handleRemoveWidget}
                          dragHandleProps={dragProvided.dragHandleProps}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {layout.map((widget) => (
            <div key={widget.widget_id} className="min-h-64">
              <WidgetCard
                widgetId={widget.widget_id}
                type={widget.type}
                projectId={projectId}
                isEditMode={false}
                onRemove={handleRemoveWidget}
              />
            </div>
          ))}
        </div>
      )}

      {/* 위젯 추가 다이얼로그 */}
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
