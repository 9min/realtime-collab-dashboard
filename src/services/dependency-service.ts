import type { SupabaseClient } from '@supabase/supabase-js'

import type { ServiceResult } from '@/types/common'
import type { Database, InsertTables } from '@/types/database'
import type { TaskDependency } from '@/types/dependency'

type Client = SupabaseClient<Database>

// 프로젝트의 전체 의존성 조회
export async function getDependencies(
  supabase: Client,
  projectId: string,
): Promise<ServiceResult<TaskDependency[]>> {
  const { data, error } = await supabase
    .from('task_dependencies')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  return { data: (data ?? []) as TaskDependency[], error: null }
}

// 의존성 생성
export async function createDependency(
  supabase: Client,
  input: InsertTables<'task_dependencies'>,
): Promise<ServiceResult<TaskDependency>> {
  const { data, error } = await supabase
    .from('task_dependencies')
    .insert(input)
    .select('*')
    .single()

  if (error || !data) {
    return {
      data: null,
      error: { code: error?.code ?? 'UNKNOWN', message: error?.message ?? '의존성 생성 실패' },
    }
  }

  return { data: data as TaskDependency, error: null }
}

// 의존성 삭제
export async function deleteDependency(
  supabase: Client,
  dependencyId: string,
): Promise<ServiceResult<null>> {
  const { error } = await supabase.from('task_dependencies').delete().eq('id', dependencyId)

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  return { data: null, error: null }
}

// 순환 의존성 감지 (DFS)
// 새로운 의존성 (blockingId → blockedId) 추가 시, 이미 blockedId → ... → blockingId 경로가 존재하면 순환
export function hasCyclicDependency(
  dependencies: TaskDependency[],
  blockingId: string,
  blockedId: string,
): boolean {
  // blockingId 에서 blockedId로의 간선을 추가했을 때
  // blockedId에서 시작하여 blockingId에 도달 가능한지 DFS
  const adjacency = new Map<string, string[]>()

  for (const dep of dependencies) {
    const existing = adjacency.get(dep.blocking_task_id)
    if (existing) {
      existing.push(dep.blocked_task_id)
    } else {
      adjacency.set(dep.blocking_task_id, [dep.blocked_task_id])
    }
  }

  // 새 간선 추가
  const existingEdges = adjacency.get(blockingId)
  if (existingEdges) {
    existingEdges.push(blockedId)
  } else {
    adjacency.set(blockingId, [blockedId])
  }

  // blockedId에서 시작하여 DFS로 blockingId 도달 가능성 확인
  // (사실상 blockingId에서 시작해서 blockingId 자신에게 돌아올 수 있는지)
  const visited = new Set<string>()
  const stack = [blockedId]

  while (stack.length > 0) {
    const current = stack.pop()!
    if (current === blockingId) return true
    if (visited.has(current)) continue
    visited.add(current)

    const neighbors = adjacency.get(current)
    if (neighbors) {
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          stack.push(neighbor)
        }
      }
    }
  }

  return false
}
