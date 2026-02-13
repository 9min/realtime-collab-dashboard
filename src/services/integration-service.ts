import type { SupabaseClient } from '@supabase/supabase-js'

import type { ServiceResult } from '@/types/common'
import type { Database, Json } from '@/types/database'
import type {
  ProjectIntegration,
  IntegrationType,
  SlackConfig,
  GitHubConfig,
} from '@/types/integration'

type Client = SupabaseClient<Database>

export async function getProjectIntegrations(
  supabase: Client,
  projectId: string,
): Promise<ServiceResult<ProjectIntegration[]>> {
  const { data, error } = await supabase
    .from('project_integrations')
    .select('*')
    .eq('project_id', projectId)
    .order('type')

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  return { data: data as unknown as ProjectIntegration[], error: null }
}

export async function upsertIntegration(
  supabase: Client,
  projectId: string,
  type: IntegrationType,
  config: SlackConfig | GitHubConfig,
): Promise<ServiceResult<ProjectIntegration>> {
  const { data, error } = await supabase
    .from('project_integrations')
    .upsert(
      { project_id: projectId, type, config: config as unknown as Json },
      { onConflict: 'project_id,type' },
    )
    .select()
    .single()

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  return { data: data as unknown as ProjectIntegration, error: null }
}

export async function deleteIntegration(
  supabase: Client,
  integrationId: string,
): Promise<ServiceResult<null>> {
  const { error } = await supabase.from('project_integrations').delete().eq('id', integrationId)

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  return { data: null, error: null }
}

export async function toggleIntegration(
  supabase: Client,
  integrationId: string,
  isActive: boolean,
): Promise<ServiceResult<ProjectIntegration>> {
  const { data, error } = await supabase
    .from('project_integrations')
    .update({ is_active: isActive })
    .eq('id', integrationId)
    .select()
    .single()

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  return { data: data as unknown as ProjectIntegration, error: null }
}
