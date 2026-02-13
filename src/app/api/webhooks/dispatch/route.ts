import { NextRequest, NextResponse } from 'next/server'

import { isDemoRequest, demoModeResponse } from '@/lib/api-middleware'
import { decrypt } from '@/lib/crypto'
import { createServerClient } from '@/lib/supabase/server'
import { dispatchToSlack, dispatchToGitHub } from '@/services/webhook-dispatcher'
import type {
  ProjectIntegration,
  SlackConfig,
  GitHubConfig,
  WebhookPayload,
} from '@/types/integration'

export async function POST(req: NextRequest) {
  if (isDemoRequest(req)) return demoModeResponse()
  const secret = process.env.WEBHOOK_DISPATCH_SECRET
  const authHeader = req.headers.get('x-webhook-secret')

  let authenticated = false

  if (secret && authHeader === secret) {
    authenticated = true
  }

  if (!authenticated) {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      authenticated = true
    }
  }

  if (!authenticated) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  }

  const body = (await req.json()) as WebhookPayload

  const supabase = await createServerClient()

  const { data: integrations, error } = await supabase
    .from('project_integrations')
    .select('*')
    .eq('project_id', body.projectId)
    .eq('is_active', true)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const results = await Promise.allSettled(
    (integrations as unknown as ProjectIntegration[]).map(async (integration) => {
      if (integration.type === 'slack') {
        return dispatchToSlack(integration.config as SlackConfig, body)
      }
      if (integration.type === 'github') {
        const ghConfig = integration.config as GitHubConfig
        const decryptedConfig: GitHubConfig = { ...ghConfig, token: decrypt(ghConfig.token) }
        return dispatchToGitHub(decryptedConfig, body)
      }
      return { success: false, error: `Unknown type: ${integration.type}` }
    }),
  )

  return NextResponse.json({ dispatched: results.length })
}
