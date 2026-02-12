import type { MyTaskWithProject } from '@/services/my-tasks-service'

export interface GroupedMyTasks {
  overdue: MyTaskWithProject[]
  today: MyTaskWithProject[]
  thisWeek: MyTaskWithProject[]
  upcoming: MyTaskWithProject[]
  noDueDate: MyTaskWithProject[]
}

export function groupMyTasks(tasks: MyTaskWithProject[]): GroupedMyTasks {
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]

  // 이번 주 일요일 (주의 끝)
  const dayOfWeek = now.getDay()
  const endOfWeek = new Date(now)
  endOfWeek.setDate(now.getDate() + (7 - dayOfWeek))
  const endOfWeekStr = endOfWeek.toISOString().split('T')[0]

  const result: GroupedMyTasks = {
    overdue: [],
    today: [],
    thisWeek: [],
    upcoming: [],
    noDueDate: [],
  }

  for (const task of tasks) {
    if (!task.due_date) {
      result.noDueDate.push(task)
    } else if (task.due_date < todayStr) {
      result.overdue.push(task)
    } else if (task.due_date === todayStr) {
      result.today.push(task)
    } else if (task.due_date <= endOfWeekStr) {
      result.thisWeek.push(task)
    } else {
      result.upcoming.push(task)
    }
  }

  return result
}
