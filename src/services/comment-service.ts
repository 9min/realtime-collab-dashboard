import type { SupabaseClient } from '@supabase/supabase-js'

import type { ServiceResult } from '@/types/common'
import type { TaskCommentWithUser } from '@/types/comment'
import type { Database } from '@/types/database'

type Client = SupabaseClient<Database>

export async function getComments(
  supabase: Client,
  taskId: string,
): Promise<ServiceResult<TaskCommentWithUser[]>> {
  const { data, error } = await supabase
    .from('task_comments')
    .select('*, profiles(*)')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })
    .returns<TaskCommentWithUser[]>()

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  return { data, error: null }
}

interface CreateCommentInput {
  taskId: string
  projectId: string
  userId: string
  content: string
  mentions?: string[]
}

export async function createComment(
  supabase: Client,
  input: CreateCommentInput,
): Promise<ServiceResult<TaskCommentWithUser>> {
  const insertData: Record<string, unknown> = {
    task_id: input.taskId,
    project_id: input.projectId,
    user_id: input.userId,
    content: input.content,
  }
  if (input.mentions && input.mentions.length > 0) {
    insertData.mentions = input.mentions
  }

  const { data, error } = await supabase
    .from('task_comments')
    .insert(insertData as Database['public']['Tables']['task_comments']['Insert'])
    .select('*, profiles(*)')
    .returns<TaskCommentWithUser[]>()
    .single()

  if (error || !data) {
    return {
      data: null,
      error: { code: error?.code ?? 'UNKNOWN', message: error?.message ?? '댓글 작성 실패' },
    }
  }

  return { data, error: null }
}

interface UpdateCommentInput {
  commentId: string
  content: string
}

export async function updateComment(
  supabase: Client,
  input: UpdateCommentInput,
): Promise<ServiceResult<TaskCommentWithUser>> {
  const { data, error } = await supabase
    .from('task_comments')
    .update({ content: input.content })
    .eq('id', input.commentId)
    .select('*, profiles(*)')
    .returns<TaskCommentWithUser[]>()
    .single()

  if (error || !data) {
    return {
      data: null,
      error: { code: error?.code ?? 'UNKNOWN', message: error?.message ?? '댓글 수정 실패' },
    }
  }

  return { data, error: null }
}

export async function deleteComment(
  supabase: Client,
  commentId: string,
): Promise<ServiceResult<null>> {
  const { error } = await supabase
    .from('task_comments')
    .delete()
    .eq('id', commentId)

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  return { data: null, error: null }
}
