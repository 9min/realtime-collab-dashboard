import { describe, it, expect, vi, beforeEach } from 'vitest'
import { cacheGet, cacheInvalidate, getCacheStats } from './cache'

const mockRedis = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  incr: vi.fn(),
}

vi.mock('./redis', () => ({
  getRedis: vi.fn(() => mockRedis),
}))

// Access the mocked getRedis so we can override its return value per-test
import { getRedis } from './redis'
const mockedGetRedis = vi.mocked(getRedis)

beforeEach(() => {
  vi.clearAllMocks()
  mockedGetRedis.mockReturnValue(mockRedis as unknown as ReturnType<typeof getRedis>)
})

describe('cacheGet', () => {
  it('returns cached data on hit', async () => {
    mockRedis.get.mockResolvedValue({ id: 1, name: 'cached' })
    mockRedis.incr.mockResolvedValue(1)

    const fetcher = vi.fn()
    const result = await cacheGet('test-key', fetcher, 300)

    expect(result).toEqual({ data: { id: 1, name: 'cached' }, cacheStatus: 'hit' })
    expect(fetcher).not.toHaveBeenCalled()
    expect(mockRedis.incr).toHaveBeenCalledWith('collab:stats:cache:hit')
  })

  it('calls fetcher on miss and stores result', async () => {
    mockRedis.get.mockResolvedValue(null)
    mockRedis.set.mockResolvedValue('OK')
    mockRedis.incr.mockResolvedValue(1)

    const fetcher = vi.fn().mockResolvedValue({ id: 2, name: 'fresh' })
    const result = await cacheGet('test-key', fetcher, 300)

    expect(result).toEqual({ data: { id: 2, name: 'fresh' }, cacheStatus: 'miss' })
    expect(fetcher).toHaveBeenCalledOnce()
    expect(mockRedis.set).toHaveBeenCalledWith('test-key', { id: 2, name: 'fresh' }, { ex: 300 })
    expect(mockRedis.incr).toHaveBeenCalledWith('collab:stats:cache:miss')
  })

  it('passthrough when Redis not available', async () => {
    mockedGetRedis.mockReturnValue(null)

    const fetcher = vi.fn().mockResolvedValue({ id: 3 })
    const result = await cacheGet('test-key', fetcher, 300)

    expect(result).toEqual({ data: { id: 3 }, cacheStatus: 'bypass' })
    expect(fetcher).toHaveBeenCalledOnce()
    expect(mockRedis.get).not.toHaveBeenCalled()
  })

  it('falls through to fetcher on Redis error', async () => {
    mockRedis.get.mockRejectedValue(new Error('connection failed'))
    mockRedis.set.mockResolvedValue('OK')
    mockRedis.incr.mockResolvedValue(1)

    const fetcher = vi.fn().mockResolvedValue({ id: 4 })
    const result = await cacheGet('test-key', fetcher, 300)

    expect(result).toEqual({ data: { id: 4 }, cacheStatus: 'miss' })
    expect(fetcher).toHaveBeenCalledOnce()
  })
})

describe('cacheInvalidate', () => {
  it('deletes key', async () => {
    mockRedis.del.mockResolvedValue(1)

    await cacheInvalidate('test-key')

    expect(mockRedis.del).toHaveBeenCalledWith('test-key')
  })

  it('no-op when Redis not available', async () => {
    mockedGetRedis.mockReturnValue(null)

    await cacheInvalidate('test-key')

    expect(mockRedis.del).not.toHaveBeenCalled()
  })
})

describe('getCacheStats', () => {
  it('returns hit/miss counts', async () => {
    mockRedis.get.mockImplementation((key: string) => {
      if (key === 'collab:stats:cache:hit') return Promise.resolve(42)
      if (key === 'collab:stats:cache:miss') return Promise.resolve(7)
      return Promise.resolve(null)
    })

    const stats = await getCacheStats()

    expect(stats).toEqual({ hits: 42, misses: 7 })
  })

  it('returns zeros when Redis not available', async () => {
    mockedGetRedis.mockReturnValue(null)

    const stats = await getCacheStats()

    expect(stats).toEqual({ hits: 0, misses: 0 })
  })
})
