'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { DragDropContext, type DropResult } from '@hello-pangea/dnd'
import { Plus } from 'lucide-react'

import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useAuth } from '@/hooks/use-auth'
import {
  DEFAULT_COLUMNS,
  MEMBER_ROLE,
  PRIORITY_LABELS,
  SWIMLANE_MODE,
  TASK_PRIORITY,
} from '@/lib/constants'
import { filterTasks } from '@/lib/task-filter'
import {
  useColumns,
  useCreateColumn,
  useUpdateColumn,
  useDeleteColumn,
} from '@/queries/use-columns'
import { useDependencies } from '@/queries/use-dependencies'
import { useLabels, useTaskLabels } from '@/queries/use-labels'
import { useProject, useProjectMembers } from '@/queries/use-projects'
import { useProjectRecurrences } from '@/queries/use-recurrences'
import { useProjectSubtasks } from '@/queries/use-subtasks'
import { useProjectTaskAssignees } from '@/queries/use-task-assignees'
import { useTasks, useMoveTask } from '@/queries/use-tasks'
import { useKanbanFilterStore } from '@/stores/kanban-filter-store'
import type { Tables } from '@/types/database'
import type { TaskPriority } from '@/types/common'
import type { KanbanColumnWithTasks } from '@/types/kanban'

import { SprintHeader } from '@/components/sprint/sprint-header'

import { CreateTaskForm } from './create-task-form'
import { KanbanColumn } from './kanban-column'
import { SwimlaneBoard } from './swimlane-board'
import { TaskFilterBar } from './task-filter-bar'
import { WipLimitDialog } from './wip-limit-dialog'

const TaskDetailDialog = dynamic(() =>
  import('./task-detail-dialog').then((mod) => ({ default: mod.TaskDetailDialog })),
)

interface KanbanBoardProps {
  projectId: string
}

