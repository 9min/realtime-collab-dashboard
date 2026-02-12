'use client'

import { Check } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useLabels, useAddTaskLabel, useRemoveTaskLabel } from '@/queries/use-labels'
import type { Tables } from '@/types/database'

interface LabelPickerProps {
  projectId: string
  taskId: string
  assignedLabelIds: string[]
  canEdit: boolean
}

export function LabelPicker({ projectId, taskId, assignedLabelIds, canEdit }: LabelPickerProps) {
  const { data: labels } = useLabels(projectId)
  const addMutation = useAddTaskLabel(projectId)
  const removeMutation = useRemoveTaskLabel(projectId)

  if (!canEdit || !labels || labels.length === 0) return null

  const handleToggle = (label: Tables<'labels'>) => {
    const isAssigned = assignedLabelIds.includes(label.id)
    if (isAssigned) {
      removeMutation.mutate({ taskId, labelId: label.id })
    } else {
      addMutation.mutate({ taskId, labelId: label.id })
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs">
          라벨 설정
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-52 p-1">
        {labels.map((label) => {
          const isAssigned = assignedLabelIds.includes(label.id)
          return (
            <button
              key={label.id}
              onClick={() => handleToggle(label)}
              className={cn(
                'flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                isAssigned && 'bg-accent/50',
              )}
            >
              <div
                className={cn(
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border',
                  isAssigned ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30',
                )}
              >
                {isAssigned && <Check className="h-3 w-3" />}
              </div>
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: label.color }}
              />
              <span className="truncate">{label.name}</span>
            </button>
          )
        })}
      </PopoverContent>
    </Popover>
  )
}
