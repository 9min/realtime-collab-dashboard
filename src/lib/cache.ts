import { getRedis } from './redis'
import { CACHE_KEYS } from './cache-keys'

interface CacheStats {
  hits: number
  misses: number
}

export async function cacheGet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number,
): Promise<{ data: T; cacheStatus: 'hit' | 'miss' | 'bypass' }> {
  const redis = getRedis()

  // No Redis configured — passthrough
  if (!redis) {
    const data = await fetcher()
    return { data, cacheStatus: 'bypass' }
  }

  // Try cache
  try {
    const cached = await redis.get<T>(key)
    if (cached !== null && cached !== undefined) {
      // Track hit
      await redis.incr(CACHE_KEYS.cacheHits()).catch(() => {})
      return { data: cached, cacheStatus: 'hit' }
    }
  } catch {
    // Cache read failed — fall through to fetcher
  }

  // Cache miss — fetch and store
  const data = await fetcher()
  try {
    await redis.set(key, data, { ex: ttlSeconds })
    await redis.incr(CACHE_KEYS.cacheMisses()).catch(() => {})
  } catch {
    // Cache write failed — still return data
  }

  return { data, cacheStatus: 'miss' }
}

export async function cacheInvalidate(key: string): Promise<void> {
  const redis = getRedis()
  if (!redis) return

  try {
    await redis.del(key)
  } catch {
    // Ignore cache invalidation failures
  }
}

export async function getCacheStats(): Promise<CacheStats> {
  const redis = getRedis()
  if (!redis) return { hits: 0, misses: 0 }

  try {
    const [hits, misses] = await Promise.all([
      redis.get<number>(CACHE_KEYS.cacheHits()),
      redis.get<number>(CACHE_KEYS.cacheMisses()),
    ])
    return { hits: hits ?? 0, misses: misses ?? 0 }
  } catch {
    return { hits: 0, misses: 0 }
  }
}