export function KanbanBoard({ projectId }: KanbanBoardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { data: project } = useProject(projectId)
  const { data: columns, isLoading: columnsLoading } = useColumns(projectId)
  const { data: tasks, isLoading: tasksLoading } = useTasks(projectId)
  const { data: members } = useProjectMembers(projectId)
  const moveTaskMutation = useMoveTask(projectId)
  const createColumnMutation = useCreateColumn(projectId)
  const updateColumnMutation = useUpdateColumn(projectId)
  const deleteColumnMutation = useDeleteColumn(projectId)

  // 현재 유저 역할 확인 — 뷰어는 수정 불가
  const currentRole = members?.find((m) => m.user_id === user?.id)?.role
  const canEdit = currentRole !== MEMBER_ROLE.VIEWER
  const canDeleteAll = currentRole === MEMBER_ROLE.OWNER || currentRole === MEMBER_ROLE.ADMIN

  // 프로젝트 기능 설정
  const projectFeatures = useMemo(
    () => ({
      feature_labels: project?.feature_labels ?? false,
      feature_subtasks: project?.feature_subtasks ?? false,
      feature_dependencies: project?.feature_dependencies ?? false,
      feature_attachments: project?.feature_attachments ?? false,
      feature_comments: project?.feature_comments ?? false,
      feature_multi_assignees: project?.feature_multi_assignees ?? true,
      feature_time_tracking:
        ((project as unknown as Record<string, unknown>)?.feature_time_tracking as
          | boolean
          | undefined) ?? false,
      feature_custom_fields:
        ((project as unknown as Record<string, unknown>)?.feature_custom_fields as
          | boolean
          | undefined) ?? false,
      feature_sprints:
        ((project as unknown as Record<string, unknown>)?.feature_sprints as boolean | undefined) ??
        false,
    }),
    [project],
  )

  // 라벨 데이터
  const { data: labels } = useLabels(projectId)
  const { data: taskLabelsData } = useTaskLabels(projectId)

  // 의존성 데이터
  const { data: dependencies } = useDependencies(projectId)

  // 반복 태스크 ID Set
  const { data: recurringTaskIds } = useProjectRecurrences(projectId)

  // 서브태스크 데이터 (feature_subtasks가 켜진 경우에만)
  const { data: projectSubtasks } = useProjectSubtasks(projectId, {
    enabled: projectFeatures.feature_subtasks,
  })

  // task→subtasks[] 맵 생성
  const subtaskMap = useMemo(() => {
    const map = new Map<string, NonNullable<typeof projectSubtasks>>()
    if (!projectSubtasks || !projectFeatures.feature_subtasks) return map
    for (const st of projectSubtasks) {
      const existing = map.get(st.task_id)
      if (existing) {
        existing.push(st)
      } else {
        map.set(st.task_id, [st])
      }
    }
    return map
  }, [projectSubtasks, projectFeatures.feature_subtasks])

  // 다중 담당자 데이터
  const { data: projectTaskAssignees } = useProjectTaskAssignees(projectId)

  // task→assignees 맵 생성
  const taskAssigneeMap = useMemo(() => {
    const map = new Map<string, NonNullable<typeof projectTaskAssignees>>()
    if (!projectTaskAssignees) return map
    for (const ta of projectTaskAssignees) {
      const existing = map.get(ta.task_id)
      if (existing) {
        existing.push(ta)
      } else {
        map.set(ta.task_id, [ta])
      }
    }
    return map
  }, [projectTaskAssignees])

  // 완료 컬럼 ID Set
  const doneColumnIds = useMemo(() => {
    const set = new Set<string>()
    if (!columns) return set
    for (const col of columns) {
      if (col.is_done_column) set.add(col.id)
    }
    return set
  }, [columns])

  // task→column 매핑
  const taskColumnMap = useMemo(() => {
    const map = new Map<string, string>()
    if (!tasks) return map
    for (const task of tasks) {
      map.set(task.id, task.column_id)
    }
    return map
  }, [tasks])

  // 선행 작업 대기 중인 태스크 ID Set
  // 선행 작업이 모두 완료 컬럼에 있으면 대기 중 해제
  const blockedTaskIds = useMemo(() => {
    const set = new Set<string>()
    if (!dependencies) return set

    // blocked_task_id별로 모든 blocking_task_id를 그룹핑
    const blockersByTask = new Map<string, string[]>()
    for (const dep of dependencies) {
      const existing = blockersByTask.get(dep.blocked_task_id)
      if (existing) {
        existing.push(dep.blocking_task_id)
      } else {
        blockersByTask.set(dep.blocked_task_id, [dep.blocking_task_id])
      }
    }

    for (const [blockedId, blockerIds] of blockersByTask) {
      const allBlockersDone = blockerIds.every((blockerId) => {
        const columnId = taskColumnMap.get(blockerId)
        return columnId !== undefined && doneColumnIds.has(columnId)
      })
      if (!allBlockersDone) {
        set.add(blockedId)
      }
    }

    return set
  }, [dependencies, taskColumnMap, doneColumnIds])

  // 필터 상태
  const {
    searchText,
    priorities,
    assigneeIds,
    dueDateRange,
    labelIds,
    swimlaneMode,
    setAssigneeIds,
  } = useKanbanFilterStore()

  // URL ?assignee= 파라미터로 담당자 필터 적용 (워크로드 차트에서 이동 시)
  const assigneeParam = searchParams.get('assignee')
  useEffect(() => {
    if (assigneeParam) {
      setAssigneeIds([assigneeParam])
    }
  }, [assigneeParam, setAssigneeIds])

  // 태스크 생성 다이얼로그 상태
  const [createTaskColumnId, setCreateTaskColumnId] = useState<string | null>(null)
  // 태스크 상세 다이얼로그 상태 (수동 클릭)
  const [selectedTask, setSelectedTask] = useState<Tables<'tasks'> | null>(null)
  // WIP 제한 설정 다이얼로그
  const [wipLimitColumnId, setWipLimitColumnId] = useState<string | null>(null)

  // URL 쿼리 파라미터로 태스크 자동 선택 (검색 결과 클릭 시)
  const taskIdParam = searchParams.get('taskId')
  const taskFromUrl = useMemo(() => {
    if (!taskIdParam || !tasks) return null
    return tasks.find((t) => t.id === taskIdParam) ?? null
  }, [taskIdParam, tasks])

  // 다이얼로그에 표시할 태스크: URL 파라미터 우선
  const displayedTask = taskFromUrl ?? selectedTask

  // task→labelIds 맵 생성
  const taskLabelMap = useMemo(() => {
    const map = new Map<string, string[]>()
    if (!taskLabelsData) return map
    for (const tl of taskLabelsData) {
      const existing = map.get(tl.task_id)
      if (existing) {
        existing.push(tl.label_id)
      } else {
        map.set(tl.task_id, [tl.label_id])
      }
    }
    return map
  }, [taskLabelsData])

  // task→user_id[] 맵 (필터용)
  const taskAssigneeUserIds = useMemo(() => {
    const map = new Map<string, string[]>()
    if (!projectTaskAssignees) return map
    for (const ta of projectTaskAssignees) {
      const existing = map.get(ta.task_id)
      if (existing) {
        existing.push(ta.user_id)
      } else {
        map.set(ta.task_id, [ta.user_id])
      }
    }
    return map
  }, [projectTaskAssignees])

  // 컬럼별 태스크 그룹핑 + 필터 적용
  const columnsWithTasks: KanbanColumnWithTasks[] = useMemo(() => {
    if (!columns || !tasks) return []
    const filtered = filterTasks(tasks, {
      searchText,
      priorities,
      assigneeIds,
      dueDateRange,
      labelIds,
      taskLabelMap,
      taskAssigneeUserIds,
    })
    return columns.map((column) => ({
      ...column,
      tasks: filtered
        .filter((t) => t.column_id === column.id)
        .sort((a, b) => a.position - b.position),
    }))
  }, [
    columns,
    tasks,
    searchText,
    priorities,
    assigneeIds,
    dueDateRange,
    labelIds,
    taskLabelMap,
    taskAssigneeUserIds,
  ])

  // 스윔레인 그룹 계산
  const swimlaneGroups = useMemo(() => {
    if (swimlaneMode === SWIMLANE_MODE.NONE || !tasks || !columns) return null

    const filtered = filterTasks(tasks, {
      searchText,
      priorities: priorities as TaskPriority[],
      assigneeIds,
      dueDateRange,
      labelIds,
      taskLabelMap,
      taskAssigneeUserIds,
    })

    if (swimlaneMode === SWIMLANE_MODE.ASSIGNEE) {
      const groups = new Map<string, { label: string; tasks: Tables<'tasks'>[] }>()
      groups.set('__unassigned__', { label: '미배정', tasks: [] })

      for (const member of members ?? []) {
        groups.set(member.user_id, {
          label: member.profiles.full_name ?? member.profiles.email,
          tasks: [],
        })
      }

      for (const task of filtered) {
        const key = task.assignee_id ?? '__unassigned__'
        const group = groups.get(key)
        if (group) {
          group.tasks.push(task)
        } else {
          groups.set(key, { label: '기타', tasks: [task] })
        }
      }

      return Array.from(groups.entries())
        .filter(([, g]) => g.tasks.length > 0)
        .map(([key, g]) => ({ key, label: g.label, tasks: g.tasks }))
    }

    // priority 모드
    const priorityOrder = [
      TASK_PRIORITY.URGENT,
      TASK_PRIORITY.HIGH,
      TASK_PRIORITY.MEDIUM,
      TASK_PRIORITY.LOW,
    ] as const

    return priorityOrder
      .map((p) => ({
        key: p,
        label: PRIORITY_LABELS[p] ?? p,
        tasks: filtered.filter((t) => t.priority === p),
      }))
      .filter((g) => g.tasks.length > 0)
  }, [
    swimlaneMode,
    tasks,
    columns,
    members,
    searchText,
    priorities,
    assigneeIds,
    dueDateRange,
    labelIds,
    taskLabelMap,
    taskAssigneeUserIds,
  ])

  // DnD 완료 핸들러 — 뷰어는 무시, 일반 멤버는 본인 태스크만
  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!canEdit) return
      const { draggableId, source, destination } = result
      if (!destination) return
      // 같은 위치에 드롭하면 무시
      if (source.droppableId === destination.droppableId && source.index === destination.index)
        return

      // 스윔레인 모드에서 droppableId에서 실제 columnId 추출
      const extractColumnId = (droppableId: string) => {
        if (droppableId.startsWith('swimlane::')) {
          const parts = droppableId.split('::')
          return parts[2] // swimlane::groupKey::columnId
        }
        return droppableId
      }

      const sourceColumnId = extractColumnId(source.droppableId)
      const destColumnId = extractColumnId(destination.droppableId)

      // WIP 제한 체크 (다른 컬럼으로 이동할 때만)
      if (sourceColumnId !== destColumnId && columns) {
        const destColumn = columns.find((c) => c.id === destColumnId)
        const wipLimit = destColumn?.wip_limit ?? null
        if (wipLimit !== null) {
          const destTaskCount = tasks?.filter((t) => t.column_id === destColumnId).length ?? 0
          if (destTaskCount >= wipLimit) {
            toast.warning(`이 컬럼의 WIP 제한(${wipLimit})에 도달했습니다`)
            return
          }
        }
      }

      // 일반 멤버: 담당자 없는 태스크 또는 본인 담당 태스크만 이동 가능
      if (!canDeleteAll && tasks) {
        const draggedTask = tasks.find((t) => t.id === draggableId)
        if (draggedTask && draggedTask.assignee_id !== null && draggedTask.assignee_id !== user?.id)
          return
      }

      moveTaskMutation.mutate({
        taskId: draggableId,
        sourceColumnId: sourceColumnId,
        destinationColumnId: destColumnId,
        newPosition: destination.index,
      })
    },
    [canEdit, canDeleteAll, tasks, columns, user?.id, moveTaskMutation],
  )

  // 컬럼 추가
  const handleAddColumn = useCallback(() => {
    if (!columns) return
    const title = `새 컬럼 ${columns.length + 1}`
    createColumnMutation.mutate({ title, position: columns.length })
  }, [columns, createColumnMutation])

  // 컬럼 이름 변경
  const handleRenameColumn = useCallback(
    (columnId: string, title: string) => {
      updateColumnMutation.mutate({ columnId, input: { title } })
    },
    [updateColumnMutation],
  )

  // 컬럼 삭제
  const handleDeleteColumn = useCallback(
    (columnId: string) => {
      deleteColumnMutation.mutate(columnId)
    },
    [deleteColumnMutation],
  )

  // 완료 컬럼 토글
  const handleToggleDone = useCallback(
    (columnId: string, isDone: boolean) => {
      updateColumnMutation.mutate({ columnId, input: { is_done_column: isDone } })
    },
    [updateColumnMutation],
  )

  if (columnsLoading || tasksLoading) {
    return (
      <div className="flex gap-4">
        {Array.from({ length: 4 }).map((_, colIdx) => (
          <div key={colIdx} className="min-w-0 flex-1 rounded-lg border">
            <div className="border-b px-3 py-2">
              <div className="bg-muted h-5 w-24 animate-pulse rounded" />
            </div>
            <div className="space-y-2 p-2">
              {Array.from({ length: 3 }).map((_, cardIdx) => (
                <div key={cardIdx} className="space-y-2 rounded-lg border p-3">
                  <div className="bg-muted h-4 w-full animate-pulse rounded" />
                  <div className="bg-muted h-4 w-2/3 animate-pulse rounded" />
                  <div className="flex items-center gap-2">
                    <div className="bg-muted h-5 w-12 animate-pulse rounded-full" />
                    <div className="bg-muted ml-auto h-6 w-6 animate-pulse rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      {/* 필터 바 */}
      <TaskFilterBar
        members={members ?? []}
        labels={labels ?? []}
        projectId={projectId}
        projectName={project?.name}
        canDeleteAll={canDeleteAll}
        tasks={tasks ?? []}
      />

      {/* 스프린트 헤더 */}
      {projectFeatures.feature_sprints && (
        <div className="mb-4">
          <SprintHeader projectId={projectId} canManage={canDeleteAll} />
        </div>
      )}

      <TooltipProvider>
        <DragDropContext onDragEnd={handleDragEnd}>
          {swimlaneGroups ? (
            <SwimlaneBoard
              groups={swimlaneGroups}
              columns={columns ?? []}
              onTaskClick={setSelectedTask}
              canMoveAll={canDeleteAll}
              currentUserId={user?.id}
              members={members}
              labels={projectFeatures.feature_labels ? labels : undefined}
              taskLabelMap={projectFeatures.feature_labels ? taskLabelMap : new Map()}
              blockedTaskIds={blockedTaskIds}
              recurringTaskIds={recurringTaskIds}
              subtaskMap={projectFeatures.feature_subtasks ? subtaskMap : undefined}
            />
          ) : (
            <div className="flex gap-4 pb-4">
              {columnsWithTasks.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  tasks={column.tasks}
                  onAddTask={setCreateTaskColumnId}
                  onTaskClick={setSelectedTask}
                  onRenameColumn={handleRenameColumn}
                  onDeleteColumn={handleDeleteColumn}
                  onSetWipLimit={canDeleteAll ? setWipLimitColumnId : undefined}
                  onToggleDone={canDeleteAll ? handleToggleDone : undefined}
                  canEdit={canEdit}
                  canDeleteColumn={canDeleteAll}
                  canMoveAll={canDeleteAll}
                  currentUserId={user?.id}
                  members={members}
                  labels={projectFeatures.feature_labels ? labels : undefined}
                  taskLabelMap={projectFeatures.feature_labels ? taskLabelMap : new Map()}
                  blockedTaskIds={blockedTaskIds}
                  recurringTaskIds={recurringTaskIds}
                  taskAssigneeMap={
                    projectFeatures.feature_multi_assignees !== false ? taskAssigneeMap : undefined
                  }
                  subtaskMap={projectFeatures.feature_subtasks ? subtaskMap : undefined}
                />
              ))}

              {/* 컬럼 추가 버튼 — owner/admin만, 기본 컬럼 수 미만일 때만 표시 */}
              {canDeleteAll && (columns?.length ?? 0) < DEFAULT_COLUMNS.length && (
                <Button
                  variant="outline"
                  className="h-12 min-w-0 flex-1 border-dashed"
                  onClick={handleAddColumn}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  컬럼 추가
                </Button>
              )}
            </div>
          )}
        </DragDropContext>
      </TooltipProvider>

      {/* 태스크 생성 다이얼로그 */}
      <CreateTaskForm
        projectId={projectId}
        columnId={createTaskColumnId}
        open={createTaskColumnId !== null}
        onOpenChange={(open) => {
          if (!open) setCreateTaskColumnId(null)
        }}
      />

      {/* 태스크 상세 다이얼로그 */}
      <TaskDetailDialog
        projectId={projectId}
        task={displayedTask}
        open={displayedTask !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTask(null)
            if (taskIdParam) {
              router.replace(`/projects/${projectId}/board`, { scroll: false })
            }
          }
        }}
        canEdit={canEdit}
        canDeleteAll={canDeleteAll}
        labels={projectFeatures.feature_labels ? labels : undefined}
        taskLabelIds={
          displayedTask && projectFeatures.feature_labels
            ? taskLabelMap.get(displayedTask.id)
            : undefined
        }
        projectFeatures={projectFeatures}
      />

      {/* WIP 제한 설정 다이얼로그 */}
      {wipLimitColumnId &&
        (() => {
          const col = columns?.find((c) => c.id === wipLimitColumnId)
          if (!col) return null
          const currentWipLimit = col.wip_limit ?? null
          return (
            <WipLimitDialog
              open
              onOpenChange={(open) => {
                if (!open) setWipLimitColumnId(null)
              }}
              columnTitle={col.title}
              currentLimit={currentWipLimit}
              onSave={(limit) => {
                updateColumnMutation.mutate(
                  { columnId: wipLimitColumnId, input: { wip_limit: limit } },
                  { onSuccess: () => setWipLimitColumnId(null) },
                )
              }}
              isPending={updateColumnMutation.isPending}
            />
          )
        })()}
    </>
  )
}
