'use client'

import { Download } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useExport } from '@/hooks/use-export'

interface ExportButtonProps {
  projectId: string
  projectName?: string
}

export function ExportButton({ projectId, projectName }: ExportButtonProps) {
  const exportMutation = useExport(projectId, projectName)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5" disabled={exportMutation.isPending}>
          <Download className="h-4 w-4" />
          내보내기
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => exportMutation.mutate('csv')}>
          CSV로 내보내기
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportMutation.mutate('json')}>
          JSON으로 내보내기
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
