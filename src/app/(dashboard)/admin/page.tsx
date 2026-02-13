'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  ChevronRight,
  FolderOpen,
  Loader2,
  MessageSquare,
  Search,
  ShieldCheck,
  ShieldOff,
  Users,
  UserCog,
  UserX,
  FolderKanban,
  CheckCheck,
} from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useMyProfile,
  useAllUsers,
  useAllProjectMemberships,
  useSetAdminStatus,
  useForceDeleteUser,
} from '@/queries/use-admin'
import { useAllUserMessages, useMarkMessageRead } from '@/queries/use-user-messages'
import { useAuth } from '@/hooks/use-auth'
import type { ProjectMembership } from '@/services/admin-service'
import type { UserMessage } from '@/types/user-message'

const ROLE_LABELS: Record<ProjectMembership['role'], string> = {
  owner: '소유자',
  admin: '관리자',
  member: '멤버',
  viewer: '뷰어',
} as const

const ROLE_BADGE_VARIANT: Record<ProjectMembership['role'], 'default' | 'secondary' | 'outline'> = {
  owner: 'default',
  admin: 'secondary',
  member: 'outline',
  viewer: 'outline',
} as const

function StatCard({
  icon: Icon,
  label,
  value,
  accentClass,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  accentClass: string
}) {
  return (
    <Card className={`border-t-2 ${accentClass} gap-0 py-4`}>
      <CardContent className="flex items-center gap-3">
        <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
          <Icon className="text-muted-foreground h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl leading-none font-bold">{value}</p>
          <p className="text-muted-foreground mt-1 text-xs">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function LoadingSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">사용자 관리</h2>
        <p className="text-muted-foreground mt-1">전체 사용자 및 프로젝트 참여 현황을 관리합니다</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="gap-0 py-4">
            <CardContent className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-10" />
                <Skeleton className="h-3 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export default function AdminPage() {
  const { user } = useAuth()
  const { data: myProfile, isLoading: profileLoading } = useMyProfile()
  const { data: users, isLoading: usersLoading } = useAllUsers()
  const { data: memberships, isLoading: membershipsLoading } = useAllProjectMemberships()
  const setAdminStatus = useSetAdminStatus()
  const forceDeleteUser = useForceDeleteUser()
  const { data: userMessages } = useAllUserMessages()
  const markMessageRead = useMarkMessageRead()

  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string
    name: string
    email: string
  } | null>(null)
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1)
  const [confirmEmail, setConfirmEmail] = useState('')

  const messagesByUser = useMemo(() => {
    const map = new Map<string, UserMessage>()
    if (!userMessages) return map

    for (const m of userMessages) {
      if (!map.has(m.user_id)) {
        map.set(m.user_id, m)
      }
    }
    return map
  }, [userMessages])

  const membershipsByUser = useMemo(() => {
    const map = new Map<string, ProjectMembership[]>()
    if (!memberships) return map

    for (const m of memberships) {
      const list = map.get(m.user_id)
      if (list) {
        list.push(m)
      } else {
        map.set(m.user_id, [m])
      }
    }
    return map
  }, [memberships])

  const filteredUsers = useMemo(() => {
    if (!users) return []
    if (!searchQuery.trim()) return users

    const query = searchQuery.toLowerCase()
    return users.filter(
      (u) => u.full_name?.toLowerCase().includes(query) || u.email.toLowerCase().includes(query),
    )
  }, [users, searchQuery])

  const stats = useMemo(() => {
    if (!users || !memberships) return null
    const adminCount = users.filter((u) => u.is_admin).length
    const uniqueProjects = new Set(memberships.map((m) => m.project_id))
    return { total: users.length, admins: adminCount, projects: uniqueProjects.size }
  }, [users, memberships])

  const openDeleteDialog = useCallback(
    (profile: { id: string; full_name: string | null; email: string }) => {
      setDeleteTarget({
        id: profile.id,
        name: profile.full_name ?? profile.email,
        email: profile.email,
      })
      setDeleteStep(1)
      setConfirmEmail('')
    },
    [],
  )

  const closeDeleteDialog = useCallback(() => {
    setDeleteTarget(null)
    setDeleteStep(1)
    setConfirmEmail('')
  }, [])

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return
    forceDeleteUser.mutate(deleteTarget.id, {
      onSuccess: () => closeDeleteDialog(),
    })
  }, [deleteTarget, forceDeleteUser, closeDeleteDialog])

  const isLoading = profileLoading || usersLoading || membershipsLoading

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (!myProfile?.is_admin) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h2 className="text-2xl font-bold">사용자 관리</h2>
          <p className="text-muted-foreground mt-1">
            전체 사용자 및 프로젝트 참여 현황을 관리합니다
          </p>
        </div>
        <Card className="border-destructive/50">
          <CardContent>
            <p className="text-destructive text-sm">관리자 권한이 필요합니다.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleToggleAdmin = (userId: string, currentIsAdmin: boolean) => {
    setAdminStatus.mutate({ userId, isAdmin: !currentIsAdmin })
  }

  const toggleExpand = (userId: string) => {
    setExpandedUsers((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) {
        next.delete(userId)
      } else {
        next.add(userId)
      }
      return next
    })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">사용자 관리</h2>
        <p className="text-muted-foreground mt-1">전체 사용자 및 프로젝트 참여 현황을 관리합니다</p>
      </div>

      {/* Stat Cards */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            icon={Users}
            label="전체 사용자"
            value={stats.total}
            accentClass="border-t-blue-500"
          />
          <StatCard
            icon={UserCog}
            label="관리자"
            value={stats.admins}
            accentClass="border-t-violet-500"
          />
          <StatCard
            icon={FolderKanban}
            label="프로젝트"
            value={stats.projects}
            accentClass="border-t-emerald-500"
          />
        </div>
      )}

      {/* User List Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">전체 사용자</CardTitle>
              <CardDescription>
                {searchQuery ? `${filteredUsers.length}명 검색됨` : `${filteredUsers.length}명`}
              </CardDescription>
            </div>
          </div>
          <div className="relative mt-2">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="이름 또는 이메일로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredUsers.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Search className="text-muted-foreground/50 mb-3 h-10 w-10" />
                <p className="text-muted-foreground text-sm">검색 결과가 없습니다</p>
              </div>
            )}
            {filteredUsers.map((profile) => {
              const isCurrentUser = profile.id === user?.id
              const initial = profile.full_name?.[0] ?? profile.email[0]?.toUpperCase() ?? '?'
              const isExpanded = expandedUsers.has(profile.id)
              const userMemberships = membershipsByUser.get(profile.id) ?? []
              const userMessage = messagesByUser.get(profile.id)
              const hasUnreadMessage = userMessage && !userMessage.is_read

              return (
                <div
                  key={profile.id}
                  className={`rounded-lg border transition-colors ${isExpanded ? 'border-primary/30 bg-muted/30' : ''}`}
                >
                  <div
                    role="button"
                    tabIndex={0}
                    className="hover:bg-muted/50 flex w-full cursor-pointer items-center justify-between p-3 text-left transition-colors"
                    onClick={() => toggleExpand(profile.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        toggleExpand(profile.id)
                      }
                    }}
                    aria-expanded={isExpanded}
                    aria-label={`${profile.full_name ?? profile.email} 프로젝트 목록 ${isExpanded ? '접기' : '펼치기'}`}
                  >
                    <div className="flex items-center gap-3">
                      <ChevronRight
                        className={`text-muted-foreground h-4 w-4 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                      />
                      <Avatar className="group-hover:ring-primary/20 h-9 w-9 ring-2 ring-transparent transition-shadow">
                        <AvatarImage
                          src={profile.avatar_url ?? undefined}
                          alt={profile.full_name ?? ''}
                        />
                        <AvatarFallback className="text-xs">{initial}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                          {profile.full_name ?? '이름 없음'}
                          {isCurrentUser && (
                            <span className="text-muted-foreground text-xs">(나)</span>
                          )}
                          {hasUnreadMessage && (
                            <span className="relative flex h-4 w-4 shrink-0 items-center justify-center">
                              <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
                              <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-blue-500" />
                            </span>
                          )}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">{profile.email}</p>
                      </div>
                    </div>

                    <div
                      className="flex shrink-0 items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Badge
                        variant={profile.is_admin ? 'default' : 'outline'}
                        className="gap-1 text-xs"
                      >
                        {profile.is_admin && <ShieldCheck className="h-3 w-3" />}
                        {profile.is_admin ? '관리자' : '일반 사용자'}
                      </Badge>

                      {!isCurrentUser && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 cursor-pointer gap-1 text-xs"
                            disabled={setAdminStatus.isPending}
                            onClick={() => handleToggleAdmin(profile.id, profile.is_admin)}
                          >
                            {setAdminStatus.isPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : profile.is_admin ? (
                              <ShieldOff className="h-3.5 w-3.5" />
                            ) : (
                              <ShieldCheck className="h-3.5 w-3.5" />
                            )}
                            {profile.is_admin ? '해제' : '승격'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive h-8 cursor-pointer gap-1 text-xs"
                            onClick={() => openDeleteDialog(profile)}
                          >
                            <UserX className="h-3.5 w-3.5" />
                            강제 탈퇴
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-dashed px-4 py-3 pl-12">
                      {userMemberships.length > 0 ? (
                        <ul className="space-y-1.5">
                          {userMemberships.map((m) => (
                            <li
                              key={m.project_id}
                              className="hover:bg-muted/50 flex items-center justify-between rounded-md px-2 py-1.5 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <FolderOpen className="text-muted-foreground h-3.5 w-3.5" />
                                <span className="text-sm">{m.project_name}</span>
                              </div>
                              <Badge variant={ROLE_BADGE_VARIANT[m.role]} className="text-xs">
                                {ROLE_LABELS[m.role]}
                              </Badge>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground py-1 text-sm">
                          참여 중인 프로젝트 없음
                        </p>
                      )}

                      {userMessage && (
                        <div className="mt-3 space-y-2 border-t border-dashed pt-3">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="text-muted-foreground mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="bg-muted rounded-lg px-3 py-2">
                                <p className="text-sm break-words whitespace-pre-wrap">
                                  {userMessage.message}
                                </p>
                              </div>
                              <p className="text-muted-foreground mt-1 text-xs">
                                {new Date(userMessage.created_at).toLocaleDateString('ko-KR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                          {!userMessage.is_read && (
                            <div className="flex justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 gap-1 text-xs"
                                disabled={markMessageRead.isPending}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  markMessageRead.mutate(userMessage.id)
                                }}
                              >
                                {markMessageRead.isPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <CheckCheck className="h-3 w-3" />
                                )}
                                읽음
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 1단계: 강제 탈퇴 경고 */}
      <AlertDialog
        open={deleteTarget !== null && deleteStep === 1}
        onOpenChange={(open) => {
          if (!open) closeDeleteDialog()
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>강제 탈퇴</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  정말로 <strong>{deleteTarget?.name}</strong>님을 강제 탈퇴시키겠습니까?
                </p>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  <li>이 작업은 되돌릴 수 없습니다</li>
                  <li>사용자의 소유 프로젝트와 관련 데이터가 모두 삭제됩니다</li>
                  <li>다른 프로젝트에서의 참여 기록이 정리됩니다</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
              onClick={(e) => {
                e.preventDefault()
                setDeleteStep(2)
              }}
            >
              탈퇴 진행
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 2단계: 이메일 확인 */}
      <AlertDialog
        open={deleteTarget !== null && deleteStep === 2}
        onOpenChange={(open) => {
          if (!open) closeDeleteDialog()
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>최종 확인</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>확인을 위해 아래에 사용자의 이메일을 입력하세요.</p>
                <p className="text-foreground font-mono text-sm font-medium">
                  {deleteTarget?.email}
                </p>
                <Input
                  placeholder="이메일을 입력하세요"
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  autoFocus
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer" onClick={() => setDeleteStep(1)}>
              뒤로
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
              disabled={confirmEmail !== deleteTarget?.email || forceDeleteUser.isPending}
              onClick={(e) => {
                e.preventDefault()
                handleDeleteConfirm()
              }}
            >
              {forceDeleteUser.isPending ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : null}
              탈퇴
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
