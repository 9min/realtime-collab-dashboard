-- ============================================
-- Fix: 모든 RLS 정책 재확인 및 누락 정책 생성
-- ============================================
-- 문제: projects_insert, projects_delete 정책이 누락된 경우
--       프로젝트 생성/삭제 시 42501 (RLS violation) 발생
-- 해결: 전체 정책을 DROP IF EXISTS + CREATE로 재생성

-- 1. 헬퍼 함수 확인 (이미 존재하면 교체)
CREATE OR REPLACE FUNCTION is_project_member(p_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = p_project_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION has_project_role(p_project_id UUID, p_roles member_role[])
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = p_project_id
      AND user_id = auth.uid()
      AND role = ANY(p_roles)
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. 모든 기존 정책 삭제
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "projects_select" ON projects;
DROP POLICY IF EXISTS "projects_insert" ON projects;
DROP POLICY IF EXISTS "projects_update" ON projects;
DROP POLICY IF EXISTS "projects_delete" ON projects;
DROP POLICY IF EXISTS "members_select" ON project_members;
DROP POLICY IF EXISTS "members_insert" ON project_members;
DROP POLICY IF EXISTS "members_delete" ON project_members;
DROP POLICY IF EXISTS "columns_select" ON kanban_columns;
DROP POLICY IF EXISTS "columns_insert" ON kanban_columns;
DROP POLICY IF EXISTS "columns_update" ON kanban_columns;
DROP POLICY IF EXISTS "columns_delete" ON kanban_columns;
DROP POLICY IF EXISTS "tasks_select" ON tasks;
DROP POLICY IF EXISTS "tasks_insert" ON tasks;
DROP POLICY IF EXISTS "tasks_update" ON tasks;
DROP POLICY IF EXISTS "tasks_delete" ON tasks;
DROP POLICY IF EXISTS "layouts_all" ON dashboard_layouts;

-- 3. RLS 활성화 확인
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_layouts ENABLE ROW LEVEL SECURITY;

-- 4. 전체 정책 재생성

-- profiles
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- projects
CREATE POLICY "projects_select" ON projects
  FOR SELECT TO authenticated
  USING (is_project_member(id));
CREATE POLICY "projects_insert" ON projects
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "projects_update" ON projects
  FOR UPDATE TO authenticated
  USING (has_project_role(id, ARRAY['owner', 'admin']::member_role[]));
CREATE POLICY "projects_delete" ON projects
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- project_members
CREATE POLICY "members_select" ON project_members
  FOR SELECT TO authenticated
  USING (is_project_member(project_id));
CREATE POLICY "members_insert" ON project_members
  FOR INSERT TO authenticated
  WITH CHECK (
    has_project_role(project_id, ARRAY['owner', 'admin']::member_role[])
    OR
    (user_id = auth.uid() AND role = 'owner')
  );
CREATE POLICY "members_delete" ON project_members
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR has_project_role(project_id, ARRAY['owner', 'admin']::member_role[])
  );

-- kanban_columns
CREATE POLICY "columns_select" ON kanban_columns
  FOR SELECT TO authenticated
  USING (is_project_member(project_id));
CREATE POLICY "columns_insert" ON kanban_columns
  FOR INSERT TO authenticated
  WITH CHECK (has_project_role(project_id, ARRAY['owner', 'admin', 'member']::member_role[]));
CREATE POLICY "columns_update" ON kanban_columns
  FOR UPDATE TO authenticated
  USING (has_project_role(project_id, ARRAY['owner', 'admin', 'member']::member_role[]));
CREATE POLICY "columns_delete" ON kanban_columns
  FOR DELETE TO authenticated
  USING (has_project_role(project_id, ARRAY['owner', 'admin', 'member']::member_role[]));

-- tasks
CREATE POLICY "tasks_select" ON tasks
  FOR SELECT TO authenticated
  USING (is_project_member(project_id));
CREATE POLICY "tasks_insert" ON tasks
  FOR INSERT TO authenticated
  WITH CHECK (has_project_role(project_id, ARRAY['owner', 'admin', 'member']::member_role[]));
CREATE POLICY "tasks_update" ON tasks
  FOR UPDATE TO authenticated
  USING (has_project_role(project_id, ARRAY['owner', 'admin', 'member']::member_role[]));
CREATE POLICY "tasks_delete" ON tasks
  FOR DELETE TO authenticated
  USING (has_project_role(project_id, ARRAY['owner', 'admin', 'member']::member_role[]));

-- dashboard_layouts
CREATE POLICY "layouts_all" ON dashboard_layouts
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
