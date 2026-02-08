'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, UserCog } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/use-auth'

import { ProfileEditDialog } from '../profile/profile-edit-dialog'
import { NotificationBell } from '../notification/notification-bell'
import { ThemeToggle } from './theme-toggle'

export function Header() {
  const { user, isAuthenticated, signOut } = useAuth()
  const router = useRouter()
  const [profileOpen, setProfileOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  // 아바타 폴백: 이름 첫 글자 또는 이메일 첫 글자
  const fallbackInitial =
    user?.user_metadata?.full_name?.[0] ?? user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between bg-gradient-to-r from-slate-900 to-blue-900 px-6 shadow-md dark:from-slate-950 dark:to-blue-950">
      <button
        onClick={() => router.push('/projects')}
        className="cursor-pointer text-lg font-semibold text-white transition-opacity hover:opacity-80"
      >
        실시간 협업보드
      </button>
      <div className="flex items-center gap-2 text-white">
        <ThemeToggle />
        <NotificationBell />

        {isAuthenticated && user && (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:bg-white/10">
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={user.user_metadata?.avatar_url}
                      alt={user.user_metadata?.full_name ?? ''}
                    />
                    <AvatarFallback>{fallbackInitial}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.user_metadata?.full_name ?? '사용자'}</p>
                  <p className="text-muted-foreground text-xs">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setProfileOpen(true)}>
                  <UserCog className="mr-2 h-4 w-4" />
                  프로필 설정
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <ProfileEditDialog open={profileOpen} onOpenChange={setProfileOpen} />
          </>
        )}
      </div>
    </header>
  )
}
