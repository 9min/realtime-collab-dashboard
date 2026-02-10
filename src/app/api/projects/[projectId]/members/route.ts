import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { cacheGet } from '@/lib/cache'
import { CACHE_KEYS, CACHE_TTL } from '@/lib/cache-keys'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params
  const supabase = await createServerClient()

  // Auth check
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
  }

  const { data, cacheStatus } = await cacheGet(
    CACHE_KEYS.projectMembers(projectId),
    async () => {
      const { data, error } = await supabase
        .from('project_members')
        .select('*, profiles(*)')
        .eq('project_id', projectId)
      if (error) throw error
      return data
    },
    CACHE_TTL.PROJECT_MEMBERS,
  )

  return NextResponse.json(data, {
    headers: { 'X-Cache': cacheStatus },
  })
}
