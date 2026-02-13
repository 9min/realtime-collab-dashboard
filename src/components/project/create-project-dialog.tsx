'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useCreateProject } from '@/queries/use-projects'

const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, '프로젝트 이름을 입력해주세요')
    .max(50, '프로젝트 이름은 50자 이내로 입력해주세요'),
  description: z.string().max(200, '설명은 200자 이내로 입력해주세요').optional(),
})

type CreateProjectForm = z.infer<typeof createProjectSchema>

export function CreateProjectDialog() {
  const [open, setOpen] = useState(false)
  const createProject = useCreateProject()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateProjectForm>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { name: '', description: '' },
  })

  const onSubmit = async (data: CreateProjectForm) => {
    await createProject.mutateAsync({
      name: data.name,
      description: data.description ?? null,
    })

    reset()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />새 프로젝트
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>새 프로젝트 만들기</DialogTitle>
            <DialogDescription>
              프로젝트를 생성하면 기본 칸반 보드(할 일, 진행 중, 완료, 논의 필요)가 함께 생성됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <label htmlFor="project-name" className="text-sm font-medium">
                프로젝트 이름 <span className="text-destructive">*</span>
              </label>
              <Input
                id="project-name"
                placeholder="예: 마케팅 캠페인"
                {...register('name')}
                aria-invalid={!!errors.name}
              />
              {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor="project-desc" className="text-sm font-medium">
                설명 <span className="text-muted-foreground text-xs">(선택)</span>
              </label>
              <Textarea
                id="project-desc"
                placeholder="프로젝트에 대한 간단한 설명"
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
              onClick={() => setOpen(false)}
              disabled={createProject.isPending}
            >
              취소
            </Button>
            <Button type="submit" disabled={createProject.isPending}>
              {createProject.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              생성
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
