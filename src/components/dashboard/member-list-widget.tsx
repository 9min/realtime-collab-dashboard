'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useProjectMembers } from '@/queries/use-projects'

interface MemberListWidgetProps {
  projectId: string
}

const ROLE_LABELS: Record<string, string> = {
  owner: '소유자',
  admin: '관리자',
  member: '멤버',
  viewer: '뷰어',
}

const ROLE_VARIANTS: Record<string, 'default' | 'secondary' | 'outline'> = {
  owner: 'default',
  admin: 'secondary',
  member: 'outline',
  viewer: 'outline',
}

export function MemberListWidget({ projectId }: MemberListWidgetProps) {
  const { data: members, isLoading } = useProjectMembers(projectId)

  if (isLoading) {
    return (
      <div className="space-y-3 p-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="bg-muted h-8 w-8 animate-pulse rounded-full" />
            <div className="bg-muted h-4 flex-1 animate-pulse rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (!members || members.length === 0) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
        멤버가 없습니다
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 p-1">
        {members.map((member) => {
          const initials = (member.profiles.full_name ?? member.profiles.email)
            .slice(0, 2)
            .toUpperCase()

          return (
            <div key={member.id} className="flex items-center gap-3 rounded-md p-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={member.profiles.avatar_url ?? undefined} />
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {member.profiles.full_name ?? member.profiles.email}
                </p>
              </div>
              <Badge variant={ROLE_VARIANTS[member.role] ?? 'outline'} className="shrink-0 text-xs">
                {ROLE_LABELS[member.role] ?? member.role}
              </Badge>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}
