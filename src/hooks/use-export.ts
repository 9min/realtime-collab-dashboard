'use client'

import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useSupabase } from '@/components/providers/supabase-provider'
import { exportAsCsv, exportAsJson } from '@/services/export-service'

type ExportFormat = 'csv' | 'json'

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function useExport(projectId: string, projectName?: string) {
  const supabase = useSupabase()

  return useMutation({
    mutationFn: async (format: ExportFormat) => {
      const safeName = (projectName ?? 'project').replace(/[^a-zA-Z0-9가-힣_-]/g, '_')
      const timestamp = new Date().toISOString().slice(0, 10)

      if (format === 'csv') {
        const csv = await exportAsCsv(supabase, projectId)
        downloadBlob(csv, `${safeName}_${timestamp}.csv`, 'text/csv;charset=utf-8;')
      } else {
        const json = await exportAsJson(supabase, projectId)
        downloadBlob(json, `${safeName}_${timestamp}.json`, 'application/json')
      }
    },
    onSuccess: () => {
      toast.success('내보내기가 완료되었습니다')
    },
    onError: () => {
      toast.error('내보내기에 실패했습니다')
    },
  })
}
