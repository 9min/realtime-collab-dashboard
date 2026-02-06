'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { useSupabase } from '@/components/providers/supabase-provider'
import {
  getMyProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getProjectMembers,
} from '@/services/project-service'
import type { InsertTables } from '@/types/database'

// Query Key 팩토리
export const projectKeys = {
  all: ['projects'] as const,
  detail: (id: string) => ['projects', id] as const,
  members: (id: string) => ['projects', id, 'members'] as const,
}

// 내 프로젝트 목록
// supabase 클라이언트는 싱글톤이므로 queryKey에 포함하지 않음
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
    mutationFn: (input: Pick<InsertTables<'projects'>, 'name' | 'description'>) =>
      createProject(supabase, input),
    onSuccess: (result) => {
      if (result.error) throw new Error(result.error.message)
      queryClient.invalidateQueries({ queryKey: projectKeys.all })
    },
  })
}

// 프로젝트 수정
export function useUpdateProject(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: Pick<InsertTables<'projects'>, 'name' | 'description'>) =>
      updateProject(supabase, projectId, input),
    onSuccess: (result) => {
      if (result.error) throw new Error(result.error.message)
      queryClient.invalidateQueries({ queryKey: projectKeys.all })
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) })
    },
  })
}

// 프로젝트 삭제
export function useDeleteProject() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (projectId: string) => deleteProject(supabase, projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all })
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
