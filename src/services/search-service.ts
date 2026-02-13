import type { SupabaseClient } from '@supabase/supabase-js'

import type { ServiceResult } from '@/types/common'
import type { Database } from '@/types/database'
import type { SearchResults } from '@/types/search'

type Client = SupabaseClient<Database>

export async function globalSearch(
  supabase: Client,
  query: string,
): Promise<ServiceResult<SearchResults>> {
  const pattern = `%${query}%`

  // 3개 쿼리를 병렬로 실행 (RLS가 접근 제어 처리)
  const [projectsResult, tasksResult, commentsResult] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name, description')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(5),

    supabase
      .from('tasks')
      .select('id, title, project_id, column_id, projects(name)')
      .ilike('title', pattern)
      .limit(10),

    supabase
      .from('task_comments')
      .select('id, content, task_id, project_id, tasks(title)')
      .ilike('content', pattern)
      .limit(5),
  ])

  if (projectsResult.error) {
    return {
      data: null,
      error: { code: projectsResult.error.code, message: projectsResult.error.message },
    }
  }
  if (tasksResult.error) {
    return {
      data: null,
      error: { code: tasksResult.error.code, message: tasksResult.error.message },
    }
  }
  if (commentsResult.error) {
    return {
      data: null,
      error: { code: commentsResult.error.code, message: commentsResult.error.message },
    }
  }

  const projects = (projectsResult.data ?? []).map((p) => ({
    type: 'project' as const,
    id: p.id,
    name: p.name,
    description: p.description,
  }))

  const tasks = (tasksResult.data ?? []).map((t) => {
    const raw = t as Record<string, unknown>
    const project = raw.projects as { name: string } | null
    return {
      type: 'task' as const,
      id: t.id,
      title: t.title,
      projectId: t.project_id,
      projectName: project?.name ?? '',
      columnId: t.column_id,
    }
  })

  const comments = (commentsResult.data ?? []).map((c) => {
    const raw = c as Record<string, unknown>
    const task = raw.tasks as { title: string } | null
    return {
      type: 'comment' as const,
      id: c.id,
      content: c.content.length > 100 ? c.content.slice(0, 100) + '...' : c.content,
      taskId: c.task_id,
      taskTitle: task?.title ?? '',
      projectId: c.project_id,
    }
  })

  return { data: { projects, tasks, comments }, error: null }
}
