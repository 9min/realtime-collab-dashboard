import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock environment variables
vi.stubEnv('CRON_SECRET', 'test-secret')
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role-key')

const mockInsert = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockLt = vi.fn()
const mockNot = vi.fn()

const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
  })),
}

// Chain mocks for tasks query
mockSelect.mockReturnValue({
  eq: mockEq,
  lt: mockLt,
})
mockEq.mockReturnValue({
  not: mockNot,
})
mockLt.mockReturnValue({
  not: mockNot,
})
mockNot.mockResolvedValue({ data: [] })
mockInsert.mockResolvedValue({ error: null })

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}))

describe('GET /api/cron/due-reminders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNot.mockResolvedValue({ data: [] })
    mockInsert.mockResolvedValue({ error: null })
  })

  it('should return 401 when CRON_SECRET does not match', async () => {
    const { GET } = await import('./route')
    const request = new Request('http://localhost/api/cron/due-reminders', {
      headers: { authorization: 'Bearer wrong-secret' },
    })

    const response = await GET(request)
    expect(response.status).toBe(401)
  })

  it('should return success with counts when authorized', async () => {
    const { GET } = await import('./route')
    const request = new Request('http://localhost/api/cron/due-reminders', {
      headers: { authorization: 'Bearer test-secret' },
    })

    const response = await GET(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.dueTomorrow).toBeDefined()
    expect(json.overdue).toBeDefined()
  })
})
