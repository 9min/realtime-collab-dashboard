'use client'

import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAutomationExecutions } from '@/queries/use-automations'

interface ExecutionLogProps {
  ruleId: string
}

export function ExecutionLog({ ruleId }: ExecutionLogProps) {
  const { data: executions, isLoading } = useAutomationExecutions(ruleId)

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
    )
  }

  if (!executions || executions.length === 0) {
    return <p className="text-muted-foreground text-sm">실행 기록이 없습니다.</p>
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">실행 기록</h4>
      <div className="max-h-60 space-y-1.5 overflow-y-auto">
        {executions.map((exec) => (
          <div key={exec.id} className="flex items-start gap-2 rounded-md border p-2 text-xs">
            <Badge
              variant={exec.status === 'success' ? 'default' : 'destructive'}
              className="shrink-0 text-xs"
            >
              {exec.status === 'success' ? '성공' : '오류'}
            </Badge>
            <div className="flex-1 space-y-0.5">
              <p className="text-muted-foreground">
                {new Date(exec.executed_at).toLocaleString('ko-KR')}
              </p>
              {exec.error_message && <p className="text-destructive">{exec.error_message}</p>}
              {exec.trigger_entity_id && (
                <p className="text-muted-foreground">
                  대상: {exec.trigger_entity_id.slice(0, 8)}...
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
