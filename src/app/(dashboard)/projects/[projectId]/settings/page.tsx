'use client'

import { use, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2, UserPlus, Shield, Crown, Tag, ListChecks, Link2, Paperclip, MessageSquare } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/hooks/use-auth'
import { useProject, useProjectMembers, useInviteMember, useUpdateMemberRole, useRemoveMember, useUpdateProject, useDeleteProject } from '@/queries/use-projects'
import { LabelManager } from '@/components/kanban/label-manager'
import { IntegrationSettings } from '@/components/project/integration-settings'
import { MEMBER_ROLE } from '@/lib/constants'
import type { MemberRole } from '@/types/common'

// 초대 폼 스키마
const inviteSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
  role: z.string(),
})

type InviteFormData = z.infer<typeof inviteSchema>

// 역할별 아이콘/라벨
const ROLE_CONFIG = {
  [MEMBER_ROLE.OWNER]: { label: '소유자', icon: Crown, variant: 'default' as const },
  [MEMBER_ROLE.ADMIN]: { label: '관리자', icon: Shield, variant: 'secondary' as const },
  [MEMBER_ROLE.MEMBER]: { label: '멤버', icon: null, variant: 'outline' as const },
  [MEMBER_ROLE.VIEWER]: { label: '뷰어', icon: null, variant: 'outline' as const },
} as const

interface ProjectSettingsPageProps {
  params: Promise<{ projectId: string }>
}

