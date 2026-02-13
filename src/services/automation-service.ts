import type { SupabaseClient } from '@supabase/supabase-js'

import type { ServiceResult } from '@/types/common'
import type { Database, Json } from '@/types/database'
import type {
  AutomationRule,
  AutomationExecution,
  CreateAutomationRuleInput,
  UpdateAutomationRuleInput,
} from '@/types/automation'

type Client = SupabaseClient<Database>

export async function getAutomationRules(
  supabase: Client,
  projectId: string,
): Promise<ServiceResult<AutomationRule[]>> {
  const { data, error } = await supabase
    .from('automation_rules')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .returns<AutomationRule[]>()

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  return { data, error: null }
}

export async function createAutomationRule(
  supabase: Client,
  input: CreateAutomationRuleInput & { created_by: string },
): Promise<ServiceResult<AutomationRule>> {
  const { data, error } = await supabase
    .from('automation_rules')
    .insert({
      project_id: input.project_id,
      name: input.name,
      trigger_type: input.trigger_type,
      trigger_config: (input.trigger_config ?? {}) as unknown as Json,
      action_type: input.action_type,
      action_config: (input.action_config ?? {}) as unknown as Json,
      created_by: input.created_by,
    })
    .select('*')
    .returns<AutomationRule[]>()
    .single()

  if (error || !data) {
    return {
      data: null,
      error: { code: error?.code ?? 'UNKNOWN', message: error?.message ?? '자동화 규칙 생성 실패' },
    }
  }

  return { data, error: null }
}

export async function updateAutomationRule(
  supabase: Client,
  ruleId: string,
  input: UpdateAutomationRuleInput,
): Promise<ServiceResult<AutomationRule>> {
  const updateData: Record<string, unknown> = { ...input }
  if (input.trigger_config !== undefined) {
    updateData.trigger_config = input.trigger_config as unknown as Json
  }
  if (input.action_config !== undefined) {
    updateData.action_config = input.action_config as unknown as Json
  }

  const { data, error } = await supabase
    .from('automation_rules')
    .update(updateData as Database['public']['Tables']['automation_rules']['Update'])
    .eq('id', ruleId)
    .select('*')
    .returns<AutomationRule[]>()
    .single()

  if (error || !data) {
    return {
      data: null,
      error: { code: error?.code ?? 'UNKNOWN', message: error?.message ?? '자동화 규칙 수정 실패' },
    }
  }

  return { data, error: null }
}

export async function deleteAutomationRule(
  supabase: Client,
  ruleId: string,
): Promise<ServiceResult<null>> {
  const { error } = await supabase.from('automation_rules').delete().eq('id', ruleId)

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  return { data: null, error: null }
}

export async function toggleAutomationRule(
  supabase: Client,
  ruleId: string,
  isActive: boolean,
): Promise<ServiceResult<AutomationRule>> {
  const { data, error } = await supabase
    .from('automation_rules')
    .update({ is_active: isActive })
    .eq('id', ruleId)
    .select('*')
    .returns<AutomationRule[]>()
    .single()

  if (error || !data) {
    return {
      data: null,
      error: {
        code: error?.code ?? 'UNKNOWN',
        message: error?.message ?? '자동화 규칙 토글 실패',
      },
    }
  }

  return { data, error: null }
}

export async function getAutomationExecutions(
  supabase: Client,
  ruleId: string,
  limit = 50,
): Promise<ServiceResult<AutomationExecution[]>> {
  const { data, error } = await supabase
    .from('automation_executions')
    .select('*')
    .eq('rule_id', ruleId)
    .order('executed_at', { ascending: false })
    .limit(limit)
    .returns<AutomationExecution[]>()

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  return { data, error: null }
}
