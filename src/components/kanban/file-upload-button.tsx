'use client'

import { useRef, useState, useCallback } from 'react'
import { Upload } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE, formatFileSize } from '@/types/attachment'
import { toast } from 'sonner'

interface FileUploadButtonProps {
  onFileSelect: (file: File) => void
  isPending: boolean
}

export function FileUploadButton({ onFileSelect, isPending }: FileUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const validateAndSelect = useCallback(
    (file: File) => {
      if (!ALLOWED_FILE_TYPES.includes(file.type as (typeof ALLOWED_FILE_TYPES)[number])) {
        toast.error('지원하지 않는 파일 형식입니다')
        return
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`파일 크기가 ${formatFileSize(MAX_FILE_SIZE)}을 초과합니다`)
        return
      }
      onFileSelect(file)
    },
    [onFileSelect],
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) validateAndSelect(file)
    // 같은 파일 재선택 허용
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) validateAndSelect(file)
  }

  return (
    <div
      className={cn(
        'border-border rounded-md border-2 border-dashed p-3 text-center transition-colors',
        isDragOver && 'border-primary bg-primary/5',
      )}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragOver(true)
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_FILE_TYPES.join(',')}
        className="hidden"
        onChange={handleChange}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={isPending}
        className="text-xs"
      >
        <Upload className="mr-1 h-3 w-3" />
        {isPending ? '업로드 중...' : '파일 첨부'}
      </Button>
      <p className="text-muted-foreground mt-1 text-[10px]">
        드래그 앤 드롭 또는 클릭 (최대 {formatFileSize(MAX_FILE_SIZE)})
      </p>
    </div>
  )
}
