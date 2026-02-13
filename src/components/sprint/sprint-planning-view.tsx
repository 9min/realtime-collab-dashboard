'use client'

import { useCallback, useMemo } from 'react'
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import { GripVertical, Inbox, Zap } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useUpdateTask, useTasks } from '@/queries/use-tasks'
import { PRIORITY_LABELS, PRIORITY_BADGE_STYLES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { UpdateTables } from '@/types/database'
import type { Task } from '@/types/kanban'
import type { TaskPriority } from '@/types/common'

type TaskWithSprint = Task & { sprint_id?: string | null }

const BACKLOG_DROPPABLE = 'backlog'
const SPRINT_DROPPABLE = 'sprint'

interface SprintPlanningViewProps {
  projectId: string
  sprintId: string
}

export function SprintPlanningView({ projectId, sprintId }: SprintPlanningViewProps) {
  const { data: tasks } = useTasks(projectId)
  const updateTaskMutation = useUpdateTask(projectId)

  const allTasks = tasks as TaskWithSprint[] | undefined

  const backlogTasks = useMemo(() => (allTasks ?? []).filter((t) => !t.sprint_id), [allTasks])

  const sprintTasks = useMemo(
    () => (allTasks ?? []).filter((t) => t.sprint_id === sprintId),
    [allTasks, sprintId],
  )

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      const { source, destination, draggableId } = result
      if (!destination) return
      if (source.droppableId === destination.droppableId) return

      const newSprintId = destination.droppableId === SPRINT_DROPPABLE ? sprintId : null

      updateTaskMutation.mutate({
        taskId: draggableId,
        input: { sprint_id: newSprintId } as unknown as UpdateTables<'tasks'>,
      })
    },
    [sprintId, updateTaskMutation],
  )

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TaskPanel
          title="백로그"
          icon={Inbox}
          droppableId={BACKLOG_DROPPABLE}
          tasks={backlogTasks}
        />
        <TaskPanel title="스프린트" icon={Zap} droppableId={SPRINT_DROPPABLE} tasks={sprintTasks} />
      </div>
    </DragDropContext>
  )
}

interface TaskPanelProps {
  title: string
  icon: React.ComponentType<{ className?: string }>
  droppableId: string
  tasks: TaskWithSprint[]
}

function TaskPanel({ title, icon: Icon, droppableId, tasks }: TaskPanelProps) {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Icon className="text-muted-foreground h-4 w-4" />
            {title}
          </CardTitle>
          <Badge variant="secondary" className="tabular-nums">
            {tasks.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Droppable droppableId={droppableId}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={cn(
                'min-h-[200px] space-y-1.5 p-3 transition-colors',
                snapshot.isDraggingOver && 'bg-accent/50',
              )}
            >
              {tasks.map((task, index) => (
                <Draggable key={task.id} draggableId={task.id} index={index}>
                  {(dragProvided, dragSnapshot) => (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      {...dragProvided.dragHandleProps}
                      className={cn(
                        'bg-card flex cursor-grab items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-shadow active:cursor-grabbing',
                        dragSnapshot.isDragging && 'ring-primary/20 shadow-lg ring-2',
                      )}
                    >
                      <GripVertical className="text-muted-foreground h-4 w-4 shrink-0" />
                      <span className="min-w-0 flex-1 truncate font-medium">{task.title}</span>
                      {task.priority && (
                        <Badge
                          className={cn(
                            'shrink-0 border-0 text-xs',
                            PRIORITY_BADGE_STYLES[task.priority as TaskPriority],
                          )}
                        >
                          {PRIORITY_LABELS[task.priority as TaskPriority]}
                        </Badge>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              {tasks.length === 0 && (
                <div className="text-muted-foreground flex h-20 flex-col items-center justify-center gap-1 text-sm">
                  <span>태스크를 여기로 드래그하세요</span>
                </div>
              )}
            </div>
          )}
        </Droppable>
      </CardContent>
    </Card>
  )
}
