import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

import { createServerClient } from '@/lib/supabase/server'

export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: '서버 환경 변수가 설정되지 않았습니다' },
      { status: 500 },
    )
  }

  const supabase = await createServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
  const userId = user.id

  try {
    // 1. 유저 소유 프로젝트의 activity_logs 삭제 (트리거 FK 충돌 방지)
    const { data: projects } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('owner_id', userId)

    const projectIds = projects?.map((p) => p.id) ?? []

    if (projectIds.length > 0) {
      await supabaseAdmin
        .from('activity_logs')
        .delete()
        .in('project_id', projectIds)

      await supabaseAdmin
        .from('projects')
        .delete()
        .in('id', projectIds)
    }

    // 2. 다른 프로젝트에 남아있는 유저 참조 정리
    await supabaseAdmin.from('subtasks').delete().eq('created_by', userId)
    await supabaseAdmin.from('activity_logs').delete().eq('user_id', userId)
    await supabaseAdmin.from('task_comments').delete().eq('user_id', userId)
    await supabaseAdmin.from('task_attachments').delete().eq('user_id', userId)
    await supabaseAdmin.from('notifications').delete().eq('user_id', userId)
    await supabaseAdmin.from('dashboard_layouts').delete().eq('user_id', userId)
    await supabaseAdmin.from('project_members').delete().eq('user_id', userId)

    // 3. tasks.created_by → NULL 처리
    await supabaseAdmin
      .from('tasks')
      .update({ created_by: null })
      .eq('created_by', userId)

    // 4. profiles 직접 삭제 (모든 FK 참조 정리 완료 후)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      console.error('[delete-account] Profile delete error:', profileError)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    // 5. auth.users 삭제 (profiles 이미 삭제되어 CASCADE 불필요)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (error) {
      console.error('[delete-account] deleteUser error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[delete-account] Unexpected error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : '알 수 없는 오류' },
      { status: 500 },
    )
  }
}
