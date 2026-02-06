'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Users, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

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
import { useAuth } from '@/hooks/use-auth'
import type { ProjectWithMemberCount } from '@/services/project-service'

interface ProjectCardProps {
  project: ProjectWithMemberCount
  onEdit: (project: ProjectWithMemberCount) => void
  onDelete: (projectId: string) => void
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [isDeleting, setIsDeleting] = useState(false)
  const isOwner = user?.id === project.owner_id

  const handleClick = () => {
    router.push(`/projects/${project.id}`)
  }

  const handleDelete = async () => {
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
      className="hover:border-primary/50 group cursor-pointer transition-colors"
      onClick={handleClick}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="line-clamp-1 text-base font-semibold">
          {project.name}
        </CardTitle>
        {isOwner && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => onEdit(project)}>
                <Pencil className="mr-2 h-4 w-4" />
                수정
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
        {isOwner && (
          <Badge variant="secondary" className="ml-auto text-xs">
            소유자
          </Badge>
        )}
      </CardFooter>
    </Card>
  )
}
