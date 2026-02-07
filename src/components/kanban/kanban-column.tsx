'use client'

import { Droppable } from '@hello-pangea/dnd'
import { MoreHorizontal, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { Tables } from '@/types/database'

import { TaskCard } from './task-card'

interface KanbanColumnProps {
  column: Tables<'kanban_columns'>
  tasks: Tables<'tasks'>[]
  onAddTask: (columnId: string) => void
  onTaskClick: (task: Tables<'tasks'>) => void
  onDeleteColumn: (columnId: string) => void
  canEdit: boolean
  members?: (Tables<'project_members'> & { profiles: Tables<'profiles'> })[]
}

export function KanbanColumn({
  column,
  tasks,
  onAddTask,
  onTaskClick,
  onDeleteColumn,
  canEdit,
  members,
}: KanbanColumnProps) {
  return (
    <div className="bg-muted/50 flex h-full w-72 shrink-0 flex-col rounded-lg border">
      {/* 컬럼 헤더 */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">{column.title}</h3>
          <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium">
            {tasks.length}
          </span>
        </div>
        {canEdit && (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAddTask(column.id)}>
              <Plus className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDeleteColumn(column.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  컬럼 삭제
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* 태스크 목록 (드롭 영역) */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <ScrollArea className="flex-1">
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={cn(
                'min-h-[100px] p-2 transition-colors',
                snapshot.isDraggingOver && 'bg-primary/5',
              )}
            >
              {tasks.map((task, index) => (
                <TaskCard key={task.id} task={task} index={index} onClick={onTaskClick} members={members} />
              ))}
              {provided.placeholder}
            </div>
          </ScrollArea>
        )}
      </Droppable>
    </div>
  )
}
