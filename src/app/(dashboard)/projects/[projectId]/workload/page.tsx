'use client'

import { use } from 'react'

import { WorkloadView } from '@/components/workload/workload-view'

interface WorkloadPageProps {
  params: Promise<{ projectId: string }>
}

export default function WorkloadPage({ params }: WorkloadPageProps) {
  const { projectId } = use(params)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">워크로드</h2>
        <p className="text-muted-foreground mt-1 text-sm">멤버별 태스크 배분 현황을 확인합니다</p>
      </div>
      <WorkloadView projectId={projectId} />
    </div>
  )
}
