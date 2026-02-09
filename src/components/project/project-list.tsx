'use client'

import { useState } from 'react'
import { FolderOpen, Loader2 } from 'lucide-react'

import { EmptyState } from '@/components/ui/empty-state'
import { useMyProfile } from '@/queries/use-admin'
import { useProjects, useDeleteProject } from '@/queries/use-projects'
import type { ProjectWithMemberCount } from '@/services/project-service'

import { CreateProjectDialog } from './create-project-dialog'
import { EditProjectDialog } from './edit-project-dialog'
import { ProjectCard } from './project-card'

export function ProjectList() {
  const { data: projects, isLoading, error } = useProjects()
  const { data: myProfile } = useMyProfile()
  const deleteProject = useDeleteProject()
  const [editTarget, setEditTarget] = useState<ProjectWithMemberCount | null>(null)
  const isAdmin = myProfile?.is_admin ?? false

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
            참여 중인 프로젝트 <span className="font-semibold text-blue-600 dark:text-blue-400">{projects?.length ?? 0}</span>개
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
      ) : (
        <EmptyState
          icon={FolderOpen}
          title="아직 프로젝트가 없습니다"
          description={
            isAdmin
              ? '새 프로젝트를 만들어 팀과 협업을 시작하세요'
              : '관리자에게 프로젝트 생성을 요청하세요'
          }
          className="min-h-[400px]"
        />
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
