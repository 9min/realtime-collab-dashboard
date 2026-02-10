'use client'

import { memo, useMemo } from 'react'

import { taskToBarPosition } from '@/lib/gantt-utils'
import type { Tables } from '@/types/database'
import type { TaskDependency } from '@/types/dependency'

interface TaskGroup {
  column: Tables<'kanban_columns'>
  tasks: Tables<'tasks'>[]
}

interface GanttDependencyArrowsProps {
  dependencies: TaskDependency[]
  groupedTasks: TaskGroup[]
  timelineStart: Date
  totalDays: number
  rowHeight: number
  columnHeaderHeight: number
}

export const GanttDependencyArrows = memo(function GanttDependencyArrows({
  dependencies,
  groupedTasks,
  timelineStart,
  totalDays,
  rowHeight,
  columnHeaderHeight,
}: GanttDependencyArrowsProps) {
  // 태스크 ID → row 인덱스 맵 + 바 위치 맵
  const taskPositions = useMemo(() => {
    const posMap = new Map<string, { rowIndex: number; barLeft: number; barRight: number }>()
    let rowIndex = 0

    for (const group of groupedTasks) {
      rowIndex++ // 컬럼 헤더 행
      for (const task of group.tasks) {
        const pos = taskToBarPosition(
          new Date(task.created_at),
          task.due_date ? new Date(task.due_date) : null,
          timelineStart,
          totalDays,
        )
        posMap.set(task.id, {
          rowIndex,
          barLeft: pos.left,
          barRight: pos.left + pos.width,
        })
        rowIndex++
      }
    }

    return posMap
  }, [groupedTasks, timelineStart, totalDays])

  // 화살표 경로 계산
  const arrows = useMemo(() => {
    const result: Array<{
      id: string
      x1: number // % 기준
      y1: number // px 기준
      x2: number
      y2: number
    }> = []

    for (const dep of dependencies) {
      const from = taskPositions.get(dep.blocking_task_id)
      const to = taskPositions.get(dep.blocked_task_id)
      if (!from || !to) continue

      const fromY = computeY(from.rowIndex, groupedTasks, rowHeight, columnHeaderHeight)
      const toY = computeY(to.rowIndex, groupedTasks, rowHeight, columnHeaderHeight)

      result.push({
        id: dep.id,
        x1: from.barRight,
        y1: fromY,
        x2: to.barLeft,
        y2: toY,
      })
    }

    return result
  }, [dependencies, taskPositions, rowHeight, columnHeaderHeight, groupedTasks])

  if (arrows.length === 0) return null

  // 전체 높이 계산
  const totalRows = groupedTasks.reduce((sum, g) => sum + 1 + g.tasks.length, 0)
  const totalHeight = totalRows * rowHeight + groupedTasks.length * columnHeaderHeight

  return (
    <svg
      className="pointer-events-none absolute inset-0"
      style={{ width: '100%', height: totalHeight }}
      preserveAspectRatio="none"
    >
      <defs>
        <marker
          id="gantt-arrowhead"
          markerWidth="8"
          markerHeight="6"
          refX="8"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 8 3, 0 6" className="fill-blue-400/60 dark:fill-blue-300/50" />
        </marker>
      </defs>
      {arrows.map((arrow) => {
        const dx = arrow.x2 - arrow.x1
        const cpOffset = Math.max(Math.abs(dx) * 0.4, 2)
        const path = `M ${arrow.x1}% ${arrow.y1} C ${arrow.x1 + cpOffset}% ${arrow.y1}, ${arrow.x2 - cpOffset}% ${arrow.y2}, ${arrow.x2}% ${arrow.y2}`
        return (
          <path
            key={arrow.id}
            d={path}
            className="stroke-blue-400/60 dark:stroke-blue-300/50"
            strokeWidth={1.5}
            fill="none"
            markerEnd="url(#gantt-arrowhead)"
          />
        )
      })}
    </svg>
  )
})

// 그룹 구조를 고려하여 실제 Y 좌표(px) 계산
function computeY(
  rowIndex: number,
  groupedTasks: TaskGroup[],
  rowHeight: number,
  columnHeaderHeight: number,
): number {
  let y = 0
  let currentRow = 0

  for (const group of groupedTasks) {
    // 컬럼 헤더 행
    if (currentRow === rowIndex) return y + columnHeaderHeight / 2
    y += columnHeaderHeight
    currentRow++

    // 태스크 행들
    for (let i = 0; i < group.tasks.length; i++) {
      if (currentRow === rowIndex) return y + rowHeight / 2
      y += rowHeight
      currentRow++
    }
  }

  return y
}
