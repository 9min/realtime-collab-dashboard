'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { useUpsertIntegration, useDeleteIntegration, useToggleIntegration } from '@/queries/use-integrations'
import { INTEGRATION_EVENT } from '@/types/integration'
import type { ProjectIntegration, SlackConfig, IntegrationEvent } from '@/types/integration'

const slackSchema = z.object({
  webhookUrl: z.string().url('유효한 URL을 입력해주세요'),
  channel: z.string().optional(),
})

type SlackFormData = z.infer<typeof slackSchema>

interface SlackIntegrationFormProps {
  projectId: string
  integration?: ProjectIntegration
  isOwnerOrAdmin: boolean
}

const EVENT_LABELS: Record<IntegrationEvent, string> = {
  task_created: '태스크 생성',
  task_updated: '태스크 수정',
  task_deleted: '태스크 삭제',
} as const

export function SlackIntegrationForm({ projectId, integration, isOwnerOrAdmin }: SlackIntegrationFormProps) {
  const config = integration?.config as SlackConfig | undefined
  const [selectedEvents, setSelectedEvents] = useState<IntegrationEvent[]>(
    config?.events ?? [INTEGRATION_EVENT.TASK_CREATED, INTEGRATION_EVENT.TASK_UPDATED],
  )
  const [isTesting, setIsTesting] = useState(false)

  const upsertMutation = useUpsertIntegration(projectId)
  const deleteMutation = useDeleteIntegration(projectId)
  const toggleMutation = useToggleIntegration(projectId)

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<SlackFormData>({
    resolver: zodResolver(slackSchema),
    defaultValues: {
      webhookUrl: config?.webhookUrl ?? '',
      channel: config?.channel ?? '',
    },
  })

  const toggleEvent = (event: IntegrationEvent) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    )
  }

  const handleSave = handleSubmit((data) => {
    upsertMutation.mutate({
      type: 'slack',
      config: {
        webhookUrl: data.webhookUrl,
        channel: data.channel || undefined,
        events: selectedEvents,
      } satisfies SlackConfig,
    })
  })

  const handleTest = async () => {
    const webhookUrl = getValues('webhookUrl')
    if (!webhookUrl) {
      toast.error('Webhook URL을 입력해주세요')
      return
    }

    setIsTesting(true)
    try {
      const res = await fetch('/api/webhooks/slack/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl }),
      })

      if (res.ok) {
        toast.success('테스트 메시지가 전송되었습니다')
      } else {
        const data = await res.json()
        toast.error(data.error ?? '테스트 실패')
      }
    } catch {
      toast.error('테스트 요청에 실패했습니다')
    } finally {
      setIsTesting(false)
    }
  }

  if (!isOwnerOrAdmin) {
    return (
      <div className="text-muted-foreground text-sm">
        {integration ? (
          <div className="space-y-2">
            <p>Slack 연동이 {integration.is_active ? '활성화' : '비활성화'}되어 있습니다.</p>
            <p className="text-xs">설정 변경은 프로젝트 소유자 또는 관리자만 가능합니다.</p>
          </div>
        ) : (
          <p>Slack 연동이 설정되지 않았습니다.</p>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      {integration && (
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">활성화</span>
            <Badge variant={integration.is_active ? 'default' : 'secondary'}>
              {integration.is_active ? 'ON' : 'OFF'}
            </Badge>
          </div>
          <Switch
            checked={integration.is_active}
            onCheckedChange={(checked) =>
              toggleMutation.mutate({ integrationId: integration.id, isActive: checked })
            }
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="slack-webhook-url">Webhook URL</Label>
        <Input
          id="slack-webhook-url"
          {...register('webhookUrl')}
          placeholder="https://hooks.slack.com/services/..."
        />
        {errors.webhookUrl && (
          <p className="text-destructive text-xs">{errors.webhookUrl.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="slack-channel">채널 (선택)</Label>
        <Input
          id="slack-channel"
          {...register('channel')}
          placeholder="#project-updates"
        />
      </div>

      <div className="space-y-2">
        <Label>알림 이벤트</Label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(INTEGRATION_EVENT).map(([key, value]) => {
            const isActive = selectedEvents.includes(value)
            return (
              <Badge
                key={key}
                role="checkbox"
                aria-checked={isActive}
                tabIndex={0}
                variant={isActive ? 'default' : 'outline'}
                className="cursor-pointer select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                onClick={() => toggleEvent(value)}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    toggleEvent(value)
                  }
                }}
              >
                {EVENT_LABELS[value]}
              </Badge>
            )
          })}
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={upsertMutation.isPending}>
          {upsertMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          저장
        </Button>
        <Button type="button" variant="outline" onClick={handleTest} disabled={isTesting}>
          {isTesting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          테스트
        </Button>
        {integration && (
          <Button
            type="button"
            variant="destructive"
            onClick={() => deleteMutation.mutate(integration.id)}
            disabled={deleteMutation.isPending}
          >
            삭제
          </Button>
        )}
      </div>
    </form>
  )
}
