'use client'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useColumns } from '@/queries/use-columns'
import { TRIGGER_TYPE } from '@/types/automation'
import { PRIORITY_LABELS, TASK_PRIORITY } from '@/lib/constants'

interface TriggerConfigFormProps {
  triggerType: string
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
  projectId: string
}

export function TriggerConfigForm({
  triggerType,
  config,
  onChange,
  projectId,
}: TriggerConfigFormProps) {
  const { data: columns, isLoading: columnsLoading } = useColumns(projectId)

  if (triggerType === TRIGGER_TYPE.TASK_MOVED_TO_COLUMN) {
    if (columnsLoading) return <Skeleton className="h-10" />

    return (
      <div className="space-y-1.5">
        <Label>대상 컬럼</Label>
        <Select
          value={(config.column_id as string) ?? ''}
          onValueChange={(value) => onChange({ ...config, column_id: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="컬럼 선택" />
          </SelectTrigger>
          <SelectContent>
            {columns?.map((col) => (
              <SelectItem key={col.id} value={col.id}>
                {col.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  if (triggerType === TRIGGER_TYPE.PRIORITY_CHANGED) {
    return (
      <div className="flex gap-3">
        <div className="flex-1 space-y-1.5">
          <Label>변경 전 (선택)</Label>
          <Select
            value={(config.from_priority as string) ?? ''}
            onValueChange={(value) => onChange({ ...config, from_priority: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(TASK_PRIORITY).map((p) => (
                <SelectItem key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 space-y-1.5">
          <Label>변경 후 (선택)</Label>
          <Select
            value={(config.to_priority as string) ?? ''}
            onValueChange={(value) => onChange({ ...config, to_priority: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(TASK_PRIORITY).map((p) => (
                <SelectItem key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    )
  }

  // task_created, assignee_changed → 추가 설정 불필요
  return null
}
