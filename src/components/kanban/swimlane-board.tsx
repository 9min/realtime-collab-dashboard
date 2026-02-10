'use client'

import { Droppable } from '@hello-pangea/dnd'

import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { Tables } from '@/types/database'
import type { Label } from '@/types/label'

import { TaskCard } from './task-card'

interface SwimlaneGroup {
  key: string
  label: string
  tasks: Tables<'tasks'>[]
}

interface SwimlaneBoardProps {
  groups: SwimlaneGroup[]
  columns: Tables<'kanban_columns'>[]
  onTaskClick: (task: Tables<'tasks'>) => void
  canMoveAll: boolean
  currentUserId?: string
  members?: (Tables<'project_members'> & { profiles: Tables<'profiles'> })[]
  labels?: Label[]
  taskLabelMap?: Map<string, string[]>
  blockedTaskIds?: Set<string>
}

export function SwimlaneBoard({
  groups,
  columns,
  onTaskClick,
  canMoveAll,
  currentUserId,
  members,
  labels,
  taskLabelMap,
  blockedTaskIds,
}: SwimlaneBoardProps) {
  return (
    <div className="space-y-4 overflow-x-auto pb-4">
      {groups.map((group) => (
        <div key={group.key} className="rounded-lg border">
          {/* 스윔레인 헤더 */}
          <div className="flex items-center gap-2 border-b bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 dark:from-blue-900/40 dark:to-indigo-900/40">
            <span className="text-sm font-semibold">{group.label}</span>
            <Badge variant="secondary" className="bg-blue-100 text-xs text-blue-700 dark:bg-blue-900/60 dark:text-blue-200">
              {group.tasks.length}
            </Badge>
          </div>

          {/* 컬럼 그리드 */}
          <div className="flex gap-0">
            {columns.map((column) => {
              const cellTasks = group.tasks
                .filter((t) => t.column_id === column.id)
                .sort((a, b) => a.position - b.position)
              const droppableId = `swimlane::${group.key}::${column.id}`

              return (
                <div key={column.id} className="w-60 shrink-0 border-r last:border-r-0">
                  {/* 컬럼 서브헤더 */}
                  <div className="border-b bg-slate-50/80 px-2 py-1 text-center text-xs font-medium text-muted-foreground dark:bg-slate-900/40">
                    {column.title}
                  </div>

                  {/* 드롭 영역 */}
                  <Droppable droppableId={droppableId}>
                    {(provided, snapshot) => (
                      <ScrollArea style={{ maxHeight: 300 }}>
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={cn(
                            'min-h-[80px] p-1.5 transition-colors',
                            snapshot.isDraggingOver && 'bg-primary/5',
                          )}
                        >
                          {cellTasks.map((task, index) => {
                            const taskLabelIds = taskLabelMap?.get(task.id)
                            const taskLabelsForCard = taskLabelIds && labels
                              ? labels.filter((l) => taskLabelIds.includes(l.id))
                              : undefined
                            return (
                              <TaskCard
                                key={task.id}
                                task={task}
                                index={index}
                                onClick={onTaskClick}
                                members={members}
                                isDragDisabled={!canMoveAll && task.assignee_id !== null && task.assignee_id !== currentUserId}
                                taskLabels={taskLabelsForCard}
                                isBlocked={blockedTaskIds?.has(task.id)}
                              />
                            )
                          })}
                          {provided.placeholder}
                        </div>
                      </ScrollArea>
                    )}
                  </Droppable>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
