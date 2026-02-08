'use client'

import { useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Camera, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { AVATAR, PROFILE } from '@/lib/constants'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useProfile, useUpdateProfile, useUploadAvatar, useDeleteAvatar } from '@/queries/use-profile'

import { useAuth } from '@/hooks/use-auth'

const STORAGE_URL_MARKER = `/storage/v1/object/public/${AVATAR.BUCKET_NAME}/`

const profileSchema = z.object({
  full_name: z
    .string()
    .min(PROFILE.NAME_MIN_LENGTH, '이름을 입력해주세요')
    .max(PROFILE.NAME_MAX_LENGTH, `이름은 ${PROFILE.NAME_MAX_LENGTH}자 이내로 입력해주세요`),
})

type ProfileFormValues = z.infer<typeof profileSchema>

function isStorageAvatar(url: string | null): url is string {
  return url !== null && url.includes(STORAGE_URL_MARKER)
}

interface ProfileEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileEditDialog({ open, onOpenChange }: ProfileEditDialogProps) {
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const updateProfile = useUpdateProfile()
  const uploadAvatar = useUploadAvatar()
  const deleteAvatar = useDeleteAvatar()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: {
      full_name: profile?.full_name ?? user?.user_metadata?.full_name ?? '',
    },
  })

  const currentAvatarUrl = profile?.avatar_url ?? user?.user_metadata?.avatar_url ?? null
  const fallbackInitial =
    profile?.full_name?.[0] ?? user?.user_metadata?.full_name?.[0] ?? user?.email?.[0]?.toUpperCase() ?? '?'

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      if (file.size > AVATAR.MAX_FILE_SIZE) {
        toast.error('파일 크기는 2MB 이하만 가능합니다')
        return
      }

      if (!AVATAR.ALLOWED_TYPES.includes(file.type as typeof AVATAR.ALLOWED_TYPES[number])) {
        toast.error('JPG, PNG, GIF, WebP 파일만 업로드 가능합니다')
        return
      }

      // 기존 Supabase Storage 아바타만 삭제 (OAuth 아바타는 건너뜀)
      if (isStorageAvatar(currentAvatarUrl)) {
        await deleteAvatar.mutateAsync(currentAvatarUrl).catch(() => {
          // 기존 파일 삭제 실패해도 계속 진행
        })
      }

      const newUrl = await uploadAvatar.mutateAsync(file)

      await updateProfile.mutateAsync({
        full_name: profile?.full_name ?? user?.user_metadata?.full_name ?? '',
        avatar_url: newUrl,
      })
    } catch {
      // 개별 mutation의 onError에서 toast 처리됨
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDeleteAvatar = async () => {
    if (!currentAvatarUrl) return

    try {
      // Supabase Storage 아바타만 스토리지에서 삭제
      if (isStorageAvatar(currentAvatarUrl)) {
        await deleteAvatar.mutateAsync(currentAvatarUrl).catch(() => {
          // 스토리지 삭제 실패해도 프로필에서 URL 제거
        })
      }

      await updateProfile.mutateAsync({
        full_name: profile?.full_name ?? user?.user_metadata?.full_name ?? '',
        avatar_url: null,
      })
    } catch {
      // 개별 mutation의 onError에서 toast 처리됨
    }
  }

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      await updateProfile.mutateAsync({
        full_name: values.full_name,
        avatar_url: currentAvatarUrl,
      })
      onOpenChange(false)
    } catch {
      // mutation의 onError에서 toast 처리됨
    }
  }

  const isAvatarLoading = uploadAvatar.isPending || deleteAvatar.isPending || updateProfile.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>프로필 설정</DialogTitle>
          <DialogDescription>프로필 사진과 이름을 변경할 수 있습니다.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* 아바타 영역 */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={currentAvatarUrl ?? undefined} alt="프로필 사진" />
                <AvatarFallback className="text-2xl">{fallbackInitial}</AvatarFallback>
              </Avatar>
              {isAvatarLoading && (
                <div className="bg-background/80 absolute inset-0 flex items-center justify-center rounded-full">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isAvatarLoading}
              >
                <Camera className="mr-1.5 h-4 w-4" />
                사진 변경
              </Button>
              {currentAvatarUrl && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteAvatar}
                  disabled={isAvatarLoading}
                >
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  삭제
                </Button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={AVATAR.ALLOWED_TYPES.join(',')}
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* 이름 */}
          <div className="space-y-2">
            <Label htmlFor="full_name">이름</Label>
            <Input
              id="full_name"
              placeholder="이름을 입력하세요"
              {...register('full_name')}
            />
            {errors.full_name && (
              <p className="text-destructive text-sm">{errors.full_name.message}</p>
            )}
          </div>

          {/* 이메일 (읽기 전용) */}
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              value={user?.email ?? ''}
              disabled
              className="bg-muted"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={!isDirty || updateProfile.isPending}
            >
              {updateProfile.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                '저장'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
