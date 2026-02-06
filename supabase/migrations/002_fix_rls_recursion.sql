-- ============================================
-- Fix: RLS 무한 재귀 해결
-- ============================================
-- 문제: project_members 정책이 자기 자신을 서브쿼리 → 무한 루프
-- 해결: SECURITY DEFINER 함수로 RLS 우회 멤버십 체크

-- 1. 멤버십 확인 함수 (RLS 우회)
CREATE OR REPLACE FUNCTION is_project_member(p_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = p_project_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 역할 기반 멤버십 확인
CREATE OR REPLACE FUNCTION has_project_role(p_project_id UUID, p_roles member_role[])
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = p_project_id
      AND user_id = auth.uid()
      AND role = ANY(p_roles)
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. 기존 정책 삭제
DROP POLICY IF EXISTS "projects_select" ON projects;
DROP POLICY IF EXISTS "projects_update" ON projects;
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

-- 3. 수정된 정책 재생성

-- projects
CREATE POLICY "projects_select" ON projects
  FOR SELECT TO authenticated
  USING (is_project_member(id));
CREATE POLICY "projects_update" ON projects
  FOR UPDATE TO authenticated
  USING (has_project_role(id, ARRAY['owner', 'admin']::member_role[]));

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
