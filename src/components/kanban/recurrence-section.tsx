'use client'

import { useState } from 'react'
import { Repeat, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/hooks/use-auth'
import { useRecurrence, useCreateRecurrence, useUpdateRecurrence, useDeleteRecurrence } from '@/queries/use-recurrences'
import { RECURRENCE_FREQUENCY, FREQUENCY_LABELS, DAY_OF_WEEK_LABELS } from '@/types/recurrence'
import type { RecurrenceFrequency } from '@/types/recurrence'

interface RecurrenceSectionProps {
  taskId: string
  projectId: string
  canEdit: boolean
}

export function RecurrenceSection({ taskId, projectId, canEdit }: RecurrenceSectionProps) {
  const { user } = useAuth()
  const { data: recurrence, isLoading } = useRecurrence(taskId)
  const createMutation = useCreateRecurrence()
  const updateMutation = useUpdateRecurrence(taskId, projectId)
  const deleteMutation = useDeleteRecurrence(taskId, projectId)

  const [isAdding, setIsAdding] = useState(false)
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(RECURRENCE_FREQUENCY.WEEKLY)
  const [intervalValue, setIntervalValue] = useState(1)
  const [dayOfWeek, setDayOfWeek] = useState<number>(1) // Monday
  const [dayOfMonth, setDayOfMonth] = useState<number>(1)
  const [nextDueDate, setNextDueDate] = useState('')

  if (isLoading) {
    return (
      <div className="space-y-2">
        <span className="text-muted-foreground text-sm font-medium">반복 설정</span>
        <div className="h-8 animate-pulse rounded bg-muted" />
      </div>
    )
  }

  const handleCreate = () => {
    if (!user || !nextDueDate) return
    createMutation.mutate(
      {
        task_id: taskId,
        project_id: projectId,
        frequency,
        interval_value: intervalValue,
        day_of_week: frequency === RECURRENCE_FREQUENCY.WEEKLY ? dayOfWeek : null,
        day_of_month: frequency === RECURRENCE_FREQUENCY.MONTHLY ? dayOfMonth : null,
        next_due_date: nextDueDate,
        created_by: user.id,
      },
      { onSuccess: () => setIsAdding(false) },
    )
  }

  const handleToggleActive = () => {
    if (!recurrence) return
    updateMutation.mutate({
      recurrenceId: recurrence.id,
      input: { is_active: !recurrence.is_active },
    })
  }

  const handleDelete = () => {
    if (!recurrence) return
    deleteMutation.mutate(recurrence.id)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Repeat className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">반복 설정</span>
      </div>

      {recurrence ? (
        <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">
              {FREQUENCY_LABELS[recurrence.frequency]}
              {recurrence.interval_value > 1 && ` (${recurrence.interval_value}회 간격)`}
              {recurrence.frequency === RECURRENCE_FREQUENCY.WEEKLY && recurrence.day_of_week !== null && (
                <> · {DAY_OF_WEEK_LABELS[recurrence.day_of_week]}요일</>
              )}
              {recurrence.frequency === RECURRENCE_FREQUENCY.MONTHLY && recurrence.day_of_month !== null && (
                <> · {recurrence.day_of_month}일</>
              )}
            </span>
            {canEdit && (
              <div className="flex items-center gap-2">
                <Switch
                  checked={recurrence.is_active}
                  onCheckedChange={handleToggleActive}
                  aria-label="반복 활성화 토글"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={handleDelete}
                  aria-label="반복 삭제"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            다음 마감: {new Date(recurrence.next_due_date).toLocaleDateString('ko-KR')}
            {!recurrence.is_active && ' (비활성)'}
          </p>
        </div>
      ) : canEdit ? (
        isAdding ? (
          <div className="space-y-3 rounded-lg border p-3">
            <div className="flex gap-2">
              <Select value={frequency} onValueChange={(v) => setFrequency(v as RecurrenceFrequency)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FREQUENCY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                min={1}
                max={365}
                value={intervalValue}
                onChange={(e) => setIntervalValue(Number(e.target.value))}
                className="w-20"
                aria-label="반복 간격"
              />
            </div>

            {frequency === RECURRENCE_FREQUENCY.WEEKLY && (
              <Select value={String(dayOfWeek)} onValueChange={(v) => setDayOfWeek(Number(v))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAY_OF_WEEK_LABELS.map((label, i) => (
                    <SelectItem key={i} value={String(i)}>{label}요일</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {frequency === RECURRENCE_FREQUENCY.MONTHLY && (
              <Input
                type="number"
                min={1}
                max={31}
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(Number(e.target.value))}
                className="w-20"
                aria-label="반복 날짜"
                placeholder="일"
              />
            )}

            <div>
              <label className="mb-1 block text-xs text-muted-foreground">다음 마감일</label>
              <Input
                type="date"
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                className="w-40"
              />
            </div>

            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate} disabled={!nextDueDate || createMutation.isPending}>
                저장
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsAdding(false)}>
                취소
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setIsAdding(true)}
          >
            <Repeat className="mr-1 h-3.5 w-3.5" />
            반복 추가
          </Button>
        )
      ) : (
        <p className="text-xs text-muted-foreground">반복 설정 없음</p>
      )}
    </div>
  )
}
