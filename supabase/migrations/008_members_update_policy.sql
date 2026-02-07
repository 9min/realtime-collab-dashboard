-- ============================================
-- 멤버 역할 변경을 위한 UPDATE 정책 추가
-- ============================================
-- 문제: project_members에 UPDATE 정책이 없어 역할 변경이 RLS에 막힘
-- 해결: owner/admin만 역할 변경 가능 + owner 역할은 변경 불가

CREATE POLICY "members_update" ON project_members
  FOR UPDATE TO authenticated
  USING (has_project_role(project_id, ARRAY['owner', 'admin']::member_role[]))
  WITH CHECK (has_project_role(project_id, ARRAY['owner', 'admin']::member_role[]));
