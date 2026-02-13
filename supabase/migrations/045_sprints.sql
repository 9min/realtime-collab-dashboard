CREATE TYPE sprint_status AS ENUM ('planned', 'active', 'completed');

CREATE TABLE sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  goal TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status sprint_status NOT NULL DEFAULT 'planned',
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_date > start_date)
);

CREATE UNIQUE INDEX idx_sprints_active_per_project ON sprints (project_id) WHERE status = 'active';
CREATE INDEX idx_sprints_project ON sprints(project_id);
CREATE INDEX idx_sprints_status ON sprints(status);

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_sprint ON tasks(sprint_id);

ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sprints_select" ON sprints FOR SELECT USING (
  EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = sprints.project_id AND pm.user_id = auth.uid())
);
CREATE POLICY "sprints_insert" ON sprints FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = sprints.project_id AND pm.user_id = auth.uid() AND pm.role IN ('owner', 'admin'))
  AND created_by = auth.uid()
);
CREATE POLICY "sprints_update" ON sprints FOR UPDATE USING (
  EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = sprints.project_id AND pm.user_id = auth.uid() AND pm.role IN ('owner', 'admin'))
);
CREATE POLICY "sprints_delete" ON sprints FOR DELETE USING (
  EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = sprints.project_id AND pm.user_id = auth.uid() AND pm.role IN ('owner', 'admin'))
);

ALTER TABLE sprints REPLICA IDENTITY FULL;

CREATE TRIGGER set_sprints_updated_at BEFORE UPDATE ON sprints FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE projects ADD COLUMN IF NOT EXISTS feature_sprints BOOLEAN NOT NULL DEFAULT false;
