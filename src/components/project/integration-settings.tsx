'use client'

import { useState } from 'react'

import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useIntegrations } from '@/queries/use-integrations'
import type { ProjectIntegration } from '@/types/integration'

import { SlackIntegrationForm } from './slack-integration-form'
import { GitHubIntegrationForm } from './github-integration-form'

interface IntegrationSettingsProps {
  projectId: string
  isOwnerOrAdmin: boolean
}

export function IntegrationSettings({ projectId, isOwnerOrAdmin }: IntegrationSettingsProps) {
  const { data: integrations, isLoading } = useIntegrations(projectId)
  const [activeTab, setActiveTab] = useState('slack')

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40" />
      </div>
    )
  }

  const slackIntegration = integrations?.find((i: ProjectIntegration) => i.type === 'slack')
  const githubIntegration = integrations?.find((i: ProjectIntegration) => i.type === 'github')

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="slack">Slack</TabsTrigger>
        <TabsTrigger value="github">GitHub</TabsTrigger>
      </TabsList>
      <TabsContent value="slack" className="mt-4">
        <SlackIntegrationForm
          projectId={projectId}
          integration={slackIntegration}
          isOwnerOrAdmin={isOwnerOrAdmin}
        />
      </TabsContent>
      <TabsContent value="github" className="mt-4">
        <GitHubIntegrationForm
          projectId={projectId}
          integration={githubIntegration}
          isOwnerOrAdmin={isOwnerOrAdmin}
        />
      </TabsContent>
    </Tabs>
  )
}
