import type { SupabaseClient } from '@supabase/supabase-js'

import type { ServiceResult } from '@/types/common'
import type { Database } from '@/types/database'
import type { NotificationWithActor } from '@/types/notification'

type Client = SupabaseClient<Database>

export async function getNotifications(
  supabase: Client,
  userId: string,
  limit = 20,
): Promise<ServiceResult<NotificationWithActor[]>> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*, actor:profiles!notifications_actor_id_fkey(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  return { data: (data ?? []) as unknown as NotificationWithActor[], error: null }
}

export async function getUnreadCount(
  supabase: Client,
  userId: string,
): Promise<ServiceResult<number>> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  return { data: count ?? 0, error: null }
}

export async function markAsRead(
  supabase: Client,
  notificationId: string,
): Promise<ServiceResult<null>> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  return { data: null, error: null }
}

export async function markAllAsRead(
  supabase: Client,
  userId: string,
): Promise<ServiceResult<null>> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  return { data: null, error: null }
}
