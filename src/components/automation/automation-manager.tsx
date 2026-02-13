'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, History } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  useAutomationRules,
  useDeleteAutomationRule,
  useToggleAutomationRule,
} from '@/queries/use-automations'
import { TRIGGER_LABELS, ACTION_LABELS } from '@/types/automation'
import type { AutomationRule } from '@/types/automation'
import { AutomationRuleForm } from '@/components/automation/automation-rule-form'
import { ExecutionLog } from '@/components/automation/execution-log'

interface AutomationManagerProps {
  projectId: string
}

export function AutomationManager({ projectId }: AutomationManagerProps) {
  const { data: rules, isLoading } = useAutomationRules(projectId)
  const deleteMutation = useDeleteAutomationRule(projectId)
  const toggleMutation = useToggleAutomationRule(projectId)

  const [showCreate, setShowCreate] = useState(false)
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null)
  const [viewingLogRuleId, setViewingLogRuleId] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
      </div>
    )
  }

  if (viewingLogRuleId) {
    return (
      <div className="space-y-3">
        <Button variant="outline" size="sm" onClick={() => setViewingLogRuleId(null)}>
          목록으로 돌아가기
        </Button>
        <ExecutionLog ruleId={viewingLogRuleId} />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* 규칙 목록 */}
      {rules && rules.length > 0 && (
        <div className="space-y-2">
          {rules.map((rule) => (
            <div key={rule.id} className="flex items-center gap-2 rounded-md border p-3">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{rule.name}</span>
                  {!rule.is_active && (
                    <Badge variant="secondary" className="text-xs">
                      비활성
                    </Badge>
                  )}
                </div>
                <div className="text-muted-foreground flex items-center gap-2 text-xs">
                  <span>{TRIGGER_LABELS[rule.trigger_type] ?? rule.trigger_type}</span>
                  <span>→</span>
                  <span>{ACTION_LABELS[rule.action_type] ?? rule.action_type}</span>
                </div>
                <div className="text-muted-foreground flex items-center gap-3 text-xs">
                  <span>실행 {rule.execution_count}회</span>
                  {rule.last_executed_at && (
                    <span>
                      마지막: {new Date(rule.last_executed_at).toLocaleDateString('ko-KR')}
                    </span>
                  )}
                </div>
              </div>

              <Switch
                checked={rule.is_active}
                onCheckedChange={(checked) =>
                  toggleMutation.mutate({ ruleId: rule.id, isActive: checked })
                }
                aria-label="규칙 활성화 토글"
              />

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setEditingRule(rule)}
                aria-label="규칙 편집"
              >
                <Pencil className="h-3 w-3" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewingLogRuleId(rule.id)}
                aria-label="실행 로그 보기"
              >
                <History className="h-3 w-3" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="text-destructive h-8 w-8"
                onClick={() => deleteMutation.mutate(rule.id)}
                disabled={deleteMutation.isPending}
                aria-label="규칙 삭제"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {rules && rules.length === 0 && (
        <p className="text-muted-foreground text-sm">등록된 자동화 규칙이 없습니다.</p>
      )}

      {/* 추가 버튼 */}
      <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => setShowCreate(true)}>
        <Plus className="h-3 w-3" />
        규칙 추가
      </Button>

      {/* 생성 다이얼로그 */}
      <AutomationRuleForm projectId={projectId} open={showCreate} onOpenChange={setShowCreate} />

      {/* 편집 다이얼로그 */}
      {editingRule && (
        <AutomationRuleForm
          projectId={projectId}
          rule={editingRule}
          open={!!editingRule}
          onOpenChange={(open) => {
            if (!open) setEditingRule(null)
          }}
        />
      )}
    </div>
  )
}
