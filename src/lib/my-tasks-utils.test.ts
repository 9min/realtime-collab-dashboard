import { describe, it, expect, vi, afterEach } from 'vitest'

import { groupMyTasks } from './my-tasks-utils'
import type { MyTaskWithProject } from '@/services/my-tasks-service'

function createTask(overrides: Partial<MyTaskWithProject> = {}): MyTaskWithProject {
  return {
    id: 'task-1',
    project_id: 'proj-1',
    column_id: 'col-1',
    title: 'Test',
    description: null,
    priority: 'medium',
    assignee_id: 'user-1',
    position: 0,
    due_date: null,
    created_by: 'user-1',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    sprint_id: null,
    estimated_minutes: null,
    project_name: 'Project',
    column_title: 'Column',
    is_done_column: false,
    ...overrides,
  }
}

describe('groupMyTasks', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('should group tasks by due date', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-06-15T10:00:00Z')) // Sunday = 0, Monday=1, ... Sunday

    const tasks = [
      createTask({ id: '1', due_date: '2025-06-10' }), // overdue
      createTask({ id: '2', due_date: '2025-06-15' }), // today
      createTask({ id: '3', due_date: '2025-06-18' }), // thisWeek (before endOfWeek)
      createTask({ id: '4', due_date: '2025-06-25' }), // upcoming
      createTask({ id: '5', due_date: null }), // noDueDate
    ]

    const grouped = groupMyTasks(tasks)
    expect(grouped.overdue).toHaveLength(1)
    expect(grouped.today).toHaveLength(1)
    expect(grouped.noDueDate).toHaveLength(1)
    expect(grouped.overdue[0].id).toBe('1')
    expect(grouped.today[0].id).toBe('2')
  })

  it('should separate done tasks into done group', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-06-15T10:00:00Z'))

    const tasks = [
      createTask({ id: '1', due_date: '2025-06-15' }), // today (active)
      createTask({ id: '2', due_date: '2025-06-10', is_done_column: true }), // done (not overdue)
      createTask({ id: '3', due_date: null, is_done_column: true }), // done (not noDueDate)
    ]

    const grouped = groupMyTasks(tasks)
    expect(grouped.today).toHaveLength(1)
    expect(grouped.done).toHaveLength(2)
    expect(grouped.overdue).toHaveLength(0)
    expect(grouped.noDueDate).toHaveLength(0)
  })

  it('should return empty groups for empty array', () => {
    const grouped = groupMyTasks([])
    expect(grouped.overdue).toHaveLength(0)
    expect(grouped.today).toHaveLength(0)
    expect(grouped.thisWeek).toHaveLength(0)
    expect(grouped.upcoming).toHaveLength(0)
    expect(grouped.noDueDate).toHaveLength(0)
    expect(grouped.done).toHaveLength(0)
  })
})
