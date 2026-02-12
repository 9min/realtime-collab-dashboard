'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BarChart3, Keyboard, ListTodo, LogOut, ShieldCheck, UserCog } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/use-auth'
import { useNotificationRealtime } from '@/hooks/use-notification-realtime'
import { useMyProfile } from '@/queries/use-admin'
import { useProfile } from '@/queries/use-profile'

import { useDemoModeStore } from '@/stores/demo-mode-store'
import { useShortcutHelpStore } from '@/stores/shortcut-help-store'

import { ProfileEditDialog } from '../profile/profile-edit-dialog'
import { NotificationBell } from '../notification/notification-bell'
import { SearchCommand } from '../search/search-command'
import { SearchTrigger } from '../search/search-trigger'
import { ShortcutHelpDialog } from './shortcut-help-dialog'
import { ThemeToggle } from './theme-toggle'

export function Header() {
  const { user, isAuthenticated, signOut } = useAuth()
  useNotificationRealtime()
  const { data: myProfile } = useMyProfile()
  const { data: profile } = useProfile()
  const router = useRouter()
  const toggleShortcutHelp = useShortcutHelpStore((s) => s.toggle)
  const [profileOpen, setProfileOpen] = useState(false)

  const isDemoMode = useDemoModeStore((s) => s.isDemoMode)
  const exitDemoMode = useDemoModeStore((s) => s.exitDemoMode)

  const handleSignOut = async () => {
    if (isDemoMode) {
      exitDemoMode()
      router.push('/login')
      return
    }
    await signOut()
    router.push('/login')
  }

  // 아바타: profiles 테이블 데이터만 사용 (OAuth 프로필 사진 자동 노출 방지)
  const avatarUrl = profile?.avatar_url ?? null
  const displayName = profile?.full_name ?? user?.user_metadata?.full_name ?? '사용자'
  const fallbackInitial =
    profile?.full_name?.[0] ?? user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between bg-primary px-3 shadow-md sm:px-6 dark:bg-primary">
      <nav className="flex min-w-0 items-center gap-2 sm:gap-3">
        <Link
          href="/projects"
          className="shrink-0 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-80 sm:text-lg"
        >
          <span className="sm:hidden">협업 도구</span>
          <span className="hidden sm:inline">실시간 협업 일정관리 도구</span>
        </Link>
        {(isAuthenticated || isDemoMode) && (
          <Link
            href="/my-tasks"
            className="flex shrink-0 items-center gap-1.5 rounded-md bg-primary-foreground/15 px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/25"
          >
            <ListTodo className="h-4 w-4" />
            <span className="hidden sm:inline">내 할 일</span>
          </Link>
        )}
        {isDemoMode && (
          <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/50 dark:text-amber-200">
            데모 모드
          </Badge>
        )}
      </nav>
      <div className="flex items-center gap-2 text-primary-foreground">
        <SearchTrigger />
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 hover:bg-primary-foreground/10"
          onClick={toggleShortcutHelp}
          title="키보드 단축키 (Shift+?)"
          aria-label="키보드 단축키"
        >
          <Keyboard className="h-5 w-5" />
        </Button>
        <ThemeToggle />
        <NotificationBell />
        <SearchCommand />
        <ShortcutHelpDialog />

        {(isAuthenticated || isDemoMode) && (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:bg-primary-foreground/10">
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={avatarUrl ?? undefined}
                      alt={displayName}
                    />
                    <AvatarFallback>{fallbackInitial}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{displayName}</p>
                  <p className="text-muted-foreground text-xs">{user?.email ?? 'demo@example.com'}</p>
                </div>
                <DropdownMenuSeparator />
                {!isDemoMode && (
                  <DropdownMenuItem onClick={() => setProfileOpen(true)}>
                    <UserCog className="mr-2 h-4 w-4" />
                    프로필 설정
                  </DropdownMenuItem>
                )}
                {!isDemoMode && myProfile?.is_admin && (
                  <>
                    <DropdownMenuItem onClick={() => router.push('/admin')}>
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      사용자 관리
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/admin/monitoring')}>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      서비스 통계
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {isDemoMode ? '데모 종료' : '로그아웃'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {!isDemoMode && (
              <ProfileEditDialog open={profileOpen} onOpenChange={setProfileOpen} />
            )}
          </>
        )}
      </div>
    </header>
  )
}
