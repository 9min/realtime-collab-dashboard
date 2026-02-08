'use client'

import { Loader2, ShieldCheck, ShieldOff } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useMyProfile, useAllUsers, useSetAdminStatus } from '@/queries/use-admin'
import { useAuth } from '@/hooks/use-auth'

export default function AdminPage() {
  const { user } = useAuth()
  const { data: myProfile, isLoading: profileLoading } = useMyProfile()
  const { data: users, isLoading: usersLoading } = useAllUsers()
  const setAdminStatus = useSetAdminStatus()

  const isLoading = profileLoading || usersLoading

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <h2 className="text-2xl font-bold">사용자 관리</h2>
          <p className="text-muted-foreground mt-1">관리자 권한을 관리합니다</p>
        </div>
        <div className="flex min-h-[300px] items-center justify-center">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (!myProfile?.is_admin) {
    return (
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <h2 className="text-2xl font-bold">사용자 관리</h2>
          <p className="text-muted-foreground mt-1">관리자 권한을 관리합니다</p>
        </div>
        <div className="rounded-xl border bg-destructive/10 p-6">
          <p className="text-destructive">관리자 권한이 필요합니다.</p>
        </div>
      </div>
    )
  }

  const handleToggleAdmin = (userId: string, currentIsAdmin: boolean) => {
    setAdminStatus.mutate({ userId, isAdmin: !currentIsAdmin })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold">사용자 관리</h2>
        <p className="text-muted-foreground mt-1">관리자 권한을 관리합니다</p>
      </div>

      <div className="rounded-xl border p-6">
        <h3 className="mb-4 text-lg font-semibold">전체 사용자</h3>
        <div className="space-y-3">
          {users?.map((profile) => {
            const isCurrentUser = profile.id === user?.id
            const initial = profile.full_name?.[0] ?? profile.email[0]?.toUpperCase() ?? '?'

            return (
              <div
                key={profile.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.full_name ?? ''} />
                    <AvatarFallback>{initial}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {profile.full_name ?? '이름 없음'}
                      {isCurrentUser && (
                        <span className="text-muted-foreground ml-1 text-xs">(나)</span>
                      )}
                    </p>
                    <p className="text-muted-foreground text-xs">{profile.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {profile.is_admin ? (
                    <Badge variant="default" className="gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      관리자
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1">
                      일반 사용자
                    </Badge>
                  )}

                  {!isCurrentUser && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={setAdminStatus.isPending}
                      onClick={() => handleToggleAdmin(profile.id, profile.is_admin)}
                    >
                      {profile.is_admin ? (
                        <>
                          <ShieldOff className="mr-1 h-4 w-4" />
                          해제
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="mr-1 h-4 w-4" />
                          승격
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
