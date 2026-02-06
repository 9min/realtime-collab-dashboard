import type { SupabaseClient } from '@supabase/supabase-js'

import { DEFAULT_COLUMNS, MEMBER_ROLE } from '@/lib/constants'
import type { ServiceResult } from '@/types/common'
import type { Database, Tables, InsertTables } from '@/types/database'

type Client = SupabaseClient<Database>
type Project = Tables<'projects'>
type ProjectMember = Tables<'project_members'>
type Profile = Tables<'profiles'>

// 프로젝트 + 멤버 수 조인 타입
export interface ProjectWithMemberCount extends Project {
  member_count: number
}

// 내가 참여 중인 프로젝트 목록 조회
export async function getMyProjects(
  supabase: Client,
): Promise<ServiceResult<ProjectWithMemberCount[]>> {
  // 프로젝트 목록 조회 (RLS가 멤버십 기반 필터링 처리)
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })
    .returns<Project[]>()

  if (projectsError) {
    return { data: null, error: { code: projectsError.code, message: projectsError.message } }
  }

  // 각 프로젝트의 멤버 수 조회
  const projectIds = projects.map((p) => p.id)
  if (projectIds.length === 0) {
    return { data: [], error: null }
  }

  const { data: memberCounts } = await supabase
    .from('project_members')
    .select('project_id')
    .in('project_id', projectIds)
    .returns<Pick<ProjectMember, 'project_id'>[]>()

  // 프로젝트별 멤버 수 집계
  const countMap = new Map<string, number>()
  memberCounts?.forEach((m) => {
    countMap.set(m.project_id, (countMap.get(m.project_id) ?? 0) + 1)
  })

  const result: ProjectWithMemberCount[] = projects.map((p) => ({
    ...p,
    member_count: countMap.get(p.id) ?? 0,
  }))

  return { data: result, error: null }
}

// 프로젝트 단건 조회
export async function getProject(
  supabase: Client,
  projectId: string,
): Promise<ServiceResult<Project>> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .returns<Project>()
    .single()

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  return { data, error: null }
}

// 프로젝트 생성 + owner 멤버 등록 + 기본 칸반 컬럼 생성
export async function createProject(
  supabase: Client,
  input: Pick<InsertTables<'projects'>, 'name' | 'description'>,
): Promise<ServiceResult<Project>> {
  // 현재 유저 확인
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { data: null, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' } }
  }

  // 1. 프로젝트 생성
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({ name: input.name, description: input.description ?? null, owner_id: user.id })
    .select('*')
    .returns<Project[]>()
    .single()

  if (projectError || !project) {
    return {
      data: null,
      error: { code: projectError?.code ?? 'UNKNOWN', message: projectError?.message ?? '프로젝트 생성 실패' },
    }
  }

  // 2. owner를 project_members에 등록
  const { error: memberError } = await supabase
    .from('project_members')
    .insert({ project_id: project.id, user_id: user.id, role: MEMBER_ROLE.OWNER })

  if (memberError) {
    // 롤백: 프로젝트 삭제
    await supabase.from('projects').delete().eq('id', project.id)
    return { data: null, error: { code: memberError.code, message: memberError.message } }
  }

  // 3. 기본 칸반 컬럼 생성
  const columns = DEFAULT_COLUMNS.map((col) => ({
    project_id: project.id,
    title: col.title as string,
    position: col.position as number,
  }))

  const { error: columnError } = await supabase
    .from('kanban_columns')
    .insert(columns)

  if (columnError) {
    // 컬럼 생성 실패는 치명적이지 않음 — 무시하고 진행
    void columnError
  }

  return { data: project, error: null }
}

// 프로젝트 수정
export async function updateProject(
  supabase: Client,
  projectId: string,
  input: Pick<InsertTables<'projects'>, 'name' | 'description'>,
): Promise<ServiceResult<Project>> {
  const { data, error } = await supabase
    .from('projects')
    .update({ name: input.name, description: input.description ?? null })
    .eq('id', projectId)
    .select('*')
    .returns<Project[]>()
    .single()

  if (error || !data) {
    return {
      data: null,
      error: { code: error?.code ?? 'UNKNOWN', message: error?.message ?? '프로젝트 수정 실패' },
    }
  }

  return { data, error: null }
}

// 프로젝트 삭제
export async function deleteProject(
  supabase: Client,
  projectId: string,
): Promise<ServiceResult<null>> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  return { data: null, error: null }
}

// 프로젝트 멤버 목록 조회 (profiles 조인)
export async function getProjectMembers(
  supabase: Client,
  projectId: string,
): Promise<ServiceResult<(ProjectMember & { profiles: Profile })[]>> {
  const { data, error } = await supabase
    .from('project_members')
    .select('*, profiles(*)')
    .eq('project_id', projectId)
    .order('joined_at', { ascending: true })
    .returns<(ProjectMember & { profiles: Profile })[]>()

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  return { data, error: null }
}
