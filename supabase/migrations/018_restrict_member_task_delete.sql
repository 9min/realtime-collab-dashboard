-- ============================================
-- 담당자 기반 태스크 수정/삭제 권한 제한
-- ============================================
-- 담당자 있음 → owner, admin, 담당자만 수정/삭제 가능
-- 담당자 없음 → owner, admin, 모든 멤버 수정/삭제 가능
-- viewer → 수정/삭제 불가 (기존 동일)

-- tasks_update 정책 교체
DROP POLICY IF EXISTS "tasks_update" ON tasks;
CREATE POLICY "tasks_update" ON tasks
  FOR UPDATE TO authenticated
  USING (
    has_project_role(project_id, ARRAY['owner', 'admin']::member_role[])
    OR (
      has_project_role(project_id, ARRAY['member']::member_role[])
      AND (assignee_id IS NULL OR assignee_id = auth.uid())
    )
  );

-- tasks_delete 정책 교체
DROP POLICY IF EXISTS "tasks_delete" ON tasks;
CREATE POLICY "tasks_delete" ON tasks
  FOR DELETE TO authenticated
  USING (
    has_project_role(project_id, ARRAY['owner', 'admin']::member_role[])
    OR (
      has_project_role(project_id, ARRAY['member']::member_role[])
      AND (assignee_id IS NULL OR assignee_id = auth.uid())
    )
  );
