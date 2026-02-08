'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useSupabase } from '@/components/providers/supabase-provider'
import { getAllUsers, setAdminStatus, getMyProfile } from '@/services/admin-service'

export const adminKeys = {
  myProfile: ['admin', 'my-profile'] as const,
  allUsers: ['admin', 'users'] as const,
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
