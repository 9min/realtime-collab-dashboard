'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useSupabase } from '@/components/providers/supabase-provider'
import { getAllUsers, setAdminStatus, getMyProfile, getAllProjectMemberships } from '@/services/admin-service'

export const adminKeys = {
  myProfile: ['admin', 'my-profile'] as const,
  allUsers: ['admin', 'users'] as const,
  allMemberships: ['admin', 'memberships'] as const,
}

export function useMyProfile() {
  const supabase = useSupabase()

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: adminKeys.myProfile,
    queryFn: async () => {
      const result = await getMyProfile(supabase)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
  })
}

export function useAllUsers() {
  const supabase = useSupabase()

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: adminKeys.allUsers,
    queryFn: async () => {
      const result = await getAllUsers(supabase)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
  })
}

export function useAllProjectMemberships() {
  const supabase = useSupabase()

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: adminKeys.allMemberships,
    queryFn: async () => {
      const result = await getAllProjectMemberships(supabase)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
  })
}

export function useForceDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? '사용자 삭제에 실패했습니다')
      }
      return res.json() as Promise<{ success: boolean }>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.allUsers })
      queryClient.invalidateQueries({ queryKey: adminKeys.allMemberships })
      toast.success('사용자가 강제 탈퇴되었습니다')
    },
    onError: (error) => {
      toast.error(error.message || '사용자 삭제에 실패했습니다')
    },
  })
}

export function useSetAdminStatus() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) => {
      const result = await setAdminStatus(supabase, userId, isAdmin)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.allUsers })
      toast.success('관리자 상태가 변경되었습니다')
    },
    onError: (error) => {
      toast.error(error.message || '관리자 상태 변경에 실패했습니다')
    },
  })
}
