'use client'

import { useState } from 'react'
import { FolderOpen, Loader2, Send, CheckCircle2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/use-auth'
import { useMyProfile } from '@/queries/use-admin'
import { useProjects, useDeleteProject } from '@/queries/use-projects'
import { useMyMessage, useSendMessage } from '@/queries/use-user-messages'
import type { ProjectWithMemberCount } from '@/services/project-service'

import { CreateProjectDialog } from './create-project-dialog'
import { EditProjectDialog } from './edit-project-dialog'
import { ProjectCard } from './project-card'

const MAX_MESSAGE_LENGTH = 200

export function ProjectList() {
  const { data: projects, isLoading, error } = useProjects()
  const { data: myProfile } = useMyProfile()
  const { user } = useAuth()
  const deleteProject = useDeleteProject()
  const [editTarget, setEditTarget] = useState<ProjectWithMemberCount | null>(null)
  const [messageText, setMessageText] = useState('')
  const isAdmin = myProfile?.is_admin ?? false

  const { data: myMessage, isLoading: messageLoading } = useMyMessage()
  const sendMessage = useSendMessage()

  const handleEdit = (project: ProjectWithMemberCount) => {
    setEditTarget(project)
  }

  const handleDelete = (projectId: string) => {
    deleteProject.mutate(projectId)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-2">
        <p className="text-destructive text-sm">프로젝트 목록을 불러오는데 실패했습니다</p>
        <p className="text-muted-foreground text-xs">{error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">프로젝트</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            참여 중인 프로젝트{' '}
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {projects?.length ?? 0}
            </span>
            개
          </p>
        </div>
        {isAdmin && <CreateProjectDialog />}
      </div>

      {/* 프로젝트 그리드 */}
      {projects && projects.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : isAdmin ? (
        <EmptyState
          icon={FolderOpen}
          title="아직 프로젝트가 없습니다"
          description="새 프로젝트를 만들어 팀과 협업을 시작하세요"
          className="min-h-[400px]"
        />
      ) : (
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8">
          <FolderOpen className="text-muted-foreground h-12 w-12" />
          <div className="text-center">
            <p className="font-medium">아직 프로젝트가 없습니다</p>
            <p className="text-muted-foreground mt-1 text-sm">
              관리자에게 메시지를 보내 프로젝트 참여를 요청하세요
            </p>
          </div>

          {messageLoading ? (
            <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
          ) : myMessage ? (
            <div className="bg-muted flex items-center gap-2 rounded-lg px-4 py-3 text-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
              <span>메시지가 전송되었습니다. 관리자의 확인을 기다려주세요.</span>
            </div>
          ) : (
            <div className="w-full max-w-md space-y-3">
              <Textarea
                placeholder="관리자에게 보낼 메시지를 입력하세요..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                maxLength={MAX_MESSAGE_LENGTH}
                rows={3}
                className="resize-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">
                  {messageText.length}/{MAX_MESSAGE_LENGTH}
                </span>
                <Button
                  size="sm"
                  disabled={!messageText.trim() || sendMessage.isPending}
                  onClick={() => {
                    if (!user) return
                    sendMessage.mutate({ userId: user.id, message: messageText.trim() })
                  }}
                  className="gap-1.5"
                >
                  {sendMessage.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  전송
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 수정 다이얼로그 */}
      <EditProjectDialog
        project={editTarget}
        open={editTarget !== null}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null)
        }}
      />
    </div>
  )
}
