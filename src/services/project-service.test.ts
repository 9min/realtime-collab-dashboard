import { describe, it, expect } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database'
import { createMockSupabaseClient } from '@/__tests__/helpers/mock-supabase'
import {
  MOCK_USER_ID,
  MOCK_PROJECT_ID,
  MOCK_USER_ID_2,
  MOCK_MEMBER_ID,
  mockProject,
  mockMember,
  mockMemberWithProfile,
} from '@/__tests__/helpers/fixtures'

import {
  getMyProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getProjectMembers,
  inviteMember,
  removeMember,
} from './project-service'

type Client = SupabaseClient<Database>

describe('project-service', () => {
  // ── getMyProjects ──
  describe('getMyProjects', () => {
    it('프로젝트 목록 + 멤버 수 + 현재 유저 역할을 반환한다', async () => {
      const client = createMockSupabaseClient({
        authUser: { id: MOCK_USER_ID, email: 'test@example.com' },
        fromResponses: [
          // projects 조회
          { data: [mockProject], error: null },
          // member data 조회 (project_id, user_id, role)
          {
            data: [
              { project_id: MOCK_PROJECT_ID, user_id: MOCK_USER_ID, role: 'owner' },
              { project_id: MOCK_PROJECT_ID, user_id: MOCK_USER_ID_2, role: 'member' },
            ],
            error: null,
          },
        ],
      }) as Client

      const result = await getMyProjects(client)

      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(1)
      expect(result.data?.[0].member_count).toBe(2)
      expect(result.data?.[0].current_user_role).toBe('owner')
    })

    it('프로젝트가 없으면 빈 배열을 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: [], error: null }],
      }) as Client

      const result = await getMyProjects(client)

      expect(result.error).toBeNull()
      expect(result.data).toEqual([])
    })

    it('프로젝트 조회 에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'PGRST116', message: 'DB error' } }],
      }) as Client

      const result = await getMyProjects(client)

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('PGRST116')
    })
  })

  // ── getProject ──
  describe('getProject', () => {
    it('프로젝트를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: mockProject, error: null }],
      }) as Client

      const result = await getProject(client, MOCK_PROJECT_ID)

      expect(result.error).toBeNull()
      expect(result.data).toEqual(mockProject)
    })

    it('존재하지 않는 프로젝트 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'PGRST116', message: 'Not found' } }],
      }) as Client

      const result = await getProject(client, 'nonexistent')

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('PGRST116')
    })
  })

  // ── createProject ──
  describe('createProject', () => {
    it('RPC로 프로젝트를 생성하고 전체 데이터를 반환한다', async () => {
      const client = createMockSupabaseClient({
        rpcResponse: { data: MOCK_PROJECT_ID, error: null },
        fromResponses: [{ data: mockProject, error: null }],
      }) as Client

      const result = await createProject(client, {
        name: 'Test Project',
        description: 'A test project',
      })

      expect(result.error).toBeNull()
      expect(result.data).toEqual(mockProject)
    })

    it('RPC 에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        rpcResponse: { data: null, error: { code: 'P0001', message: 'RPC failed' } },
      }) as Client

      const result = await createProject(client, { name: 'X' })

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('P0001')
    })

    it('RPC 성공 후 조회 실패 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        rpcResponse: { data: MOCK_PROJECT_ID, error: null },
        fromResponses: [{ data: null, error: { code: 'PGRST116', message: 'Fetch failed' } }],
      }) as Client

      const result = await createProject(client, { name: 'X' })

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('PGRST116')
    })
  })

  // ── updateProject ──
  describe('updateProject', () => {
    it('프로젝트를 수정하고 반환한다', async () => {
      const updated = { ...mockProject, name: 'Updated' }
      const client = createMockSupabaseClient({
        fromResponses: [{ data: updated, error: null }],
      }) as Client

      const result = await updateProject(client, MOCK_PROJECT_ID, {
        name: 'Updated',
        description: null,
      })

      expect(result.error).toBeNull()
      expect(result.data?.name).toBe('Updated')
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'PGRST204', message: 'Not found' } }],
      }) as Client

      const result = await updateProject(client, 'nonexistent', { name: 'X' })

      expect(result.data).toBeNull()
      expect(result.error).not.toBeNull()
    })
  })

  // ── deleteProject ──
  describe('deleteProject', () => {
    it('프로젝트를 삭제하고 성공을 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: null }],
      }) as Client

      const result = await deleteProject(client, MOCK_PROJECT_ID)

      expect(result.error).toBeNull()
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: '23503', message: 'FK violation' } }],
      }) as Client

      const result = await deleteProject(client, MOCK_PROJECT_ID)

      expect(result.error?.code).toBe('23503')
    })
  })

  // ── getProjectMembers ──
  describe('getProjectMembers', () => {
    it('멤버 목록 (프로필 포함)을 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: [mockMemberWithProfile], error: null }],
      }) as Client

      const result = await getProjectMembers(client, MOCK_PROJECT_ID)

      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(1)
      expect(result.data?.[0].profiles.full_name).toBe('Test User')
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'PGRST116', message: 'error' } }],
      }) as Client

      const result = await getProjectMembers(client, MOCK_PROJECT_ID)

      expect(result.data).toBeNull()
      expect(result.error).not.toBeNull()
    })
  })

  // ── inviteMember ──
  describe('inviteMember', () => {
    it('이메일로 유저를 찾아 멤버로 추가한다', async () => {
      const newMember = { ...mockMember, user_id: MOCK_USER_ID_2, role: 'member' as const }

      const client = createMockSupabaseClient({
        fromResponses: [
          // 1. 이메일로 프로필 조회
          { data: { id: MOCK_USER_ID_2 }, error: null },
          // 2. 기존 멤버 확인 (없음)
          { data: null, error: null },
          // 3. 멤버 추가
          { data: newMember, error: null },
        ],
      }) as Client

      const result = await inviteMember(client, MOCK_PROJECT_ID, 'other@example.com', 'member')

      expect(result.error).toBeNull()
      expect(result.data?.user_id).toBe(MOCK_USER_ID_2)
    })

    it('존재하지 않는 이메일이면 USER_NOT_FOUND를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [
          { data: null, error: { code: 'PGRST116', message: 'Not found' } },
        ],
      }) as Client

      const result = await inviteMember(client, MOCK_PROJECT_ID, 'unknown@example.com', 'member')

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('USER_NOT_FOUND')
    })

    it('이미 멤버이면 ALREADY_MEMBER를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [
          { data: { id: MOCK_USER_ID_2 }, error: null },
          { data: { id: 'existing-member-id' }, error: null },
        ],
      }) as Client

      const result = await inviteMember(client, MOCK_PROJECT_ID, 'other@example.com', 'member')

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('ALREADY_MEMBER')
    })
  })

  // ── removeMember ──
  describe('removeMember', () => {
    it('멤버를 제거하고 성공을 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: null }],
      }) as Client

      const result = await removeMember(client, MOCK_MEMBER_ID)

      expect(result.error).toBeNull()
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'PGRST204', message: 'Not found' } }],
      }) as Client

      const result = await removeMember(client, 'nonexistent')

      expect(result.error).not.toBeNull()
    })
  })
})
