import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database'

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: Request) {
  // Vercel Cron 인증
  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Missing env vars' }, { status: 500 })
  }

  // service_role로 RLS 우회
  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey)

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  let dueTomorrowCount = 0
  let overdueCount = 0

  // 1. 내일 마감(D-1) 태스크
  const { data: dueTomorrow } = await supabase
    .from('tasks')
    .select('id, title, project_id, assignee_id')
    .eq('due_date', tomorrowStr)
    .not('assignee_id', 'is', null)

  if (dueTomorrow) {
    for (const task of dueTomorrow) {
      const { error: logError } = await supabase
        .from('due_date_notifications_log' as never)
        .insert({
          task_id: task.id,
          user_id: task.assignee_id,
          notification_type: 'due_tomorrow',
          notified_date: todayStr,
        } as never)

      // UNIQUE 제약 위반 = 이미 전송됨 → skip
      if (logError) continue

      await supabase.from('notifications').insert({
        user_id: task.assignee_id!,
        type: 'due_soon',
        title: '마감 임박',
        message: `"${task.title}" 태스크가 내일 마감입니다`,
        entity_type: 'task',
        entity_id: task.id,
        project_id: task.project_id,
      })

      dueTomorrowCount++
    }
  }

  // 2. 기한 초과 태스크
  const { data: overdue } = await supabase
    .from('tasks')
    .select('id, title, project_id, assignee_id')
    .lt('due_date', todayStr)
    .not('assignee_id', 'is', null)

  if (overdue) {
    for (const task of overdue) {
      const { error: logError } = await supabase
        .from('due_date_notifications_log' as never)
        .insert({
          task_id: task.id,
          user_id: task.assignee_id,
          notification_type: 'overdue',
          notified_date: todayStr,
        } as never)

      if (logError) continue

      await supabase.from('notifications').insert({
        user_id: task.assignee_id!,
        type: 'due_soon',
        title: '기한 초과',
        message: `"${task.title}" 태스크의 마감 기한이 지났습니다`,
        entity_type: 'task',
        entity_id: task.id,
        project_id: task.project_id,
      })

      overdueCount++
    }
  }

  return NextResponse.json({
    success: true,
    dueTomorrow: dueTomorrowCount,
    overdue: overdueCount,
  })
}
