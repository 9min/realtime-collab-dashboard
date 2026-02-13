'use client'

import { Input } from '@/components/ui/input'
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
import { ACTION_TYPE } from '@/types/automation'
import { PRIORITY_LABELS, TASK_PRIORITY } from '@/lib/constants'

interface ActionConfigFormProps {
  actionType: string
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
  projectId: string
}

export function ActionConfigForm({
  actionType,
  config,
  onChange,
  projectId,
}: ActionConfigFormProps) {
  const { data: columns, isLoading: columnsLoading } = useColumns(projectId)

  if (actionType === ACTION_TYPE.SET_PRIORITY) {
    return (
      <div className="space-y-1.5">
        <Label>설정할 우선순위</Label>
        <Select
          value={(config.priority as string) ?? ''}
          onValueChange={(value) => onChange({ ...config, priority: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="우선순위 선택" />
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
    )
  }

  if (actionType === ACTION_TYPE.MOVE_TO_COLUMN) {
    if (columnsLoading) return <Skeleton className="h-10" />

    return (
      <div className="space-y-1.5">
        <Label>이동할 컬럼</Label>
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

  if (actionType === ACTION_TYPE.SEND_NOTIFICATION) {
    return (
      <div className="space-y-1.5">
        <Label htmlFor="notification-message">알림 메시지</Label>
        <Input
          id="notification-message"
          placeholder="예: 태스크가 완료되었습니다"
          value={(config.message as string) ?? ''}
          onChange={(e) => onChange({ ...config, message: e.target.value })}
        />
      </div>
    )
  }

  return null
}
