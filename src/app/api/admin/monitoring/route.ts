import { NextResponse } from 'next/server'

import { createServerClient } from '@/lib/supabase/server'
import { cacheGet } from '@/lib/cache'
import { CACHE_TTL } from '@/lib/cache-keys'
import { getMonitoringStats } from '@/services/monitoring-service'

export async function GET() {
  const supabase = await createServerClient()

  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
  }

  // Admin check
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 })
  }

  const { data, cacheStatus } = await cacheGet(
    'collab:admin:monitoring',
    () => getMonitoringStats(supabase),
    CACHE_TTL.ADMIN_STATS,
  )

  return NextResponse.json(data, {
    headers: { 'X-Cache': cacheStatus },
  })
}
