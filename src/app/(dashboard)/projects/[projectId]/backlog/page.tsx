'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import { Inbox, TrendingUp } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { useAuth } from '@/hooks/use-auth'
import { MEMBER_ROLE } from '@/lib/constants'
import { useProjectMembers } from '@/queries/use-projects'
import { useSprints } from '@/queries/use-sprints'
import { useSprintStore } from '@/stores/sprint-store'
import { SPRINT_STATUS } from '@/types/sprint'

import { SprintHeader } from '@/components/sprint/sprint-header'
import { SprintPlanningView } from '@/components/sprint/sprint-planning-view'
import { VelocityChart } from '@/components/sprint/velocity-chart'

export default function BacklogPage() {
  const params = useParams<{ projectId: string }>()
  const { user } = useAuth()
  const { data: members } = useProjectMembers(params.projectId)
  const { data: sprints } = useSprints(params.projectId)
  const selectedSprintId = useSprintStore((s) => s.selectedSprintId)

  const currentRole = members?.find((m) => m.user_id === user?.id)?.role
  const canManage = currentRole === MEMBER_ROLE.OWNER || currentRole === MEMBER_ROLE.ADMIN

  const activeSprint = useMemo(
    () => sprints?.find((s) => s.status === SPRINT_STATUS.ACTIVE) ?? null,
    [sprints],
  )

  const planningSprintId = selectedSprintId ?? activeSprint?.id

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h2 className="text-2xl font-bold">백로그</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          스프린트를 계획하고 태스크를 관리합니다
        </p>
      </div>

      <SprintHeader projectId={params.projectId} canManage={canManage} />

      {planningSprintId ? (
        <SprintPlanningView projectId={params.projectId} sprintId={planningSprintId} />
      ) : (
        <EmptyState
          icon={Inbox}
          title="선택된 스프린트가 없습니다"
          description="스프린트를 선택하거나 새로 생성하세요"
        />
      )}

      {/* 벨로시티 차트 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            벨로시티
          </CardTitle>
          <p className="text-muted-foreground text-xs">스프린트별 태스크 완료 추이</p>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <VelocityChart projectId={params.projectId} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
