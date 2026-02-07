'use client'

import { use, type ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ArrowLeft, LayoutDashboard, Columns3, Activity, GanttChart, Settings } from 'lucide-react'

import { OnlineUsers } from '@/components/presence/online-users'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { MEMBER_ROLE } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { usePresence } from '@/hooks/use-presence'
import { useProject, useProjectMembers } from '@/queries/use-projects'

interface ProjectLayoutProps {
  children: ReactNode
  params: Promise<{ projectId: string }>
}

const ALL_NAV_ITEMS = [
  { label: '대시보드', href: '', icon: LayoutDashboard },
  { label: '칸반 보드', href: '/board', icon: Columns3 },
  { label: '간트 차트', href: '/gantt', icon: GanttChart },
  { label: '활동 로그', href: '/activity', icon: Activity },
  { label: '설정', href: '/settings', icon: Settings, adminOnly: true },
] as const

export default function ProjectLayout({ children, params }: ProjectLayoutProps) {
  const { projectId } = use(params)
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { data: project, isLoading } = useProject(projectId)
  const { data: members } = useProjectMembers(projectId)
  const { onlineUsers } = usePresence(projectId)

  // 뷰어는 설정 탭 숨김
  const currentRole = members?.find((m) => m.user_id === user?.id)?.role
  const isViewer = currentRole === MEMBER_ROLE.VIEWER
  const navItems = ALL_NAV_ITEMS.filter((item) => !('adminOnly' in item && item.adminOnly && isViewer))

  const basePath = `/projects/${projectId}`

  return (
    <div className="space-y-6">
      {/* 프로젝트 헤더 */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => router.push('/projects')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          {isLoading ? (
            <div className="bg-muted h-7 w-48 animate-pulse rounded" />
          ) : (
            <>
              <h1 className="text-xl font-bold">{project?.name ?? '프로젝트'}</h1>
              {project?.description && (
                <p className="text-muted-foreground text-sm">{project.description}</p>
              )}
            </>
          )}
        </div>
        {/* 온라인 유저 */}
        <OnlineUsers users={onlineUsers} />
      </div>

      {/* 서브 네비게이션 */}
      <nav className="border-border flex gap-1 border-b">
        {navItems.map(({ label, href, icon: Icon }) => {
          const fullPath = `${basePath}${href}`
          const isActive = pathname === fullPath

          return (
            <button
              key={href}
              onClick={() => router.push(fullPath)}
              className={cn(
                'text-muted-foreground hover:text-foreground flex items-center gap-2 border-b-2 border-transparent px-4 py-2 text-sm font-medium transition-colors',
                isActive && 'text-foreground border-primary',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          )
        })}
      </nav>

      {/* 페이지 콘텐츠 */}
      {children}
    </div>
  )
}
