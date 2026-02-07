-- ============================================
-- 014_restrict_column_manage.sql
-- 컬럼 추가/삭제 권한을 owner/admin만 허용하도록 변경
-- ============================================

-- 컬럼 삭제: owner/admin만
DROP POLICY IF EXISTS "columns_delete" ON kanban_columns;

CREATE POLICY "columns_delete" ON kanban_columns
  FOR DELETE TO authenticated
  USING (has_project_role(project_id, ARRAY['owner', 'admin']::member_role[]));

-- 컬럼 추가: owner/admin만
DROP POLICY IF EXISTS "columns_insert" ON kanban_columns;

CREATE POLICY "columns_insert" ON kanban_columns
  FOR INSERT TO authenticated
  WITH CHECK (has_project_role(project_id, ARRAY['owner', 'admin']::member_role[]));
