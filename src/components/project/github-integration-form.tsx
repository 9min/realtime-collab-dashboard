'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { useUpsertIntegration, useDeleteIntegration, useToggleIntegration } from '@/queries/use-integrations'
import { INTEGRATION_EVENT } from '@/types/integration'
import type { ProjectIntegration, GitHubConfig, IntegrationEvent } from '@/types/integration'

const githubSchema = z.object({
  owner: z.string().min(1, '소유자를 입력해주세요'),
  repo: z.string().min(1, '리포지토리를 입력해주세요'),
  token: z.string(),
})

type GitHubFormData = z.infer<typeof githubSchema>

interface GitHubIntegrationFormProps {
  projectId: string
  integration?: ProjectIntegration
  isOwnerOrAdmin: boolean
}

const EVENT_LABELS: Record<IntegrationEvent, string> = {
  task_created: '태스크 생성',
  task_updated: '태스크 수정',
  task_deleted: '태스크 삭제',
} as const

export function GitHubIntegrationForm({ projectId, integration, isOwnerOrAdmin }: GitHubIntegrationFormProps) {
  const config = integration?.config as GitHubConfig | undefined
  const [selectedEvents, setSelectedEvents] = useState<IntegrationEvent[]>(
    config?.events ?? [INTEGRATION_EVENT.TASK_CREATED],
  )

  const upsertMutation = useUpsertIntegration(projectId)
  const deleteMutation = useDeleteIntegration(projectId)
  const toggleMutation = useToggleIntegration(projectId)

  const hasExistingToken = Boolean(integration)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GitHubFormData>({
    resolver: zodResolver(
      hasExistingToken
        ? githubSchema
        : githubSchema.extend({ token: z.string().min(1, 'Personal Access Token을 입력해주세요') }),
    ),
    defaultValues: {
      owner: config?.owner ?? '',
      repo: config?.repo ?? '',
      token: '',
    },
  })

  const toggleEvent = (event: IntegrationEvent) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    )
  }

  const handleSave = handleSubmit((data) => {
    upsertMutation.mutate({
      type: 'github',
      config: {
        owner: data.owner,
        repo: data.repo,
        token: data.token,
        events: selectedEvents,
      } satisfies GitHubConfig,
    })
  })

  if (!isOwnerOrAdmin) {
    return (
      <div className="text-muted-foreground text-sm">
        {integration ? (
          <div className="space-y-2">
            <p>GitHub 연동이 {integration.is_active ? '활성화' : '비활성화'}되어 있습니다.</p>
            <p className="text-xs">설정 변경은 프로젝트 소유자 또는 관리자만 가능합니다.</p>
          </div>
        ) : (
          <p>GitHub 연동이 설정되지 않았습니다.</p>
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
        <Label htmlFor="github-owner">저장소 소유자</Label>
        <Input
          id="github-owner"
          {...register('owner')}
          placeholder="username 또는 organization"
        />
        {errors.owner && (
          <p className="text-destructive text-xs">{errors.owner.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="github-repo">리포지토리</Label>
        <Input
          id="github-repo"
          {...register('repo')}
          placeholder="repository-name"
        />
        {errors.repo && (
          <p className="text-destructive text-xs">{errors.repo.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="github-token">Personal Access Token</Label>
        <Input
          id="github-token"
          {...register('token')}
          type="password"
          placeholder={hasExistingToken ? '변경하려면 새 토큰을 입력하세요' : 'ghp_...'}
        />
        {hasExistingToken && (
          <p className="text-muted-foreground text-xs">비워두면 기존 토큰이 유지됩니다</p>
        )}
        {errors.token && (
          <p className="text-destructive text-xs">{errors.token.message}</p>
        )}
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
