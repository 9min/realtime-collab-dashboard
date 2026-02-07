'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useSupabase } from '@/components/providers/supabase-provider'
import {
  getMyProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getProjectMembers,
  inviteMember,
  removeMember,
} from '@/services/project-service'
import type { InsertTables } from '@/types/database'
import type { MemberRole } from '@/types/common'

// Query Key 팩토리
export const projectKeys = {
  all: ['projects'] as const,
  detail: (id: string) => ['projects', id] as const,
  members: (id: string) => ['projects', id, 'members'] as const,
}

// 내 프로젝트 목록
export function useProjects() {
  const supabase = useSupabase()

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: projectKeys.all,
    queryFn: async () => {
      const result = await getMyProjects(supabase)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
  })
}

// 프로젝트 단건
export function useProject(projectId: string) {
  const supabase = useSupabase()

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: projectKeys.detail(projectId),
    queryFn: async () => {
      const result = await getProject(supabase, projectId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    enabled: !!projectId,
  })
}

// 프로젝트 생성
export function useCreateProject() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: Pick<InsertTables<'projects'>, 'name' | 'description'>) => {
      const result = await createProject(supabase, input)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all })
      toast.success('프로젝트가 생성되었습니다')
    },
    onError: () => {
      toast.error('프로젝트 생성에 실패했습니다')
    },
  })
}

// 프로젝트 수정
export function useUpdateProject(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: Pick<InsertTables<'projects'>, 'name' | 'description'>) => {
      const result = await updateProject(supabase, projectId, input)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all })
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) })
      toast.success('프로젝트가 수정되었습니다')
    },
    onError: () => {
      toast.error('프로젝트 수정에 실패했습니다')
    },
  })
}

// 프로젝트 삭제
export function useDeleteProject() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (projectId: string) => {
      const result = await deleteProject(supabase, projectId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all })
      toast.success('프로젝트가 삭제되었습니다')
    },
    onError: () => {
      toast.error('프로젝트 삭제에 실패했습니다')
    },
  })
}

// 프로젝트 멤버 목록
export function useProjectMembers(projectId: string) {
  const supabase = useSupabase()

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: projectKeys.members(projectId),
    queryFn: async () => {
      const result = await getProjectMembers(supabase, projectId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    enabled: !!projectId,
  })
}

// 멤버 초대
export function useInviteMember(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ email, role }: { email: string; role: MemberRole }) => {
      const result = await inviteMember(supabase, projectId, email, role)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.members(projectId) })
      toast.success('멤버가 초대되었습니다')
    },
    onError: (error) => {
      toast.error(error.message || '멤버 초대에 실패했습니다')
    },
  })
}

// 멤버 제거
export function useRemoveMember(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (memberId: string) => {
      const result = await removeMember(supabase, memberId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.members(projectId) })
      toast.success('멤버가 제거되었습니다')
    },
    onError: () => {
      toast.error('멤버 제거에 실패했습니다')
    },
  })
}
