-- 프로젝트 외부 연동 설정
CREATE TABLE project_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('slack', 'github')),
  config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, type)
);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_project_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_project_integrations_updated_at
  BEFORE UPDATE ON project_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_project_integrations_updated_at();

-- RLS 활성화
ALTER TABLE project_integrations ENABLE ROW LEVEL SECURITY;

-- SELECT: 프로젝트 멤버 누구나 조회 가능
CREATE POLICY "project_integrations_select"
  ON project_integrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = project_integrations.project_id
        AND project_members.user_id = auth.uid()
    )
  );

-- INSERT: owner 또는 admin만
CREATE POLICY "project_integrations_insert"
  ON project_integrations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = project_integrations.project_id
        AND project_members.user_id = auth.uid()
        AND project_members.role IN ('owner', 'admin')
    )
  );

-- UPDATE: owner 또는 admin만
CREATE POLICY "project_integrations_update"
  ON project_integrations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = project_integrations.project_id
        AND project_members.user_id = auth.uid()
        AND project_members.role IN ('owner', 'admin')
    )
  );

-- DELETE: owner 또는 admin만
CREATE POLICY "project_integrations_delete"
  ON project_integrations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = project_integrations.project_id
        AND project_members.user_id = auth.uid()
        AND project_members.role IN ('owner', 'admin')
    )
  );
