import type { Tables } from './database'

export interface TaskAttachment {
  id: string
  task_id: string
  project_id: string
  user_id: string
  file_name: string
  file_path: string
  file_size: number
  content_type: string
  created_at: string
}

export interface TaskAttachmentWithUser extends TaskAttachment {
  profiles: Tables<'profiles'>
}

export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
] as const

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function isImageType(contentType: string): boolean {
  return contentType.startsWith('image/')
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}
