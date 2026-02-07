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
}

export function filterTasks(tasks: Task[], criteria: FilterCriteria): Task[] {
  const { searchText, priorities, assigneeIds, dueDateRange } = criteria

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

    // 담당자 필터
    if (assigneeIds.length > 0) {
      const hasUnassigned = assigneeIds.includes(UNASSIGNED_ID)
      const matchesAssignee = task.assignee_id !== null && assigneeIds.includes(task.assignee_id)
      const matchesUnassigned = hasUnassigned && task.assignee_id === null
      if (!matchesAssignee && !matchesUnassigned) return false
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

export { UNASSIGNED_ID }
