import type { Task } from '@/types/kanban'
import type { TaskPriority } from '@/types/common'

const UNASSIGNED_ID = '__unassigned__' as const

interface FilterCriteria {
  searchText: string
  priorities: TaskPriority[]
  assigneeIds: string[]
  dueDateRange: {
    from: string | null
    to: string | null
  }
  labelIds?: string[]
  taskLabelMap?: Map<string, string[]>
  /** task_id → user_id[] 맵 (다중 담당자 모드) */
  taskAssigneeUserIds?: Map<string, string[]>
}

export function filterTasks(tasks: Task[], criteria: FilterCriteria): Task[] {
  const {
    searchText,
    priorities,
    assigneeIds,
    dueDateRange,
    labelIds,
    taskLabelMap,
    taskAssigneeUserIds,
  } = criteria

  return tasks.filter((task) => {
    // 검색: title + description 대소문자 무시
    if (searchText) {
      const query = searchText.toLowerCase()
      const titleMatch = task.title.toLowerCase().includes(query)
      const descMatch = task.description?.toLowerCase().includes(query) ?? false
      if (!titleMatch && !descMatch) return false
    }

    // 우선순위 필터
    if (priorities.length > 0 && !priorities.includes(task.priority)) {
      return false
    }

    // 담당자 필터 (다중 담당자 지원)
    if (assigneeIds.length > 0) {
      const hasUnassigned = assigneeIds.includes(UNASSIGNED_ID)
      const multiAssigneeIds = taskAssigneeUserIds?.get(task.id)

      if (multiAssigneeIds && multiAssigneeIds.length > 0) {
        // 다중 담당자 모드: task_assignees에서 매칭
        const matchesMulti = multiAssigneeIds.some((uid) => assigneeIds.includes(uid))
        if (!matchesMulti) return false
      } else {
        // 레거시 단일 담당자 모드
        const matchesAssignee = task.assignee_id !== null && assigneeIds.includes(task.assignee_id)
        const matchesUnassigned = hasUnassigned && task.assignee_id === null
        if (!matchesAssignee && !matchesUnassigned) return false
      }
    }

    // 라벨 필터
    if (labelIds && labelIds.length > 0 && taskLabelMap) {
      const taskLabelIds = taskLabelMap.get(task.id) ?? []
      const hasMatchingLabel = labelIds.some((id) => taskLabelIds.includes(id))
      if (!hasMatchingLabel) return false
    }

    // 마감일 범위 필터
    if (dueDateRange.from || dueDateRange.to) {
      if (!task.due_date) return false
      const taskDate = task.due_date
      if (dueDateRange.from && taskDate < dueDateRange.from) return false
      if (dueDateRange.to && taskDate > dueDateRange.to) return false
    }

    return true
  })
}

export function getTasksCreatedBefore(tasks: Task[], beforeDate: string): Task[] {
  return tasks.filter((task) => task.created_at < beforeDate)
}

export { UNASSIGNED_ID }
