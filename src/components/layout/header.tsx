'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

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

import { ThemeToggle } from './theme-toggle'

export function Header() {
  const { user, isAuthenticated, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  // 아바타 폴백: 이름 첫 글자 또는 이메일 첫 글자
  const fallbackInitial =
    user?.user_metadata?.full_name?.[0] ?? user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <header className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 flex h-14 items-center justify-between border-b px-6 backdrop-blur">
      <h2 className="text-lg font-semibold">Realtime Collab Dashboard</h2>
      <div className="flex items-center gap-2">
        <ThemeToggle />

        {isAuthenticated && user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
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
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                로그아웃
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}
