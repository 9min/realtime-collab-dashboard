import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'

import { renderWithProviders } from '@/__tests__/helpers/render-with-providers'
import { mockProfile, MOCK_PROJECT_ID, MOCK_USER_ID, MOCK_TASK_ID_1 } from '@/__tests__/helpers/fixtures'
import type { ActivityLogWithUser } from '@/types/activity'

import { ActivityItem } from './activity-item'

function createActivity(overrides: Partial<ActivityLogWithUser> = {}): ActivityLogWithUser {
  return {
    id: 'activity-test-001',
    project_id: MOCK_PROJECT_ID,
    user_id: MOCK_USER_ID,
    action_type: 'created',
    entity_type: 'task',
    entity_id: MOCK_TASK_ID_1,
    metadata: { title: 'My Task' },
    created_at: new Date().toISOString(),
    profiles: mockProfile,
    ...overrides,
  }
}

describe('ActivityItem', () => {
  it('유저 이름을 포함한 메시지를 렌더링한다', () => {
    const activity = createActivity()
    renderWithProviders(<ActivityItem activity={activity} />)

    expect(screen.getByText(/Test User/)).toBeInTheDocument()
  })

  it('액션 라벨 뱃지를 렌더링한다', () => {
    const activity = createActivity({ action_type: 'created' })
    renderWithProviders(<ActivityItem activity={activity} />)

    expect(screen.getByText('생성')).toBeInTheDocument()
  })

  it('엔터티 라벨 뱃지를 렌더링한다', () => {
    const activity = createActivity({ entity_type: 'task' })
    renderWithProviders(<ActivityItem activity={activity} />)

    expect(screen.getByText('태스크')).toBeInTheDocument()
  })

  it('타임스탬프를 렌더링한다', () => {
    const activity = createActivity({ created_at: new Date().toISOString() })
    renderWithProviders(<ActivityItem activity={activity} />)

    expect(screen.getByText('방금 전')).toBeInTheDocument()
  })

  it('create 액션: 태스크 생성 메시지를 표시한다', () => {
    const activity = createActivity({
      action_type: 'created',
      entity_type: 'task',
      metadata: { title: 'New Feature' },
    })
    renderWithProviders(<ActivityItem activity={activity} />)

    expect(screen.getByText("Test User님이 태스크 'New Feature'을(를) 생성했습니다")).toBeInTheDocument()
  })

  it('update 액션: 수정 뱃지를 표시한다', () => {
    const activity = createActivity({
      action_type: 'updated',
      entity_type: 'task',
      metadata: { title: 'Updated Task' },
    })
    renderWithProviders(<ActivityItem activity={activity} />)

    expect(screen.getByText('수정')).toBeInTheDocument()
    expect(screen.getByText(/Updated Task/)).toBeInTheDocument()
  })

  it('delete 액션: 삭제 뱃지를 표시한다', () => {
    const activity = createActivity({
      action_type: 'deleted',
      entity_type: 'task',
      metadata: { title: 'Removed Task' },
    })
    renderWithProviders(<ActivityItem activity={activity} />)

    expect(screen.getByText('삭제')).toBeInTheDocument()
    expect(screen.getByText(/Removed Task/)).toBeInTheDocument()
  })

  it('moved 액션: 태스크 이동 메시지를 표시한다', () => {
    const activity = createActivity({
      action_type: 'moved',
      entity_type: 'task',
      metadata: { title: 'Moved Task' },
    })
    renderWithProviders(<ActivityItem activity={activity} />)

    expect(screen.getByText("Test User님이 태스크 'Moved Task'를 이동했습니다")).toBeInTheDocument()
    expect(screen.getByText('이동')).toBeInTheDocument()
  })

  it('full_name이 없으면 이메일을 사용한다', () => {
    const activity = createActivity({
      profiles: { ...mockProfile, full_name: null },
    })
    renderWithProviders(<ActivityItem activity={activity} />)

    expect(screen.getByText(/test@example\.com/)).toBeInTheDocument()
  })

  it('아바타 fallback으로 이니셜을 표시한다', () => {
    const activity = createActivity()
    renderWithProviders(<ActivityItem activity={activity} />)

    // Avatar fallback shows first letter of full_name
    expect(screen.getByText('T')).toBeInTheDocument()
  })

  it('member 엔터티 - 생성 액션 시 멤버 추가 메시지를 표시한다', () => {
    const activity = createActivity({
      action_type: 'created',
      entity_type: 'member',
      metadata: {},
    })
    renderWithProviders(<ActivityItem activity={activity} />)

    expect(screen.getByText('Test User님이 새 멤버를 추가했습니다')).toBeInTheDocument()
  })

  it('member 엔터티 - 삭제 액션 시 멤버 제거 메시지를 표시한다', () => {
    const activity = createActivity({
      action_type: 'deleted',
      entity_type: 'member',
      metadata: {},
    })
    renderWithProviders(<ActivityItem activity={activity} />)

    expect(screen.getByText('Test User님이 멤버를 제거했습니다')).toBeInTheDocument()
  })

  it('comment 엔터티 - 생성 액션 시 댓글 메시지를 표시한다', () => {
    const activity = createActivity({
      action_type: 'created',
      entity_type: 'comment',
      metadata: {},
    })
    renderWithProviders(<ActivityItem activity={activity} />)

    expect(screen.getByText('Test User님이 태스크에 댓글을 남겼습니다')).toBeInTheDocument()
  })
})
