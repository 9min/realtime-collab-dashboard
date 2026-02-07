'use client'

import { usePathname, useRouter } from 'next/navigation'
import { FolderKanban, LayoutDashboard, Settings, PanelLeftClose, PanelLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { MEMBER_ROLE } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useProjectMembers } from '@/queries/use-projects'
import { useUiStore } from '@/stores/ui-store'

const NAV_ITEMS = [
  { label: '프로젝트', href: '/projects', icon: FolderKanban },
] as const

interface SidebarProps {
  /** 프로젝트 컨텍스트 내 서브 네비게이션 */
  projectId?: string
}

export function Sidebar({ projectId }: SidebarProps) {
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { isSidebarOpen, toggleSidebar } = useUiStore()
  const { data: members } = useProjectMembers(projectId ?? '')

  // 뷰어는 설정 메뉴 숨김
  const currentRole = members?.find((m) => m.user_id === user?.id)?.role
  const isViewer = currentRole === MEMBER_ROLE.VIEWER

  // 프로젝트 컨텍스트가 있으면 프로젝트 내부 네비게이션 표시
  const baseProjectNav = projectId
    ? [
        { label: '대시보드', href: `/projects/${projectId}`, icon: LayoutDashboard },
        { label: '칸반 보드', href: `/projects/${projectId}/board`, icon: FolderKanban },
      ]
    : []
  const projectNavItems = projectId && !isViewer
    ? [...baseProjectNav, { label: '설정', href: `/projects/${projectId}/settings`, icon: Settings }]
    : baseProjectNav

  const allItems = [...NAV_ITEMS, ...projectNavItems]

  return (
    <aside
      className={cn(
        'border-border bg-background flex flex-col border-r transition-all duration-200',
        isSidebarOpen ? 'w-56' : 'w-14',
      )}
    >
      {/* 토글 버튼 */}
      <div className="flex h-14 items-center justify-end px-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleSidebar}>
          {isSidebarOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 space-y-1 px-2">
        {allItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href

          return (
            <Button
              key={href}
              variant={isActive ? 'secondary' : 'ghost'}
              className={cn('w-full justify-start gap-3', !isSidebarOpen && 'justify-center px-0')}
              onClick={() => router.push(href)}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {isSidebarOpen && <span className="truncate">{label}</span>}
            </Button>
          )
        })}
      </nav>
    </aside>
  )
}
