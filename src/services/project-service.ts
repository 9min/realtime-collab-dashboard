import type { SupabaseClient } from '@supabase/supabase-js'

import type { MemberRole, ServiceResult } from '@/types/common'
import type { Database, Tables, InsertTables } from '@/types/database'

type Client = SupabaseClient<Database>
type Project = Tables<'projects'>
type ProjectMember = Tables<'project_members'>
type Profile = Tables<'profiles'>

// 프로젝트 + 멤버 수 + 현재 유저 역할
export interface ProjectWithMemberCount extends Project {
  member_count: number
  current_user_role: MemberRole | null
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

  // 각 프로젝트의 멤버 수 + 현재 유저 역할 조회
  const projectIds = projects.map((p) => p.id)
  if (projectIds.length === 0) {
    return { data: [], error: null }
  }

  const { data: { user } } = await supabase.auth.getUser()

  const { data: memberData } = await supabase
    .from('project_members')
    .select('project_id, user_id, role')
    .in('project_id', projectIds)
    .returns<Pick<ProjectMember, 'project_id' | 'user_id' | 'role'>[]>()

  // 프로젝트별 멤버 수 집계 + 현재 유저 역할 매핑
  const countMap = new Map<string, number>()
  const roleMap = new Map<string, MemberRole>()
  memberData?.forEach((m) => {
    countMap.set(m.project_id, (countMap.get(m.project_id) ?? 0) + 1)
    if (m.user_id === user?.id) {
      roleMap.set(m.project_id, m.role as MemberRole)
    }
  })

  const result: ProjectWithMemberCount[] = projects.map((p) => ({
    ...p,
    member_count: countMap.get(p.id) ?? 0,
    current_user_role: roleMap.get(p.id) ?? null,
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

// 프로젝트 생성 (SECURITY DEFINER RPC로 원자적 처리)
// RPC가 프로젝트 + owner 멤버 + 기본 칸반 컬럼을 단일 트랜잭션으로 생성
export async function createProject(
  supabase: Client,
  input: Pick<InsertTables<'projects'>, 'name' | 'description'>,
): Promise<ServiceResult<Project>> {
  // RPC 호출: create_project_with_defaults → UUID 반환
  const { data: projectId, error: rpcError } = await supabase.rpc(
    'create_project_with_defaults',
    { p_name: input.name, p_description: input.description ?? null },
  )

  if (rpcError || !projectId) {
    return {
      data: null,
      error: { code: rpcError?.code ?? 'UNKNOWN', message: rpcError?.message ?? '프로젝트 생성 실패' },
    }
  }

  // 생성된 프로젝트 전체 데이터 조회 (RPC는 UUID만 반환)
  // 이 시점에는 멤버가 이미 등록되어 있으므로 SELECT RLS 통과
  const { data: project, error: fetchError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .returns<Project[]>()
    .single()

  if (fetchError || !project) {
    return {
      data: null,
      error: { code: fetchError?.code ?? 'UNKNOWN', message: fetchError?.message ?? '프로젝트 조회 실패' },
    }
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

// 멤버 초대 (이메일 기반)
export async function inviteMember(
  supabase: Client,
  projectId: string,
  email: string,
  role: 'owner' | 'admin' | 'member' | 'viewer',
): Promise<ServiceResult<ProjectMember>> {
  // 1. 이메일로 유저 조회
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .returns<Pick<Profile, 'id'>[]>()
    .single()

  if (profileError || !profile) {
    return {
      data: null,
      error: { code: 'USER_NOT_FOUND', message: '해당 이메일의 사용자를 찾을 수 없습니다' },
    }
  }

  // 2. 이미 멤버인지 확인
  const { data: existing } = await supabase
    .from('project_members')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', profile.id)
    .returns<Pick<ProjectMember, 'id'>[]>()
    .maybeSingle()

  if (existing) {
    return {
      data: null,
      error: { code: 'ALREADY_MEMBER', message: '이미 프로젝트 멤버입니다' },
    }
  }

  // 3. 멤버 추가
  const { data, error } = await supabase
    .from('project_members')
    .insert({ project_id: projectId, user_id: profile.id, role })
    .select('*')
    .returns<ProjectMember[]>()
    .single()

  if (error || !data) {
    return {
      data: null,
      error: { code: error?.code ?? 'UNKNOWN', message: error?.message ?? '멤버 초대 실패' },
    }
  }

  return { data, error: null }
}

// 멤버 역할 변경
export async function updateMemberRole(
  supabase: Client,
  memberId: string,
  role: 'admin' | 'member' | 'viewer',
): Promise<ServiceResult<ProjectMember>> {
  const { data, error } = await supabase
    .from('project_members')
    .update({ role })
    .eq('id', memberId)
    .select('*')
    .returns<ProjectMember[]>()
    .single()

  if (error || !data) {
    return {
      data: null,
      error: { code: error?.code ?? 'UNKNOWN', message: error?.message ?? '역할 변경 실패' },
    }
  }

  return { data, error: null }
}

// 멤버 제거
export async function removeMember(
  supabase: Client,
  memberId: string,
): Promise<ServiceResult<null>> {
  const { error } = await supabase
    .from('project_members')
    .delete()
    .eq('id', memberId)

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  return { data: null, error: null }
}