export default function ProjectSettingsPage({ params }: ProjectSettingsPageProps) {
  const { projectId } = use(params)
  const { user } = useAuth()
  const { data: project, isLoading: projectLoading, isError: projectError } = useProject(projectId)
  const { data: members, isLoading: membersLoading, isError: membersError } = useProjectMembers(projectId)
  const inviteMutation = useInviteMember(projectId)
  const updateRoleMutation = useUpdateMemberRole(projectId)
  const removeMutation = useRemoveMember(projectId)
  const updateMutation = useUpdateProject(projectId)
  const deleteMutation = useDeleteProject()

  const [isEditing, setIsEditing] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '', role: MEMBER_ROLE.MEMBER },
  })

  // 현재 유저의 역할 확인
  const currentMember = members?.find((m) => m.user_id === user?.id)
  const isOwnerOrAdmin =
    currentMember?.role === MEMBER_ROLE.OWNER || currentMember?.role === MEMBER_ROLE.ADMIN

  const handleInvite = handleSubmit((data) => {
    inviteMutation.mutate(
      { email: data.email, role: data.role as MemberRole },
      { onSuccess: () => reset() },
    )
  })

  const handleEditProject = () => {
    if (!project) return
    setProjectName(project.name)
    setProjectDescription(project.description ?? '')
    setIsEditing(true)
  }

  const handleSaveProject = () => {
    updateMutation.mutate(
      { name: projectName, description: projectDescription || null },
      { onSuccess: () => setIsEditing(false) },
    )
  }

  // 로딩 중
  if (projectLoading || membersLoading) {
    return (
      <div className="space-y-8 max-w-2xl">
        <div>
          <h2 className="text-2xl font-bold">프로젝트 설정</h2>
          <p className="text-muted-foreground mt-1">프로젝트 정보 수정 및 멤버 관리</p>
        </div>
        <div className="rounded-xl border p-6 space-y-3">
          <div className="bg-muted h-6 w-32 animate-pulse rounded" />
          <div className="bg-muted h-10 w-full animate-pulse rounded" />
        </div>
        <div className="rounded-xl border p-6 space-y-3">
          <div className="bg-muted h-6 w-24 animate-pulse rounded" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-muted h-14 animate-pulse rounded" />
          ))}
        </div>
      </div>
    )
  }

  // 에러
  if (projectError || membersError) {
    return (
      <div className="space-y-8 max-w-2xl">
        <div>
          <h2 className="text-2xl font-bold">프로젝트 설정</h2>
          <p className="text-muted-foreground mt-1">프로젝트 정보 수정 및 멤버 관리</p>
        </div>
        <div className="rounded-xl border bg-destructive/10 p-6">
          <p className="text-destructive">프로젝트 설정을 불러오는데 실패했습니다. 페이지를 새로고침해주세요.</p>
        </div>
      </div>
    )
  }

  const FEATURE_ITEMS = [
    { key: 'feature_subtasks', label: '서브태스크', description: '태스크를 세부 항목으로 나누어 관리합니다', icon: ListChecks },
    { key: 'feature_dependencies', label: '연결된 작업', description: '태스크 간 선행/후행 관계를 설정합니다', icon: Link2 },
    { key: 'feature_attachments', label: '첨부파일', description: '태스크에 파일을 첨부합니다', icon: Paperclip },
    { key: 'feature_comments', label: '댓글', description: '태스크에 댓글을 남깁니다', icon: MessageSquare },
  ] as const

  return (
    <div className="space-y-10 max-w-2xl pb-8">
      <div>
        <h2 className="text-2xl font-bold">프로젝트 설정</h2>
        <p className="text-muted-foreground mt-1">프로젝트 정보와 기능을 관리합니다</p>
      </div>

      {/* ── 일반 ── */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">일반</h3>

        {/* 프로젝트 정보 */}
        <Card className="p-5 space-y-4">
          <h4 className="text-base font-semibold">프로젝트 정보</h4>
          {isEditing ? (
            <div className="space-y-3">
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="프로젝트 이름"
              />
              <Input
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="프로젝트 설명 (선택)"
              />
              <div className="flex gap-2">
                <Button onClick={handleSaveProject} disabled={updateMutation.isPending}>
                  저장
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  취소
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{project?.name}</p>
                <p className="text-muted-foreground text-sm">{project?.description || '설명 없음'}</p>
              </div>
              {isOwnerOrAdmin && (
                <Button variant="outline" size="sm" onClick={handleEditProject}>
                  수정
                </Button>
              )}
            </div>
          )}
        </Card>

        {/* 멤버 관리 */}
        <Card className="p-5 space-y-4">
          <h4 className="text-base font-semibold">
            멤버 ({members?.length ?? 0})
          </h4>

          {isOwnerOrAdmin && (
            <form onSubmit={handleInvite} className="flex gap-2">
              <div className="flex-1">
                <Input
                  {...register('email')}
                  type="email"
                  placeholder="이메일로 초대"
                />
                {errors.email && (
                  <p className="text-destructive mt-1 text-xs">{errors.email.message}</p>
                )}
              </div>
              <Select
                defaultValue={MEMBER_ROLE.MEMBER}
                onValueChange={(v) => setValue('role', v)}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={MEMBER_ROLE.ADMIN}>관리자</SelectItem>
                  <SelectItem value={MEMBER_ROLE.MEMBER}>멤버</SelectItem>
                  <SelectItem value={MEMBER_ROLE.VIEWER}>뷰어</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" disabled={inviteMutation.isPending}>
                <UserPlus className="mr-2 h-4 w-4" />
                초대
              </Button>
            </form>
          )}

          {membersLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-muted h-14 animate-pulse rounded" />
              ))}
            </div>
          ) : (
            <div className="divide-y">
              {members?.map((member) => {
                const profile = member.profiles
                const roleConfig = ROLE_CONFIG[member.role as keyof typeof ROLE_CONFIG]
                const isCurrentUser = member.user_id === user?.id
                const isOwner = member.role === MEMBER_ROLE.OWNER
                const canChangeRole = isOwnerOrAdmin && !isOwner && !isCurrentUser
                const canRemove = isOwnerOrAdmin && !isOwner && !isCurrentUser

                return (
                  <div key={member.id} className="flex items-center gap-3 py-3">
                    <Avatar>
                      <AvatarImage src={profile?.avatar_url ?? undefined} />
                      <AvatarFallback>
                        {profile?.full_name?.slice(0, 2).toUpperCase() ?? '??'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {profile?.full_name ?? '사용자'}
                        {isCurrentUser && (
                          <span className="text-muted-foreground ml-1">(나)</span>
                        )}
                      </p>
                      <p className="text-muted-foreground text-xs">{profile?.email}</p>
                    </div>
                    {canChangeRole ? (
                      <Select
                        value={member.role}
                        onValueChange={(role) =>
                          updateRoleMutation.mutate({
                            memberId: member.id,
                            role: role as 'admin' | 'member' | 'viewer',
                          })
                        }
                        disabled={updateRoleMutation.isPending}
                      >
                        <SelectTrigger className="w-28 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={MEMBER_ROLE.ADMIN}>관리자</SelectItem>
                          <SelectItem value={MEMBER_ROLE.MEMBER}>멤버</SelectItem>
                          <SelectItem value={MEMBER_ROLE.VIEWER}>뷰어</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant={roleConfig?.variant ?? 'outline'}>
                        {roleConfig?.icon && <roleConfig.icon className="mr-1 h-3 w-3" />}
                        {roleConfig?.label ?? member.role}
                      </Badge>
                    )}
                    {canRemove && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive h-8 w-8"
                        onClick={() => removeMutation.mutate(member.id)}
                        disabled={removeMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </section>

      {/* ── 기능 설정 ── owner/admin만 */}
      {isOwnerOrAdmin && project && (
        <section className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">기능 설정</h3>
            <p className="text-muted-foreground text-xs mt-1">
              비활성화된 기능은 태스크 상세에서 숨겨집니다
            </p>
          </div>

          <Card className="divide-y gap-0 p-0 overflow-hidden">
            {/* 라벨 — 토글 + 인라인 라벨 관리 */}
            <div>
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <Tag className="text-muted-foreground h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium">라벨</p>
                    <p className="text-muted-foreground text-xs">태스크에 라벨을 할당하여 분류합니다</p>
                  </div>
                </div>
                <Switch
                  checked={project.feature_labels}
                  onCheckedChange={(checked) => {
                    updateMutation.mutate({ feature_labels: checked })
                  }}
                />
              </div>
              {project.feature_labels && (
                <div className="border-t bg-muted/30 px-4 py-4">
                  <p className="text-muted-foreground text-xs font-medium mb-3">라벨 관리</p>
                  <LabelManager projectId={projectId} />
                </div>
              )}
            </div>

            {/* 나머지 기능 토글 */}
            {FEATURE_ITEMS.map(({ key, label, description, icon: Icon }) => (
              <div key={key} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <Icon className="text-muted-foreground h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-muted-foreground text-xs">{description}</p>
                  </div>
                </div>
                <Switch
                  checked={project[key]}
                  onCheckedChange={(checked) => {
                    updateMutation.mutate({ [key]: checked })
                  }}
                />
              </div>
            ))}
          </Card>
        </section>
      )}

      {/* ── 외부 연동 ── owner/admin만 */}
      {isOwnerOrAdmin && (
        <section className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">외부 연동</h3>
            <p className="text-muted-foreground text-xs mt-1">
              Slack, GitHub 등 외부 서비스와 연동합니다
            </p>
          </div>

          <Card className="p-5">
            <IntegrationSettings projectId={projectId} isOwnerOrAdmin={isOwnerOrAdmin} />
          </Card>
        </section>
      )}

      {/* ── 위험 영역 ── owner만 */}
      {currentMember?.role === MEMBER_ROLE.OWNER && (
        <section className="space-y-4">
          <h3 className="text-sm font-semibold tracking-wide text-destructive/70 uppercase">위험 영역</h3>

          <Card className="border-destructive/30 p-5 space-y-4">
            <div>
              <h4 className="text-base font-semibold">프로젝트 삭제</h4>
              <p className="text-muted-foreground text-sm mt-1">
                프로젝트를 삭제하면 모든 데이터(태스크, 컬럼, 멤버)가 영구 삭제됩니다.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={deleteMutation.isPending}>
                  프로젝트 삭제
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>프로젝트를 삭제하시겠습니까?</AlertDialogTitle>
                  <AlertDialogDescription>
                    &quot;{project?.name}&quot; 프로젝트와 모든 데이터(태스크, 컬럼, 멤버)가 영구 삭제됩니다.
                    <br />이 작업은 되돌릴 수 없습니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => deleteMutation.mutate(projectId)}
                  >
                    삭제
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </Card>
        </section>
      )}
    </div>
  )
}
