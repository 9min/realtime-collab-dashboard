import { describe, it, expect } from 'vitest'

import type { TaskPriority } from '@/types/common'
import type { Task } from '@/types/kanban'

import { filterTasks, getTasksCreatedBefore, UNASSIGNED_ID } from './task-filter'

const baseCriteria = {
  searchText: '',
  priorities: [] as TaskPriority[],
  assigneeIds: [] as string[],
  dueDateRange: { from: null, to: null },
}

const tasks: Task[] = [
  {
    id: 't1',
    project_id: 'p1',
    column_id: 'c1',
    title: 'Fix login bug',
    description: 'Authentication issue in OAuth flow',
    priority: 'high',
    assignee_id: 'user-1',
    position: 0,
    due_date: '2026-02-15',
    created_by: 'user-1',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 't2',
    project_id: 'p1',
    column_id: 'c1',
    title: 'Add dashboard widget',
    description: null,
    priority: 'medium',
    assignee_id: null,
    position: 1,
    due_date: '2026-03-01',
    created_by: 'user-1',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 't3',
    project_id: 'p1',
    column_id: 'c2',
    title: 'Update docs',
    description: 'Write API documentation',
    priority: 'low',
    assignee_id: 'user-2',
    position: 0,
    due_date: null,
    created_by: 'user-1',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
]

describe('task-filter', () => {
  describe('filterTasks', () => {
    it('빈 criteria면 모든 태스크를 반환한다', () => {
      const result = filterTasks(tasks, baseCriteria)
      expect(result).toHaveLength(3)
    })

    it('title에 대한 검색 필터링', () => {
      const result = filterTasks(tasks, { ...baseCriteria, searchText: 'login' })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('t1')
    })

    it('description에 대한 검색 필터링', () => {
      const result = filterTasks(tasks, { ...baseCriteria, searchText: 'oauth' })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('t1')
    })

    it('우선순위 필터링', () => {
      const result = filterTasks(tasks, { ...baseCriteria, priorities: ['high'] })
      expect(result).toHaveLength(1)
      expect(result[0].priority).toBe('high')
    })

    it('담당자 필터링 (할당된 사용자)', () => {
      const result = filterTasks(tasks, { ...baseCriteria, assigneeIds: ['user-1'] })
      expect(result).toHaveLength(1)
      expect(result[0].assignee_id).toBe('user-1')
    })

    it('미할당 태스크 필터링', () => {
      const result = filterTasks(tasks, { ...baseCriteria, assigneeIds: [UNASSIGNED_ID] })
      expect(result).toHaveLength(1)
      expect(result[0].assignee_id).toBeNull()
    })

    it('마감일 범위 필터링', () => {
      const result = filterTasks(tasks, {
        ...baseCriteria,
        dueDateRange: { from: '2026-02-01', to: '2026-02-28' },
      })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('t1')
    })

    it('복합 필터 적용', () => {
      const result = filterTasks(tasks, {
        ...baseCriteria,
        searchText: 'add',
        priorities: ['medium'],
      })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('t2')
    })
  })

  describe('getTasksCreatedBefore', () => {
    const tasksWithDates: Task[] = [
      { ...tasks[0], id: 'old-1', created_at: '2025-12-01T00:00:00Z' },
      { ...tasks[1], id: 'old-2', created_at: '2025-12-15T00:00:00Z' },
      { ...tasks[2], id: 'new-1', created_at: '2026-02-01T00:00:00Z' },
    ]

    it('기준 날짜 이전 태스크만 반환한다', () => {
      const result = getTasksCreatedBefore(tasksWithDates, '2026-01-01T00:00:00Z')
      expect(result).toHaveLength(2)
      expect(result.map((t) => t.id)).toEqual(['old-1', 'old-2'])
    })

    it('대상 없으면 빈 배열을 반환한다', () => {
      const result = getTasksCreatedBefore(tasksWithDates, '2025-01-01T00:00:00Z')
      expect(result).toHaveLength(0)
    })

    it('모두 대상이면 전체를 반환한다', () => {
      const result = getTasksCreatedBefore(tasksWithDates, '2027-01-01T00:00:00Z')
      expect(result).toHaveLength(3)
    })
  })
})
