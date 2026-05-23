'use client'

import { useState } from 'react'
import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd'
import { Download, GripVertical, Pencil, Plus, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PRIORITY_LABELS, PRIORITY_BADGE_STYLES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import {
  useTaskTemplates,
  useDeleteTaskTemplate,
  useReorderTaskTemplates,
} from '@/queries/use-task-templates'
import { TemplateForm } from '@/components/project/template-form'
import { TemplateImportDialog } from '@/components/project/template-import-dialog'
import type { TaskTemplate } from '@/types/task-template'

interface TemplateManagerProps {
  projectId: string
}

export function TemplateManager({ projectId }: TemplateManagerProps) {
  const { data: templates, isLoading } = useTaskTemplates(projectId)
  const deleteMutation = useDeleteTaskTemplate(projectId)
  const reorderMutation = useReorderTaskTemplates(projectId)

  const [showCreate, setShowCreate] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null)

  const handleDragEnd = (result: DropResult) => {
    if (!templates) return
    const { source, destination } = result
    if (!destination || source.index === destination.index) return

    const reordered = Array.from(templates)
    const [moved] = reordered.splice(source.index, 1)
    reordered.splice(destination.index, 0, moved)

    reorderMutation.mutate(reordered.map((t) => t.id))
  }

  if (isLoading) {
    return <Skeleton className="h-20" />
  }

  if (editingTemplate) {
    return (
      <TemplateForm
        projectId={projectId}
        template={editingTemplate}
        onSuccess={() => setEditingTemplate(null)}
        onCancel={() => setEditingTemplate(null)}
      />
    )
  }

  if (showCreate) {
    return (
      <TemplateForm
        projectId={projectId}
        onSuccess={() => setShowCreate(false)}
        onCancel={() => setShowCreate(false)}
      />
    )
  }

  return (
    <div className="space-y-3">
      {/* 템플릿 목록 */}
      {templates && templates.length > 0 && (
        <DragDropContext onDragEnd={handleDragEnd} autoScrollerOptions={{ disabled: true }}>
          <Droppable droppableId="template-list">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                {templates.map((template, index) => (
                  <Draggable key={template.id} draggableId={template.id} index={index}>
                    {(dragProvided, snapshot) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        className={cn(
                          'flex items-center gap-2 rounded-md',
                          snapshot.isDragging && 'bg-background ring-primary/20 shadow-lg ring-2',
                        )}
                      >
                        <button
                          type="button"
                          {...dragProvided.dragHandleProps}
                          className="text-muted-foreground hover:text-foreground shrink-0 cursor-grab touch-none"
                          aria-label="템플릿 순서 변경"
                        >
                          <GripVertical className="h-4 w-4" />
                        </button>
                        <span className="flex-1 truncate text-sm font-medium">{template.name}</span>
                        <Badge
                          variant="secondary"
                          className={cn(
                            'shrink-0 text-xs',
                            PRIORITY_BADGE_STYLES[template.priority],
                          )}
                        >
                          {PRIORITY_LABELS[template.priority]}
                        </Badge>
                        {template.is_personal && (
                          <Badge variant="outline" className="shrink-0 text-xs">
                            개인
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setEditingTemplate(template)}
                          aria-label="템플릿 편집"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive h-8 w-8"
                          onClick={() => deleteMutation.mutate(template.id)}
                          disabled={deleteMutation.isPending}
                          aria-label="템플릿 삭제"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* 추가 / 가져오기 버튼 */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1"
          onClick={() => setShowCreate(true)}
        >
          <Plus className="h-3 w-3" />
          템플릿 추가
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1"
          onClick={() => setShowImport(true)}
        >
          <Download className="h-3 w-3" />
          가져오기
        </Button>
      </div>

      <TemplateImportDialog projectId={projectId} open={showImport} onOpenChange={setShowImport} />
    </div>
  )
}
