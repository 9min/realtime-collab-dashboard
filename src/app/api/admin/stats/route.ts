import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { cacheGet } from '@/lib/cache'
import { CACHE_KEYS, CACHE_TTL } from '@/lib/cache-keys'

export async function GET() {
  const supabase = await createServerClient()

  // Auth + admin check
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 })
  }

  const { data, cacheStatus } = await cacheGet(
    CACHE_KEYS.adminStats(),
    async () => {
      const [usersResult, projectsResult, tasksResult] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('projects').select('id', { count: 'exact', head: true }),
        supabase.from('tasks').select('id', { count: 'exact', head: true }),
      ])
      return {
        totalUsers: usersResult.count ?? 0,
        totalProjects: projectsResult.count ?? 0,
        totalTasks: tasksResult.count ?? 0,
      }
    },
    CACHE_TTL.ADMIN_STATS,
  )

  return NextResponse.json(data, {
    headers: { 'X-Cache': cacheStatus },
  })
}
