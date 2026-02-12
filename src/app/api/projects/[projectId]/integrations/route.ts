import { NextRequest, NextResponse } from 'next/server'

import { isDemoRequest, demoModeResponse } from '@/lib/api-middleware'
import { encrypt, maskToken } from '@/lib/crypto'
import { createServerClient } from '@/lib/supabase/server'
import type { Json } from '@/types/database'
import type { ProjectIntegration, GitHubConfig, SlackConfig } from '@/types/integration'

interface RouteContext {
  params: Promise<{ projectId: string }>
}

function maskTokenInConfig(config: GitHubConfig | SlackConfig, type: string): GitHubConfig | SlackConfig {
  if (type === 'github') {
    const ghConfig = config as GitHubConfig
    return { ...ghConfig, token: maskToken(ghConfig.token) }
  }
  return config
}

export async function GET(req: NextRequest, context: RouteContext) {
  if (isDemoRequest(req)) return demoModeResponse()

  const { projectId } = await context.params
  const supabase = await createServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
  }

  // Check project membership
  const { data: membership } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return NextResponse.json({ error: '프로젝트 멤버가 아닙니다' }, { status: 403 })
  }

  const { data: integrations, error } = await supabase
    .from('project_integrations')
    .select('*')
    .eq('project_id', projectId)
    .order('type')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Mask tokens before returning to client
  const masked = (integrations as unknown as ProjectIntegration[]).map((integration) => ({
    ...integration,
    config: maskTokenInConfig(integration.config, integration.type),
  }))

  return NextResponse.json(masked)
}

export async function POST(req: NextRequest, context: RouteContext) {
  if (isDemoRequest(req)) return demoModeResponse()

  const { projectId } = await context.params
  const supabase = await createServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
  }

  // Check owner/admin role
  const { data: membership } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }

  const { type, config } = (await req.json()) as {
    type: string
    config: GitHubConfig | SlackConfig
  }

  // Encrypt token for GitHub integrations
  let processedConfig = config
  if (type === 'github') {
    const ghConfig = config as GitHubConfig
    if (ghConfig.token) {
      processedConfig = { ...ghConfig, token: encrypt(ghConfig.token) }
    } else {
      // Token not provided — keep existing encrypted token
      const { data: existing } = await supabase
        .from('project_integrations')
        .select('config')
        .eq('project_id', projectId)
        .eq('type', 'github')
        .single()

      if (existing) {
        const existingConfig = existing.config as unknown as GitHubConfig
        processedConfig = { ...ghConfig, token: existingConfig.token }
      }
    }
  }

  const { data, error } = await supabase
    .from('project_integrations')
    .upsert(
      { project_id: projectId, type, config: processedConfig as unknown as Json },
      { onConflict: 'project_id,type' },
    )
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
