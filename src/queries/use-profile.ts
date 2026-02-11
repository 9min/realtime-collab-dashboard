'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useSupabase } from '@/components/providers/supabase-provider'
import {
  getProfile,
  updateProfileWithAuth,
  uploadAvatar,
  deleteAvatar,
  deleteAccount,
} from '@/services/auth-service'

import { useAuth } from '@/hooks/use-auth'

// Query Key 팩토리
export const profileKeys = {
  all: ['profile'] as const,
  detail: (userId: string) => ['profile', userId] as const,
}

// 현재 유저 프로필 조회
export function useProfile() {
  const supabase = useSupabase()
  const { user } = useAuth()

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: profileKeys.detail(user?.id ?? ''),
    queryFn: async () => {
      if (!user) throw new Error('로그인이 필요합니다')
      const result = await getProfile(supabase, user.id)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    enabled: !!user?.id,
  })
}

// 프로필 업데이트 (닉네임 + 아바타 URL)
export function useUpdateProfile() {
  const supabase = useSupabase()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { full_name: string; avatar_url: string | null }) => {
      if (!user) throw new Error('로그인이 필요합니다')
      const result = await updateProfileWithAuth(supabase, user.id, input)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: profileKeys.detail(user.id) })
      }
      toast.success('프로필이 수정되었습니다')
    },
    onError: () => {
      toast.error('프로필 수정에 실패했습니다')
    },
  })
}

// 아바타 업로드
export function useUploadAvatar() {
  const supabase = useSupabase()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error('로그인이 필요합니다')
      const result = await uploadAvatar(supabase, user.id, file)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onError: () => {
      toast.error('아바타 업로드에 실패했습니다')
    },
  })
}

// 아바타 삭제
export function useDeleteAvatar() {
  const supabase = useSupabase()

  return useMutation({
    mutationFn: async (avatarUrl: string) => {
      const result = await deleteAvatar(supabase, avatarUrl)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onError: () => {
      toast.error('아바타 삭제에 실패했습니다')
    },
  })
}

// 계정 탈퇴
export function useDeleteAccount() {
  const { signOut } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const result = await deleteAccount()
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: async () => {
      toast.success('계정이 삭제되었습니다')
      queryClient.clear()
      await signOut()
      window.location.href = '/login'
    },
    onError: () => {
      toast.error('계정 삭제에 실패했습니다')
    },
  })
}
