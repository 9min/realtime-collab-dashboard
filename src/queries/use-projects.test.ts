import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'

vi.mock('@/components/providers/supabase-provider', () => ({
  useSupabase: () => ({}),
}))

vi.mock('@/services/project-service', () => ({
  getMyProjects: vi.fn(),
  getProject: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  getProjectMembers: vi.fn(),
  inviteMember: vi.fn(),
  removeMember: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { toast } from 'sonner'
import {
  getMyProjects,
  getProject,
  createProject,
  deleteProject,
  getProjectMembers,
  inviteMember,
  removeMember,
} from '@/services/project-service'
import {
  mockProject,
  mockMemberWithProfile,
  mockMember,
  MOCK_PROJECT_ID,
} from '@/__tests__/helpers/fixtures'
import type { ProjectWithMemberCount } from '@/services/project-service'
import {
  useProjects,
  useProject,
  useCreateProject,
  useDeleteProject,
  useProjectMembers,
  useInviteMember,
  useRemoveMember,
  projectKeys,
} from './use-projects'

const mockProjectWithCount: ProjectWithMemberCount = { ...mockProject, member_count: 2 }

describe('use-projects', () => {
  let queryClient: QueryClient

  function wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
  })

  // ── useProjects ──
  describe('useProjects', () => {
    it('프로젝트 목록을 조회한다', async () => {
      vi.mocked(getMyProjects).mockResolvedValue({ data: [mockProjectWithCount], error: null })

      const { result } = renderHook(() => useProjects(), { wrapper })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual([mockProjectWithCount])
    })

    it('에러 시 error 상태가 된다', async () => {
      vi.mocked(getMyProjects).mockResolvedValue({
        data: null,
        error: { code: 'ERR', message: 'fail' },
      })

      const { result } = renderHook(() => useProjects(), { wrapper })

      await waitFor(() => expect(result.current.isError).toBe(true))
    })
  })

  // ── useProject ──
  describe('useProject', () => {
    it('프로젝트 단건을 조회한다', async () => {
      vi.mocked(getProject).mockResolvedValue({ data: mockProject, error: null })

      const { result } = renderHook(() => useProject(MOCK_PROJECT_ID), { wrapper })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockProject)
    })

    it('projectId가 빈 문자열이면 쿼리가 비활성화된다', () => {
      const { result } = renderHook(() => useProject(''), { wrapper })

      expect(result.current.fetchStatus).toBe('idle')
    })
  })

  // ── useCreateProject ──
  describe('useCreateProject', () => {
    it('성공 시 캐시 무효화 + success toast', async () => {
      vi.mocked(createProject).mockResolvedValue({ data: mockProject, error: null })

      const { result } = renderHook(() => useCreateProject(), { wrapper })

      await act(async () => {
        await result.current.mutateAsync({ name: 'New', description: 'desc' })
      })

      expect(toast.success).toHaveBeenCalledWith('프로젝트가 생성되었습니다')
    })

    it('실패 시 error toast', async () => {
      vi.mocked(createProject).mockResolvedValue({
        data: null,
        error: { code: 'ERR', message: 'fail' },
      })

      const { result } = renderHook(() => useCreateProject(), { wrapper })

      await act(async () => {
        try {
          await result.current.mutateAsync({ name: 'X' })
        } catch {
          // expected
        }
      })

      expect(toast.error).toHaveBeenCalledWith('프로젝트 생성에 실패했습니다')
    })
  })

  // ── useDeleteProject ──
  describe('useDeleteProject', () => {
    it('성공 시 success toast', async () => {
      vi.mocked(deleteProject).mockResolvedValue({ data: null, error: null })

      const { result } = renderHook(() => useDeleteProject(), { wrapper })

      await act(async () => {
        await result.current.mutateAsync(MOCK_PROJECT_ID)
      })

      expect(toast.success).toHaveBeenCalledWith('프로젝트가 삭제되었습니다')
    })
  })

  // ── useProjectMembers ──
  describe('useProjectMembers', () => {
    it('멤버 목록을 조회한다', async () => {
      vi.mocked(getProjectMembers).mockResolvedValue({ data: [mockMemberWithProfile], error: null })

      const { result } = renderHook(() => useProjectMembers(MOCK_PROJECT_ID), { wrapper })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual([mockMemberWithProfile])
    })
  })

  // ── useInviteMember ──
  describe('useInviteMember', () => {
    it('성공 시 success toast', async () => {
      vi.mocked(inviteMember).mockResolvedValue({ data: mockMember, error: null })

      const { result } = renderHook(() => useInviteMember(MOCK_PROJECT_ID), { wrapper })

      await act(async () => {
        await result.current.mutateAsync({ email: 'new@example.com', role: 'member' })
      })

      expect(toast.success).toHaveBeenCalledWith('멤버가 초대되었습니다')
    })

    it('실패 시 error toast에 에러 메시지가 포함된다', async () => {
      vi.mocked(inviteMember).mockResolvedValue({
        data: null,
        error: { code: 'USER_NOT_FOUND', message: '사용자를 찾을 수 없습니다' },
      })

      const { result } = renderHook(() => useInviteMember(MOCK_PROJECT_ID), { wrapper })

      await act(async () => {
        try {
          await result.current.mutateAsync({ email: 'x@x.com', role: 'member' })
        } catch {
          // expected
        }
      })

      expect(toast.error).toHaveBeenCalledWith('사용자를 찾을 수 없습니다')
    })
  })

  // ── useRemoveMember ──
  describe('useRemoveMember', () => {
    it('성공 시 success toast', async () => {
      vi.mocked(removeMember).mockResolvedValue({ data: null, error: null })

      const { result } = renderHook(() => useRemoveMember(MOCK_PROJECT_ID), { wrapper })

      await act(async () => {
        await result.current.mutateAsync('m1')
      })

      expect(toast.success).toHaveBeenCalledWith('멤버가 제거되었습니다')
    })
  })

  // ── projectKeys ──
  describe('projectKeys', () => {
    it('올바른 쿼리 키를 생성한다', () => {
      expect(projectKeys.all).toEqual(['projects'])
      expect(projectKeys.detail('p1')).toEqual(['projects', 'p1'])
      expect(projectKeys.members('p1')).toEqual(['projects', 'p1', 'members'])
    })
  })
})
