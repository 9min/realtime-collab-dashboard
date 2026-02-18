'use client'

import { useState } from 'react'
import { Download, Pencil, Plus, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PRIORITY_LABELS, PRIORITY_BADGE_STYLES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useTaskTemplates, useDeleteTaskTemplate } from '@/queries/use-task-templates'
import { TemplateForm } from '@/components/project/template-form'
import { TemplateImportDialog } from '@/components/project/template-import-dialog'
import type { TaskTemplate } from '@/types/task-template'

interface TemplateManagerProps {
  projectId: string
}

export function TemplateManager({ projectId }: TemplateManagerProps) {
  const { data: templates, isLoading } = useTaskTemplates(projectId)
  const deleteMutation = useDeleteTaskTemplate(projectId)

  const [showCreate, setShowCreate] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null)

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
        <div className="space-y-2">
          {templates.map((template) => (
            <div key={template.id} className="flex items-center gap-2">
              <span className="flex-1 truncate text-sm font-medium">{template.name}</span>
              <Badge
                variant="secondary"
                className={cn('shrink-0 text-xs', PRIORITY_BADGE_STYLES[template.priority])}
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
          ))}
        </div>
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
