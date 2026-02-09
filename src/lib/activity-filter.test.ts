import { describe, it, expect } from 'vitest'

import type { ActivityLogWithUser } from '@/types/activity'

import { filterActivityLogs, groupActivitiesByDate } from './activity-filter'

function createActivity(overrides: Partial<ActivityLogWithUser> = {}): ActivityLogWithUser {
  return {
    id: 'act-1',
    project_id: 'proj-1',
    user_id: 'user-1',
    action_type: 'created',
    entity_type: 'task',
    entity_id: 'entity-1',
    metadata: { title: '테스트 태스크' },
    created_at: new Date().toISOString(),
    profiles: {
      id: 'user-1',
      email: 'user@example.com',
      full_name: '홍길동',
      avatar_url: null,
      is_admin: false,
      created_at: '',
      updated_at: '',
    },
    ...overrides,
  }
}

describe('filterActivityLogs', () => {
  const activities = [
    createActivity({ id: '1', action_type: 'created', entity_type: 'task', user_id: 'user-1' }),
    createActivity({
      id: '2',
      action_type: 'updated',
      entity_type: 'column',
      user_id: 'user-2',
      profiles: {
        id: 'user-2',
        email: 'kim@example.com',
        full_name: '김철수',
        avatar_url: null,
        is_admin: false,
        created_at: '',
        updated_at: '',
      },
    }),
    createActivity({
      id: '3',
      action_type: 'deleted',
      entity_type: 'comment',
      user_id: 'user-1',
      metadata: { title: '중요 댓글' },
    }),
  ]

  it('모든 조건이 비어있으면 전체를 반환한다', () => {
    const result = filterActivityLogs(activities, {
      searchText: '',
      actionTypes: [],
      entityTypes: [],
      userIds: [],
    })
    expect(result).toHaveLength(3)
  })

  it('searchText로 사용자 이름을 필터링한다', () => {
    const result = filterActivityLogs(activities, {
      searchText: '홍길동',
      actionTypes: [],
      entityTypes: [],
      userIds: [],
    })
    expect(result).toHaveLength(2)
    expect(result.every((a) => a.profiles.full_name === '홍길동')).toBe(true)
  })

  it('searchText로 메타데이터 제목을 필터링한다', () => {
    const result = filterActivityLogs(activities, {
      searchText: '중요',
      actionTypes: [],
      entityTypes: [],
      userIds: [],
    })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('3')
  })

  it('actionTypes로 필터링한다', () => {
    const result = filterActivityLogs(activities, {
      searchText: '',
      actionTypes: ['created'],
      entityTypes: [],
      userIds: [],
    })
    expect(result).toHaveLength(1)
    expect(result[0].action_type).toBe('created')
  })

  it('entityTypes로 필터링한다', () => {
    const result = filterActivityLogs(activities, {
      searchText: '',
      actionTypes: [],
      entityTypes: ['column'],
      userIds: [],
    })
    expect(result).toHaveLength(1)
    expect(result[0].entity_type).toBe('column')
  })

  it('userIds로 필터링한다', () => {
    const result = filterActivityLogs(activities, {
      searchText: '',
      actionTypes: [],
      entityTypes: [],
      userIds: ['user-2'],
    })
    expect(result).toHaveLength(1)
    expect(result[0].user_id).toBe('user-2')
  })

  it('여러 필터를 AND 조합한다', () => {
    const result = filterActivityLogs(activities, {
      searchText: '홍길동',
      actionTypes: ['deleted'],
      entityTypes: [],
      userIds: [],
    })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('3')
  })

  it('매칭되는 결과가 없으면 빈 배열을 반환한다', () => {
    const result = filterActivityLogs(activities, {
      searchText: '없는이름',
      actionTypes: [],
      entityTypes: [],
      userIds: [],
    })
    expect(result).toHaveLength(0)
  })
})

describe('groupActivitiesByDate', () => {
  // 2026-02-12 is a Thursday, weekStart(Sunday) = Feb 8
  const now = new Date('2026-02-12T12:00:00')
  const today = '2026-02-12T10:00:00'
  const yesterday = '2026-02-11T15:00:00'
  const thisWeek = '2026-02-09T10:00:00' // Monday, after weekStart(Sunday Feb 8)
  const older = '2026-01-20T10:00:00'

  it('활동을 날짜 그룹으로 분류한다', () => {
    const activities = [
      createActivity({ id: '1', created_at: today }),
      createActivity({ id: '2', created_at: yesterday }),
      createActivity({ id: '3', created_at: thisWeek }),
      createActivity({ id: '4', created_at: older }),
    ]

    const groups = groupActivitiesByDate(activities, now)
    expect(groups).toHaveLength(4)
    expect(groups[0].label).toBe('오늘')
    expect(groups[0].activities).toHaveLength(1)
    expect(groups[1].label).toBe('어제')
    expect(groups[1].activities).toHaveLength(1)
    expect(groups[2].label).toBe('이번 주')
    expect(groups[2].activities).toHaveLength(1)
    expect(groups[3].label).toBe('이전')
    expect(groups[3].activities).toHaveLength(1)
  })

  it('빈 그룹은 제외한다', () => {
    const activities = [
      createActivity({ id: '1', created_at: today }),
      createActivity({ id: '2', created_at: older }),
    ]

    const groups = groupActivitiesByDate(activities, now)
    expect(groups).toHaveLength(2)
    expect(groups[0].label).toBe('오늘')
    expect(groups[1].label).toBe('이전')
  })

  it('활동이 없으면 빈 배열을 반환한다', () => {
    const groups = groupActivitiesByDate([], now)
    expect(groups).toHaveLength(0)
  })

  it('오늘 날짜의 여러 활동을 같은 그룹에 넣는다', () => {
    const activities = [
      createActivity({ id: '1', created_at: '2026-02-12T08:00:00' }),
      createActivity({ id: '2', created_at: '2026-02-12T14:00:00' }),
    ]

    const groups = groupActivitiesByDate(activities, now)
    expect(groups).toHaveLength(1)
    expect(groups[0].label).toBe('오늘')
    expect(groups[0].activities).toHaveLength(2)
  })
})
