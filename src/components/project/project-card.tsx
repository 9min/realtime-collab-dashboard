'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Users, MoreHorizontal, Pencil, Trash2, Loader2 } from 'lucide-react'

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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MEMBER_ROLE } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { ProjectWithMemberCount } from '@/services/project-service'

const PROJECT_BORDER_COLORS = [
  'border-l-blue-500 dark:border-l-blue-400',
  'border-l-emerald-500 dark:border-l-emerald-400',
  'border-l-violet-500 dark:border-l-violet-400',
  'border-l-orange-500 dark:border-l-orange-400',
  'border-l-rose-500 dark:border-l-rose-400',
  'border-l-cyan-500 dark:border-l-cyan-400',
]

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

interface ProjectCardProps {
  project: ProjectWithMemberCount
  onEdit: (project: ProjectWithMemberCount) => void
  onDelete: (projectId: string) => void
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const nameHash = useMemo(() => hashString(project.id), [project.id])
  const role = project.current_user_role
  const isOwnerOrAdmin = role === MEMBER_ROLE.OWNER || role === MEMBER_ROLE.ADMIN
  const isOwner = role === MEMBER_ROLE.OWNER

  const handleClick = () => {
    if (isDeleting) return
    router.push(`/projects/${project.id}`)
  }

  const handleDelete = () => {
    setIsDeleting(true)
    onDelete(project.id)
  }

  // 생성일 표시 (YYYY.MM.DD 형식)
  const formattedDate = useMemo(() => {
    return new Intl.DateTimeFormat('ko', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(project.created_at))
  }, [project.created_at])

  return (
    <Card
      className={cn(
        'group cursor-pointer border-l-4 transition-all',
        PROJECT_BORDER_COLORS[nameHash % PROJECT_BORDER_COLORS.length],
        isDeleting
          ? 'pointer-events-none opacity-50'
          : 'hover:border-primary/50 hover:shadow-md',
      )}
      onClick={handleClick}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="line-clamp-1 text-base font-semibold">
          {project.name}
        </CardTitle>
        {isOwnerOrAdmin && (
          <AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="프로젝트 메뉴"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => onEdit(project)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  수정
                </DropdownMenuItem>
                {isOwner && (
                  <>
                    <DropdownMenuSeparator />
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        disabled={isDeleting}
                        className="text-destructive focus:text-destructive"
                        onSelect={(e) => e.preventDefault()}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        삭제
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
              <AlertDialogHeader>
                <AlertDialogTitle>프로젝트를 삭제하시겠습니까?</AlertDialogTitle>
                <AlertDialogDescription>
                  &quot;{project.name}&quot; 프로젝트와 모든 데이터(태스크, 컬럼, 멤버)가 영구 삭제됩니다.
                  <br />이 작업은 되돌릴 수 없습니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      삭제 중...
                    </>
                  ) : (
                    '삭제'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground line-clamp-2 text-sm">
          {project.description || '설명 없음'}
        </p>
      </CardContent>
      <CardFooter className="flex items-center gap-4 text-xs">
        <div className="text-muted-foreground flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          <span>{project.member_count}명</span>
        </div>
        <div className="text-muted-foreground flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          <span>{formattedDate}</span>
        </div>
        {isOwnerOrAdmin && (
          <Badge variant="secondary" className="ml-auto text-xs">
            {isOwner ? '소유자' : '관리자'}
          </Badge>
        )}
      </CardFooter>
    </Card>
  )
}
