import type { SupabaseClient } from '@supabase/supabase-js'

import type { ServiceResult } from '@/types/common'
import type { Database } from '@/types/database'
import type { TaskAttachmentWithUser } from '@/types/attachment'

type Client = SupabaseClient<Database>

const BUCKET_NAME = 'task-attachments'

export async function getAttachments(
  supabase: Client,
  taskId: string,
): Promise<ServiceResult<TaskAttachmentWithUser[]>> {
  const { data, error } = await supabase
    .from('task_attachments')
    .select('*, profiles(*)')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false })

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  return { data: (data ?? []) as unknown as TaskAttachmentWithUser[], error: null }
}

interface UploadAttachmentInput {
  taskId: string
  projectId: string
  userId: string
  file: File
}

export async function uploadAttachment(
  supabase: Client,
  input: UploadAttachmentInput,
): Promise<ServiceResult<TaskAttachmentWithUser>> {
  const { taskId, projectId, userId, file } = input

  // 유니크 파일 경로 생성
  const fileExt = file.name.split('.').pop() ?? ''
  const uniqueId = crypto.randomUUID()
  const filePath = `${projectId}/${taskId}/${uniqueId}.${fileExt}`

  // 1. Storage 업로드
  const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(filePath, file, {
    contentType: file.type,
    upsert: false,
  })

  if (uploadError) {
    return {
      data: null,
      error: { code: 'UPLOAD_FAILED', message: uploadError.message },
    }
  }

  // 2. DB 레코드 생성
  const { data, error: dbError } = await supabase
    .from('task_attachments')
    .insert({
      task_id: taskId,
      project_id: projectId,
      user_id: userId,
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
      content_type: file.type,
    })
    .select('*, profiles(*)')
    .single()

  if (dbError || !data) {
    // 롤백: Storage 파일 삭제
    await supabase.storage.from(BUCKET_NAME).remove([filePath])
    return {
      data: null,
      error: {
        code: dbError?.code ?? 'UNKNOWN',
        message: dbError?.message ?? '첨부파일 등록 실패',
      },
    }
  }

  return { data: data as unknown as TaskAttachmentWithUser, error: null }
}

export async function deleteAttachment(
  supabase: Client,
  attachmentId: string,
  filePath: string,
): Promise<ServiceResult<null>> {
  // 1. DB 레코드 삭제
  const { error: dbError } = await supabase.from('task_attachments').delete().eq('id', attachmentId)

  if (dbError) {
    return { data: null, error: { code: dbError.code, message: dbError.message } }
  }

  // 2. Storage 파일 삭제
  await supabase.storage.from(BUCKET_NAME).remove([filePath])

  return { data: null, error: null }
}

export function getPublicUrl(supabase: Client, filePath: string): string {
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath)
  return data.publicUrl
}
