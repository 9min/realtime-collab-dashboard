'use client'

import { useState } from 'react'
import { ChevronLeft, Download, Loader2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PRIORITY_LABELS, PRIORITY_BADGE_STYLES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useProjects } from '@/queries/use-projects'
import { useTaskTemplates, useImportTaskTemplate } from '@/queries/use-task-templates'
import { useAuth } from '@/hooks/use-auth'
import type { TaskTemplate } from '@/types/task-template'

interface TemplateImportDialogProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TemplateImportDialog({ projectId, open, onOpenChange }: TemplateImportDialogProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setSelectedProjectId(null)
    }
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {selectedProjectId ? (
          <TemplateSelectStep
            sourceProjectId={selectedProjectId}
            targetProjectId={projectId}
            onBack={() => setSelectedProjectId(null)}
          />
        ) : (
          <ProjectSelectStep currentProjectId={projectId} onSelect={setSelectedProjectId} />
        )}
      </DialogContent>
    </Dialog>
  )
}

interface ProjectSelectStepProps {
  currentProjectId: string
  onSelect: (projectId: string) => void
}

function ProjectSelectStep({ currentProjectId, onSelect }: ProjectSelectStepProps) {
  const { data: projects, isLoading } = useProjects()

  const importableProjects = projects?.filter(
    (p) =>
      p.id !== currentProjectId &&
      (p.current_user_role === 'admin' || p.current_user_role === 'owner'),
  )

  return (
    <>
      <DialogHeader>
        <DialogTitle>템플릿 가져오기</DialogTitle>
        <DialogDescription>템플릿을 가져올 프로젝트를 선택하세요</DialogDescription>
      </DialogHeader>
      <div className="max-h-64 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
          </div>
        ) : !importableProjects || importableProjects.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            가져올 수 있는 프로젝트가 없습니다
          </p>
        ) : (
          <div className="space-y-1">
            {importableProjects.map((project) => (
              <button
                key={project.id}
                type="button"
                className="hover:bg-accent w-full rounded-md px-3 py-2 text-left transition-colors"
                onClick={() => onSelect(project.id)}
              >
                <p className="text-sm font-medium">{project.name}</p>
                {project.description && (
                  <p className="text-muted-foreground truncate text-xs">{project.description}</p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

interface TemplateSelectStepProps {
  sourceProjectId: string
  targetProjectId: string
  onBack: () => void
}

function TemplateSelectStep({ sourceProjectId, targetProjectId, onBack }: TemplateSelectStepProps) {
  const { user } = useAuth()
  const { data: templates, isLoading } = useTaskTemplates(sourceProjectId)
  const importMutation = useImportTaskTemplate(targetProjectId)

  const handleImport = (template: TaskTemplate) => {
    if (!user) return

    importMutation.mutate({
      project_id: targetProjectId,
      created_by: user.id,
      name: template.name,
      description_template: template.description_template ?? undefined,
      priority: template.priority,
      subtasks_template: template.subtasks_template,
      labels_template: [],
      is_personal: false,
    })
  }

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onBack}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <DialogTitle>템플릿 선택</DialogTitle>
            <DialogDescription>가져올 템플릿을 선택하세요</DialogDescription>
          </div>
        </div>
      </DialogHeader>
      <div className="max-h-64 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
          </div>
        ) : !templates || templates.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            이 프로젝트에 템플릿이 없습니다
          </p>
        ) : (
          <div className="space-y-1">
            {templates.map((template) => (
              <div key={template.id} className="flex items-center gap-2 rounded-md px-3 py-2">
                <span className="flex-1 truncate text-sm font-medium">{template.name}</span>
                <Badge
                  variant="secondary"
                  className={cn('shrink-0 text-xs', PRIORITY_BADGE_STYLES[template.priority])}
                >
                  {PRIORITY_LABELS[template.priority]}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 shrink-0 gap-1"
                  disabled={importMutation.isPending}
                  onClick={() => handleImport(template)}
                >
                  {importMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Download className="h-3 w-3" />
                  )}
                  가져오기
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
