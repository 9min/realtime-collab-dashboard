import type { WebhookPayload, SlackConfig, GitHubConfig } from '@/types/integration'

interface SlackBlock {
  type: string
  text?: { type: string; text: string; emoji?: boolean }
  fields?: { type: string; text: string }[]
}

const EVENT_LABELS = {
  task_created: '새 태스크 생성',
  task_updated: '태스크 수정',
  task_deleted: '태스크 삭제',
} as const

function buildSlackBlocks(payload: WebhookPayload): SlackBlock[] {
  const label = EVENT_LABELS[payload.eventType] ?? payload.eventType

  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: label, emoji: true },
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*태스크:*\n${payload.data.taskTitle ?? '(제목 없음)'}` },
        { type: 'mrkdwn', text: `*작성자:*\n${payload.data.userName ?? '알 수 없음'}` },
      ],
    },
  ]
}

export async function dispatchToSlack(
  config: SlackConfig,
  payload: WebhookPayload,
): Promise<{ success: boolean; error?: string }> {
  if (!config.events.includes(payload.eventType)) {
    return { success: true }
  }

  try {
    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(config.channel ? { channel: config.channel } : {}),
        blocks: buildSlackBlocks(payload),
      }),
    })

    if (!response.ok) {
      return { success: false, error: `Slack API error: ${response.status}` }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function dispatchToGitHub(
  config: GitHubConfig,
  payload: WebhookPayload,
): Promise<{ success: boolean; error?: string }> {
  if (!config.events.includes(payload.eventType)) {
    return { success: true }
  }

  const label = EVENT_LABELS[payload.eventType] ?? payload.eventType

  try {
    const response = await fetch(
      `https://api.github.com/repos/${config.owner}/${config.repo}/issues`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `[${label}] ${payload.data.taskTitle ?? '(제목 없음)'}`,
          body: `**이벤트:** ${label}\n**작성자:** ${payload.data.userName ?? '알 수 없음'}\n**태스크 ID:** ${payload.data.taskId ?? '-'}`,
          labels: ['collaboration'],
        }),
      },
    )

    if (!response.ok) {
      return { success: false, error: `GitHub API error: ${response.status}` }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
