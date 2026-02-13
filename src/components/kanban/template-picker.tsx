'use client'

import { FileText } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { PRIORITY_LABELS, PRIORITY_BADGE_STYLES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useTaskTemplates } from '@/queries/use-task-templates'
import type { TaskTemplate } from '@/types/task-template'

interface TemplatePickerProps {
  projectId: string
  onSelect: (template: TaskTemplate) => void
}

export function TemplatePicker({ projectId, onSelect }: TemplatePickerProps) {
  const { data: templates, isLoading } = useTaskTemplates(projectId)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <FileText className="h-4 w-4" />
          템플릿에서 생성
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        {isLoading ? (
          <div className="space-y-2 p-2">
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
          </div>
        ) : !templates || templates.length === 0 ? (
          <p className="text-muted-foreground p-3 text-center text-sm">
            사용 가능한 템플릿이 없습니다
          </p>
        ) : (
          <div className="space-y-1">
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                className="hover:bg-accent flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors"
                onClick={() => onSelect(template)}
              >
                <span className="truncate font-medium">{template.name}</span>
                <Badge
                  variant="secondary"
                  className={cn('ml-2 shrink-0 text-xs', PRIORITY_BADGE_STYLES[template.priority])}
                >
                  {PRIORITY_LABELS[template.priority]}
                </Badge>
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
