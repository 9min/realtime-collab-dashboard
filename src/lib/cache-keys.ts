export const CACHE_KEYS = {
  projectMembers: (projectId: string) => `collab:members:${projectId}`,
  cacheHits: () => 'collab:stats:cache:hit',
  cacheMisses: () => 'collab:stats:cache:miss',
} as const

export const CACHE_TTL = {
  PROJECT_MEMBERS: 300, // 5 minutes
  ADMIN_STATS: 600, // 10 minutes
} as const
