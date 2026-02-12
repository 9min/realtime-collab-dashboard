-- CRIT-01: SELECT 정책을 owner/admin만으로 제한 (토큰 유출 방지)
-- 기존 모든-멤버-조회 정책 삭제 후 owner/admin 전용으로 교체

DROP POLICY IF EXISTS "project_integrations_select" ON project_integrations;

CREATE POLICY "project_integrations_select"
  ON project_integrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = project_integrations.project_id
        AND project_members.user_id = auth.uid()
        AND project_members.role IN ('owner', 'admin')
    )
  );
