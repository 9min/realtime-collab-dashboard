'use client'

import { use, useCallback, useEffect, useMemo, type ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, BarChart3 as BarChartIcon, LayoutDashboard, Columns3, Activity, GanttChart, Calendar, Settings } from 'lucide-react'

import { OnlineUsers } from '@/components/presence/online-users'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { MEMBER_ROLE } from '@/lib/constants'
import { SHORTCUT_KEYS } from '@/lib/keyboard-shortcuts'
import { cn } from '@/lib/utils'
import { usePresence } from '@/hooks/use-presence'
import { projectKeys, useProject, useProjectMembers } from '@/queries/use-projects'
import { useShortcutHelpStore } from '@/stores/shortcut-help-store'

interface ProjectLayoutProps {
  children: ReactNode
  params: Promise<{ projectId: string }>
}

const PROJECT_POLL_INTERVAL = 15_000 // 15초마다 프로젝트 존재 여부 확인

const ALL_NAV_ITEMS = [
  { label: '대시보드', href: '', icon: LayoutDashboard },
  { label: '칸반 보드', href: '/board', icon: Columns3 },
  { label: '간트 차트', href: '/gantt', icon: GanttChart },
  { label: '캘린더', href: '/calendar', icon: Calendar },
  { label: '워크로드', href: '/workload', icon: BarChartIcon },
  { label: '활동 로그', href: '/activity', icon: Activity },
  { label: '설정', href: '/settings', icon: Settings, adminOnly: true },
] as const

export default function ProjectLayout({ children, params }: ProjectLayoutProps) {
  const { projectId } = use(params)
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const { data: project, isLoading, isError } = useProject(projectId)
  const { data: members } = useProjectMembers(projectId)
  const { onlineUsers } = usePresence(projectId)

  const basePath = `/projects/${projectId}`

  // 키보드 단축키
  const toggleHelp = useShortcutHelpStore((s) => s.toggle)
  const shortcuts = useMemo(
    () => [
      { key: SHORTCUT_KEYS.HELP, shiftKey: true, action: toggleHelp },
      { key: SHORTCUT_KEYS.DASHBOARD, action: () => router.push(basePath) },
      { key: SHORTCUT_KEYS.KANBAN, action: () => router.push(`${basePath}/board`) },
      { key: SHORTCUT_KEYS.GANTT, action: () => router.push(`${basePath}/gantt`) },
      { key: SHORTCUT_KEYS.CALENDAR, action: () => router.push(`${basePath}/calendar`) },
      { key: SHORTCUT_KEYS.ACTIVITY, action: () => router.push(`${basePath}/activity`) },
    ],
    [toggleHelp, router, basePath],
  )
  useKeyboardShortcuts(shortcuts)

  // 프로젝트 삭제/접근 불가 감지
  // TanStack Query는 에러 후에도 이전 data를 유지 → project가 있으면 한 번은 로드 성공한 것
  // - isError + project 존재 → 삭제 안내 다이얼로그
  // - isError + project 없음 → 최초 로드 실패, 조용히 리다이렉트
  const showDeletedDialog = isError && !!project

  useEffect(() => {
    if (isError && !project) {
      router.replace('/projects')
    }
  }, [isError, project, router])

  // 프로젝트 존재 여부 주기적 확인 (Realtime이 RLS로 이벤트 전달 못할 때 대비)
  useEffect(() => {
    if (!projectId || showDeletedDialog) return

    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) })
    }, PROJECT_POLL_INTERVAL)

    return () => clearInterval(interval)
  }, [projectId, queryClient, showDeletedDialog])

  // 뮤테이션 실패 시 즉시 프로젝트 존재 여부 재확인
  // (삭제된 프로젝트에서 태스크 생성 등 시도 → 에러 → 프로젝트 쿼리 재검증)
  useEffect(() => {
    if (showDeletedDialog) return

    const unsubscribe = queryClient.getMutationCache().subscribe((event) => {
      if (event.type === 'updated' && event.mutation.state.status === 'error') {
        queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) })
      }
    })

    return unsubscribe
  }, [queryClient, projectId, showDeletedDialog])

  // 삭제 감지 시 프로젝트 목록 캐시 제거 (메인 화면에서 삭제된 프로젝트가 보이지 않도록)
  useEffect(() => {
    if (showDeletedDialog) {
      queryClient.removeQueries({ queryKey: projectKeys.all })
    }
  }, [showDeletedDialog, queryClient])

  // 뷰어는 설정 탭 숨김
  const currentRole = members?.find((m) => m.user_id === user?.id)?.role
  const isViewer = currentRole === MEMBER_ROLE.VIEWER
  const navItems = ALL_NAV_ITEMS.filter((item) => !('adminOnly' in item && item.adminOnly && isViewer))

  const activeTabRef = useCallback((node: HTMLButtonElement | null) => {
    if (node) {
      node.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* 프로젝트 삭제 안내 다이얼로그 */}
      <AlertDialog open={showDeletedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>프로젝트가 삭제되었습니다</AlertDialogTitle>
            <AlertDialogDescription>
              이 프로젝트가 삭제되어 더 이상 접근할 수 없습니다.
              프로젝트 목록으로 이동합니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => router.replace('/projects')}>
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 프로젝트 헤더 */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => router.push('/projects')}
          aria-label="프로젝트 목록으로 돌아가기"
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
      <nav className="bg-card flex gap-1 overflow-x-auto rounded-lg border p-1 shadow-sm scrollbar-none" role="tablist" aria-label="프로젝트 네비게이션">
        {navItems.map(({ label, href, icon: Icon }) => {
          const fullPath = `${basePath}${href}`
          const isActive = pathname === fullPath

          return (
            <button
              key={href}
              ref={isActive ? activeTabRef : undefined}
              onClick={() => router.push(fullPath)}
              role="tab"
              aria-selected={isActive}
              className={cn(
                'text-muted-foreground hover:text-foreground flex shrink-0 cursor-pointer items-center gap-2 rounded-md px-4 py-2 text-sm font-medium outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                isActive && 'bg-primary text-primary-foreground shadow-sm',
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          )
        })}
      </nav>

      {/* 페이지 콘텐츠 */}
      {children}
    </div>
  )
}
