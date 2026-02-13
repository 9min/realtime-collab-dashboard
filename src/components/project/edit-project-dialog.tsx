'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useUpdateProject } from '@/queries/use-projects'
import type { ProjectWithMemberCount } from '@/services/project-service'

const editProjectSchema = z.object({
  name: z
    .string()
    .min(1, '프로젝트 이름을 입력해주세요')
    .max(50, '프로젝트 이름은 50자 이내로 입력해주세요'),
  description: z.string().max(200, '설명은 200자 이내로 입력해주세요').optional(),
})

type EditProjectForm = z.infer<typeof editProjectSchema>

interface EditProjectDialogProps {
  project: ProjectWithMemberCount | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditProjectDialog({ project, open, onOpenChange }: EditProjectDialogProps) {
  const updateProject = useUpdateProject(project?.id ?? '')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditProjectForm>({
    resolver: zodResolver(editProjectSchema),
  })

  // 프로젝트가 변경되면 폼 값 리셋
  useEffect(() => {
    if (project) {
      reset({
        name: project.name,
        description: project.description ?? '',
      })
    }
  }, [project, reset])

  const onSubmit = async (data: EditProjectForm) => {
    if (!project) return

    await updateProject.mutateAsync({
      name: data.name,
      description: data.description ?? null,
    })

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>프로젝트 수정</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <label htmlFor="edit-project-name" className="text-sm font-medium">
                프로젝트 이름 <span className="text-destructive">*</span>
              </label>
              <Input id="edit-project-name" {...register('name')} aria-invalid={!!errors.name} />
              {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-project-desc" className="text-sm font-medium">
                설명 <span className="text-muted-foreground text-xs">(선택)</span>
              </label>
              <Textarea
                id="edit-project-desc"
                rows={3}
                {...register('description')}
                aria-invalid={!!errors.description}
              />
              {errors.description && (
                <p className="text-destructive text-xs">{errors.description.message}</p>
              )}
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateProject.isPending}
            >
              취소
            </Button>
            <Button type="submit" disabled={updateProject.isPending}>
              {updateProject.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              저장
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
