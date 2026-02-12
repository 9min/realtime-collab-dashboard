import { NextRequest, NextResponse } from 'next/server'

import { isDemoRequest, demoModeResponse } from '@/lib/api-middleware'
import { maskToken } from '@/lib/crypto'
import { createServerClient } from '@/lib/supabase/server'
import type { ProjectIntegration, GitHubConfig, SlackConfig } from '@/types/integration'

interface RouteContext {
  params: Promise<{ projectId: string; integrationId: string }>
}

function maskTokenInConfig(config: GitHubConfig | SlackConfig, type: string): GitHubConfig | SlackConfig {
  if (type === 'github') {
    const ghConfig = config as GitHubConfig
    return { ...ghConfig, token: maskToken(ghConfig.token) }
  }
  return config
}

async function checkOwnerOrAdmin(supabase: Awaited<ReturnType<typeof createServerClient>>, projectId: string) {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 }), user: null }
  }

  const { data: membership } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return { error: NextResponse.json({ error: '권한이 없습니다' }, { status: 403 }), user: null }
  }

  return { error: null, user }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  if (isDemoRequest(req)) return demoModeResponse()

  const { projectId, integrationId } = await context.params
  const supabase = await createServerClient()

  const auth = await checkOwnerOrAdmin(supabase, projectId)
  if (auth.error) return auth.error

  const { isActive } = (await req.json()) as { isActive: boolean }

  const { data, error } = await supabase
    .from('project_integrations')
    .update({ is_active: isActive })
    .eq('id', integrationId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const result = data as unknown as ProjectIntegration
  return NextResponse.json({
    ...result,
    config: maskTokenInConfig(result.config, result.type),
  })
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  if (isDemoRequest(req)) return demoModeResponse()

  const { projectId, integrationId } = await context.params
  const supabase = await createServerClient()

  const auth = await checkOwnerOrAdmin(supabase, projectId)
  if (auth.error) return auth.error

  const { error } = await supabase
    .from('project_integrations')
    .delete()
    .eq('id', integrationId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
