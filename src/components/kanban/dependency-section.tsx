'use client'

import { useMemo, useState } from 'react'
import { ArrowRight, Link2, Plus, Trash2, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/hooks/use-auth'
import { DEPENDENCY_DIRECTION } from '@/lib/constants'
import { useDependencies, useCreateDependency, useDeleteDependency } from '@/queries/use-dependencies'
import { useTasks } from '@/queries/use-tasks'

interface DependencySectionProps {
  taskId: string
  projectId: string
  canEdit: boolean
}

export function DependencySection({ taskId, projectId, canEdit }: DependencySectionProps) {
  const { user } = useAuth()
  const { data: dependencies } = useDependencies(projectId)
  const { data: tasks } = useTasks(projectId)
  const createMutation = useCreateDependency(projectId)
  const deleteMutation = useDeleteDependency(projectId)

  const [showAdd, setShowAdd] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [direction, setDirection] = useState<string>(DEPENDENCY_DIRECTION.BLOCKS)

  // 이 태스크가 차단하는 태스크 목록 (blocking_task_id === taskId)
  const blockingDeps = useMemo(() =>
    dependencies?.filter((d) => d.blocking_task_id === taskId) ?? [],
  [dependencies, taskId])

  // 이 태스크를 차단하는 태스크 목록 (blocked_task_id === taskId)
  const blockedByDeps = useMemo(() =>
    dependencies?.filter((d) => d.blocked_task_id === taskId) ?? [],
  [dependencies, taskId])

  const totalCount = blockingDeps.length + blockedByDeps.length

  // 이미 연결된 태스크 ID Set (중복 추가 방지)
  const connectedTaskIds = useMemo(() => {
    const ids = new Set<string>([taskId])
    for (const d of blockingDeps) ids.add(d.blocked_task_id)
    for (const d of blockedByDeps) ids.add(d.blocking_task_id)
    return ids
  }, [taskId, blockingDeps, blockedByDeps])

  // 검색 필터링된 선택 가능한 태스크
  const selectableTasks = useMemo(() => {
    if (!tasks) return []
    return tasks.filter((t) =>
      !connectedTaskIds.has(t.id) &&
      t.title.toLowerCase().includes(searchText.toLowerCase()),
    )
  }, [tasks, connectedTaskIds, searchText])

  const getTaskTitle = (depTaskId: string) =>
    tasks?.find((t) => t.id === depTaskId)?.title ?? '(삭제된 태스크)'

  const handleAdd = (targetTaskId: string) => {
    if (!user) return

    const input = direction === DEPENDENCY_DIRECTION.BLOCKS
      ? { project_id: projectId, blocking_task_id: taskId, blocked_task_id: targetTaskId, created_by: user.id }
      : { project_id: projectId, blocking_task_id: targetTaskId, blocked_task_id: taskId, created_by: user.id }

    createMutation.mutate(input, {
      onSuccess: () => {
        setShowAdd(false)
        setSearchText('')
      },
    })
  }

  const handleDelete = (dependencyId: string) => {
    deleteMutation.mutate(dependencyId)
  }

  return (
    <div className="space-y-3">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 className="text-muted-foreground h-4 w-4" />
          <span className="text-sm font-medium">
            의존성 ({totalCount})
          </span>
        </div>
        {canEdit && !showAdd && (
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => setShowAdd(true)}>
            <Plus className="h-3 w-3" />
            추가
          </Button>
        )}
      </div>

      {/* 이 태스크가 차단하는 목록 */}
      {blockingDeps.length > 0 && (
        <div className="space-y-1">
          <span className="text-muted-foreground text-xs font-medium">차단 중 (Blocks)</span>
          <ul className="space-y-1">
            {blockingDeps.map((dep) => (
              <DependencyItem
                key={dep.id}
                label={getTaskTitle(dep.blocked_task_id)}
                onDelete={canEdit ? () => handleDelete(dep.id) : undefined}
              />
            ))}
          </ul>
        </div>
      )}

      {/* 이 태스크를 차단하는 목록 */}
      {blockedByDeps.length > 0 && (
        <div className="space-y-1">
          <span className="text-muted-foreground text-xs font-medium">차단됨 (Blocked by)</span>
          <ul className="space-y-1">
            {blockedByDeps.map((dep) => (
              <DependencyItem
                key={dep.id}
                label={getTaskTitle(dep.blocking_task_id)}
                onDelete={canEdit ? () => handleDelete(dep.id) : undefined}
              />
            ))}
          </ul>
        </div>
      )}

      {/* 추가 UI */}
      {showAdd && canEdit && (
        <div className="space-y-2 rounded-md border p-2">
          <div className="flex items-center gap-2">
            <Select value={direction} onValueChange={setDirection}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={DEPENDENCY_DIRECTION.BLOCKS}>차단 (Blocks)</SelectItem>
                <SelectItem value={DEPENDENCY_DIRECTION.BLOCKED_BY}>차단됨 (Blocked by)</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => { setShowAdd(false); setSearchText('') }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <Input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="태스크 검색..."
            className="h-8 text-sm"
            autoFocus
          />
          {selectableTasks.length > 0 ? (
            <ul className="max-h-40 space-y-0.5 overflow-y-auto">
              {selectableTasks.slice(0, 10).map((t) => (
                <li key={t.id}>
                  <button
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                    onClick={() => handleAdd(t.id)}
                    disabled={createMutation.isPending}
                  >
                    <ArrowRight className="text-muted-foreground h-3 w-3 shrink-0" />
                    <span className="truncate">{t.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground px-2 py-1 text-xs">
              {searchText ? '검색 결과가 없습니다' : '추가 가능한 태스크가 없습니다'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function DependencyItem({ label, onDelete }: { label: string; onDelete?: () => void }) {
  return (
    <li className="group flex items-center gap-2 rounded-md px-1 py-1 hover:bg-accent/50">
      <Badge variant="outline" className="max-w-full truncate text-xs font-normal">
        {label}
      </Badge>
      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
          onClick={onDelete}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
    </li>
  )
}
