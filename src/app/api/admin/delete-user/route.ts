import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

import { isDemoRequest, demoModeResponse, withRateLimit } from '@/lib/api-middleware'
import { RATE_LIMIT } from '@/lib/constants'
import { createServerClient } from '@/lib/supabase/server'

async function handler(req: NextRequest) {
  if (isDemoRequest(req)) return demoModeResponse()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: '서버 환경 변수가 설정되지 않았습니다' }, { status: 500 })
  }

  const supabase = await createServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
  }

  // 관리자 권한 확인
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 })
  }

  const body = (await req.json()) as { userId?: string }
  const targetUserId = body.userId

  if (!targetUserId || typeof targetUserId !== 'string') {
    return NextResponse.json({ error: '삭제할 사용자 ID가 필요합니다' }, { status: 400 })
  }

  // 자기 자신 삭제 방지
  if (targetUserId === user.id) {
    return NextResponse.json({ error: '자기 자신은 강제 탈퇴할 수 없습니다' }, { status: 400 })
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

  try {
    // 1. 대상 유저 소유 프로젝트의 activity_logs 삭제 (트리거 FK 충돌 방지)
    const { data: projects } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('owner_id', targetUserId)

    const projectIds = projects?.map((p) => p.id) ?? []

    if (projectIds.length > 0) {
      await supabaseAdmin.from('activity_logs').delete().in('project_id', projectIds)

      await supabaseAdmin.from('projects').delete().in('id', projectIds)
    }

    // 2. 다른 프로젝트에 남아있는 유저 참조 정리
    await supabaseAdmin.from('subtasks').delete().eq('created_by', targetUserId)
    await supabaseAdmin.from('activity_logs').delete().eq('user_id', targetUserId)
    await supabaseAdmin.from('task_comments').delete().eq('user_id', targetUserId)
    await supabaseAdmin.from('task_attachments').delete().eq('user_id', targetUserId)
    await supabaseAdmin.from('notifications').delete().eq('user_id', targetUserId)
    await supabaseAdmin.from('dashboard_layouts').delete().eq('user_id', targetUserId)
    await supabaseAdmin.from('project_members').delete().eq('user_id', targetUserId)

    // 3. tasks.created_by → NULL 처리
    await supabaseAdmin.from('tasks').update({ created_by: null }).eq('created_by', targetUserId)

    // 4. profiles 삭제 (모든 FK 참조 정리 완료 후)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', targetUserId)

    if (profileError) {
      console.error('[admin/delete-user] Profile delete error:', profileError)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    // 5. auth.users 삭제
    const { error } = await supabaseAdmin.auth.admin.deleteUser(targetUserId)

    if (error) {
      console.error('[admin/delete-user] deleteUser error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[admin/delete-user] Unexpected error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : '알 수 없는 오류' },
      { status: 500 },
    )
  }
}

export const POST = withRateLimit(handler, {
  maxRequests: RATE_LIMIT.STRICT_MAX_REQUESTS,
})
