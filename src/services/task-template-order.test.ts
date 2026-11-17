import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

import { createBrowserClient } from '@/lib/supabase/client'
import { createTaskTemplate, getTaskTemplates } from './task-template-service'

const projectId = 'project-1'
const userId = 'user-1'
const endpoint = 'https://example.supabase.co/rest/v1/task_templates'

function template(id: string, position: number, createdAt = '2026-01-01T00:00:00Z') {
  return {
    id,
    project_id: projectId,
    created_by: userId,
    name: id,
    description_template: null,
    priority: 'medium',
    subtasks_template: [],
    labels_template: [],
    is_personal: false,
    position,
    created_at: createdAt,
    updated_at: createdAt,
  }
}

type Row = ReturnType<typeof template>
let rows: Row[] = []
const server = setupServer(
  http.get(endpoint, ({ request }) => {
    const params = new URL(request.url).searchParams
    const order = (params.get('order') ?? '').split(',')
    const result = rows
      .filter((row) => `eq.${row.project_id}` === params.get('project_id'))
      .sort((a, b) => {
        for (const rule of order) {
          const [field, direction] = rule.split('.') as [keyof Row, string]
          if (a[field] === b[field]) continue
          const comparison = a[field]! < b[field]! ? -1 : 1
          return direction === 'desc' ? -comparison : comparison
        }
        return 0
      })
    return HttpResponse.json(
      params.has('limit') ? result.slice(0, Number(params.get('limit'))) : result,
    )
  }),
  http.post(endpoint, async ({ request }) => {
    const input = (await request.json()) as { name: string; position: number }
    const row = { ...template(input.name, input.position), ...input }
    rows.push(row)
    return HttpResponse.json(row, { status: 201 })
  }),
)

beforeAll(() => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-key')
  server.listen({ onUnhandledRequest: 'error' })
})
beforeEach(() => {
  rows = []
})
afterEach(() => server.resetHandlers())
afterAll(() => {
  server.close()
  vi.unstubAllEnvs()
})

describe('template order through Supabase REST', () => {
  it('같은 순서 값의 템플릿을 생성 시각과 ID로 정렬한다', async () => {
    rows = [
      template('last', 2),
      template('b', 0),
      template('newer', 0, '2026-01-02T00:00:00Z'),
      template('a', 0),
    ]

    const result = await getTaskTemplates(createBrowserClient(), projectId)

    expect(result.error).toBeNull()
    expect(result.data?.map((row) => row.id)).toEqual(['a', 'b', 'newer', 'last'])
  })

  it('빈 목록과 기존 목록 뒤에 가져온 순서대로 추가한다', async () => {
    const client = createBrowserClient()
    const create = (name: string) =>
      createTaskTemplate(client, { project_id: projectId, created_by: userId, name })

    const first = await create('first')
    rows.push(template('existing', 7))
    const second = await create('second')
    const third = await create('third')
    const list = await getTaskTemplates(client, projectId)

    expect([first.data?.position, second.data?.position, third.data?.position]).toEqual([0, 8, 9])
    expect(list.data?.map((row) => row.name)).toEqual(['first', 'existing', 'second', 'third'])
  })

  it('마지막 순서 조회가 실패하면 생성하지 않는다', async () => {
    server.use(
      http.get(endpoint, () =>
        HttpResponse.json({ code: 'PGRST301', message: 'DB error' }, { status: 500 }),
      ),
    )

    const result = await createTaskTemplate(createBrowserClient(), {
      project_id: projectId,
      created_by: userId,
      name: 'first',
    })

    expect(result.error?.code).toBe('PGRST301')
    expect(rows).toEqual([])
  })
})
