import type { SupabaseClient } from '@supabase/supabase-js'

import type { ServiceResult } from '@/types/common'
import type { Database, Tables } from '@/types/database'

type Client = SupabaseClient<Database>
type Profile = Tables<'profiles'>

export async function getAllUsers(
  supabase: Client,
): Promise<ServiceResult<Profile[]>> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true })
    .returns<Profile[]>()

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  return { data, error: null }
}

export async function setAdminStatus(
  supabase: Client,
  userId: string,
  isAdmin: boolean,
): Promise<ServiceResult<null>> {
  const { error } = await supabase.rpc('set_admin_status', {
    p_user_id: userId,
    p_is_admin: isAdmin,
  })

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  return { data: null, error: null }
}

export async function getMyProfile(
  supabase: Client,
): Promise<ServiceResult<Profile>> {
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { data: null, error: { code: 'AUTH_ERROR', message: authError?.message ?? 'Not authenticated' } }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .returns<Profile>()
    .single()

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  return { data, error: null }
}
