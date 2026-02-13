'use client'

import { useMemo, useCallback } from 'react'

import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import {
  useCustomFieldDefinitions,
  useTaskCustomFieldValues,
  useSetCustomFieldValue,
} from '@/queries/use-custom-fields'

import { CustomFieldRenderer } from './custom-field-renderer'

interface CustomFieldSectionProps {
  taskId: string
  projectId: string
  canEdit?: boolean
}

export function CustomFieldSection({
  taskId,
  projectId,
  canEdit = false,
}: CustomFieldSectionProps) {
  const { data: definitions, isLoading: defsLoading } = useCustomFieldDefinitions(projectId)
  const { data: allValues, isLoading: valsLoading } = useTaskCustomFieldValues(projectId)
  const setValueMutation = useSetCustomFieldValue(projectId)

  const valueMap = useMemo(() => {
    const map = new Map<string, string | null>()
    if (!allValues) return map
    for (const v of allValues) {
      if (v.task_id === taskId) {
        map.set(v.field_id, v.value)
      }
    }
    return map
  }, [allValues, taskId])

  const handleChange = useCallback(
    (fieldId: string, value: string | null) => {
      setValueMutation.mutate({ taskId, fieldId, value })
    },
    [setValueMutation, taskId],
  )

  if (defsLoading || valsLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    )
  }

  if (!definitions || definitions.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <h4 className="text-muted-foreground text-sm font-medium">커스텀 필드</h4>
      {definitions.map((field) => (
        <div key={field.id} className="flex items-center gap-3">
          <Label className="min-w-[100px] shrink-0 text-sm">
            {field.name}
            {field.is_required && <span className="text-destructive ml-0.5">*</span>}
          </Label>
          <div className="flex-1">
            <CustomFieldRenderer
              field={field}
              value={valueMap.get(field.id) ?? null}
              onChange={(value) => handleChange(field.id, value)}
              disabled={!canEdit}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
