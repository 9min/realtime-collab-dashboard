-- task_dependencies: 태스크 간 의존 관계 (blocks / blocked-by)
CREATE TABLE task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  blocking_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  blocked_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(blocking_task_id, blocked_task_id),
  CHECK(blocking_task_id <> blocked_task_id)
);

-- 인덱스
CREATE INDEX idx_task_deps_blocking ON task_dependencies(blocking_task_id);
CREATE INDEX idx_task_deps_blocked ON task_dependencies(blocked_task_id);
CREATE INDEX idx_task_deps_project ON task_dependencies(project_id);

-- RLS 활성화
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;

-- SELECT: 프로젝트 멤버 전원
CREATE POLICY "Members can view dependencies"
  ON task_dependencies FOR SELECT
  USING (is_project_member(project_id));

-- INSERT: viewer 제외
CREATE POLICY "Non-viewers can create dependencies"
  ON task_dependencies FOR INSERT
  WITH CHECK (has_project_role(project_id, ARRAY['owner','admin','member']::member_role[]));

-- DELETE: viewer 제외
CREATE POLICY "Non-viewers can delete dependencies"
  ON task_dependencies FOR DELETE
  USING (has_project_role(project_id, ARRAY['owner','admin','member']::member_role[]));

-- Realtime 활성화
ALTER TABLE task_dependencies REPLICA IDENTITY FULL;
