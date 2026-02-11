import type { SupabaseClient } from '@supabase/supabase-js'

import type { ServiceResult } from '@/types/common'
import type { Database } from '@/types/database'
import type { UserMessage } from '@/types/user-message'

type Client = SupabaseClient<Database>

export async function getMyMessage(
  supabase: Client,
  userId: string,
): Promise<ServiceResult<UserMessage | null>> {
  const { data, error } = await supabase
    .from('user_messages')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  return { data: data as UserMessage | null, error: null }
}

export async function sendMessage(
  supabase: Client,
  userId: string,
  message: string,
): Promise<ServiceResult<UserMessage>> {
  const { data, error } = await supabase
    .from('user_messages')
    .insert({ user_id: userId, message })
    .select()
    .single()

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  return { data: data as UserMessage, error: null }
}

export async function getAllUserMessages(
  supabase: Client,
): Promise<ServiceResult<UserMessage[]>> {
  const { data, error } = await supabase
    .from('user_messages')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  return { data: data as UserMessage[], error: null }
}

export async function markMessageAsRead(
  supabase: Client,
  messageId: string,
): Promise<ServiceResult<null>> {
  const { error } = await supabase
    .from('user_messages')
    .update({ is_read: true })
    .eq('id', messageId)

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  return { data: null, error: null }
}
