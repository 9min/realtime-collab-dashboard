import { NextRequest, NextResponse } from 'next/server'

import { isDemoRequest, demoModeResponse } from '@/lib/api-middleware'
import { createServerClient } from '@/lib/supabase/server'
import { isValidSlackWebhookUrl } from '@/lib/url-validator'

export async function POST(req: NextRequest) {
  if (isDemoRequest(req)) return demoModeResponse()
  const supabase = await createServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
  }

  const { webhookUrl } = (await req.json()) as { webhookUrl: string }

  if (!webhookUrl) {
    return NextResponse.json({ error: 'webhookUrl이 필요합니다' }, { status: 400 })
  }

  if (!isValidSlackWebhookUrl(webhookUrl)) {
    return NextResponse.json(
      { error: 'Slack Webhook URL만 허용됩니다 (https://hooks.slack.com/services/...)' },
      { status: 400 },
    )
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blocks: [
          {
            type: 'header',
            text: { type: 'plain_text', text: '연동 테스트', emoji: true },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '실시간 협업 대시보드와의 Slack 연동이 정상적으로 설정되었습니다!',
            },
          },
        ],
      }),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Slack 응답 오류: ${response.status}` },
        { status: 502 },
      )
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Slack 웹훅 전송에 실패했습니다' },
      { status: 502 },
    )
  }
}
