import { describe, it, expect, vi, beforeEach } from 'vitest'

import type { SlackConfig, GitHubConfig, WebhookPayload } from '@/types/integration'

import { dispatchToSlack, dispatchToGitHub } from './webhook-dispatcher'

const mockFetch = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch)
  mockFetch.mockReset()
})

const BASE_PAYLOAD: WebhookPayload = {
  projectId: 'proj-1',
  eventType: 'task_created',
  data: {
    taskTitle: 'Test Task',
    taskId: 'task-1',
    userName: 'John',
  },
}

describe('dispatchToSlack', () => {
  const slackConfig: SlackConfig = {
    webhookUrl: 'https://hooks.slack.com/services/test',
    channel: '#dev',
    events: ['task_created', 'task_updated'],
  }

  it('sends correct payload to Slack', async () => {
    mockFetch.mockResolvedValue({ ok: true })

    const result = await dispatchToSlack(slackConfig, BASE_PAYLOAD)

    expect(result.success).toBe(true)
    expect(mockFetch).toHaveBeenCalledOnce()

    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toBe('https://hooks.slack.com/services/test')
    expect(options.method).toBe('POST')

    const body = JSON.parse(options.body)
    expect(body.channel).toBe('#dev')
    expect(body.blocks).toHaveLength(2)
    expect(body.blocks[0].type).toBe('header')
  })

  it('skips unsubscribed events', async () => {
    const result = await dispatchToSlack(slackConfig, {
      ...BASE_PAYLOAD,
      eventType: 'task_deleted',
    })

    expect(result.success).toBe(true)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('handles fetch errors', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    const result = await dispatchToSlack(slackConfig, BASE_PAYLOAD)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Network error')
  })

  it('handles non-ok response', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 })

    const result = await dispatchToSlack(slackConfig, BASE_PAYLOAD)

    expect(result.success).toBe(false)
    expect(result.error).toContain('500')
  })

  it('omits channel when not specified', async () => {
    const configWithoutChannel: SlackConfig = {
      webhookUrl: 'https://hooks.slack.com/services/test',
      events: ['task_created'],
    }

    mockFetch.mockResolvedValue({ ok: true })

    await dispatchToSlack(configWithoutChannel, BASE_PAYLOAD)

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.channel).toBeUndefined()
  })
})

describe('dispatchToGitHub', () => {
  const githubConfig: GitHubConfig = {
    owner: 'my-org',
    repo: 'my-repo',
    token: 'ghp_test123',
    events: ['task_created', 'task_deleted'],
  }

  it('sends correct payload to GitHub', async () => {
    mockFetch.mockResolvedValue({ ok: true })

    const result = await dispatchToGitHub(githubConfig, BASE_PAYLOAD)

    expect(result.success).toBe(true)
    expect(mockFetch).toHaveBeenCalledOnce()

    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toBe('https://api.github.com/repos/my-org/my-repo/issues')
    expect(options.headers.Authorization).toBe('Bearer ghp_test123')

    const body = JSON.parse(options.body)
    expect(body.title).toContain('Test Task')
    expect(body.labels).toContain('collaboration')
  })

  it('skips unsubscribed events', async () => {
    const result = await dispatchToGitHub(githubConfig, {
      ...BASE_PAYLOAD,
      eventType: 'task_updated',
    })

    expect(result.success).toBe(true)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('handles fetch errors', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    const result = await dispatchToGitHub(githubConfig, BASE_PAYLOAD)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Network error')
  })

  it('handles non-ok response', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 403 })

    const result = await dispatchToGitHub(githubConfig, BASE_PAYLOAD)

    expect(result.success).toBe(false)
    expect(result.error).toContain('403')
  })
})
