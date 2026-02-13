-- Task Templates
CREATE TABLE task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  description_template TEXT,
  priority task_priority NOT NULL DEFAULT 'medium',
  subtasks_template JSONB DEFAULT '[]',
  labels_template JSONB DEFAULT '[]',
  is_personal BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_task_templates_project ON task_templates(project_id);
CREATE INDEX idx_task_templates_created_by ON task_templates(created_by);

-- RLS
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;

-- SELECT: project members can view non-personal templates, personal templates only visible to creator
CREATE POLICY "task_templates_select" ON task_templates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = task_templates.project_id
      AND pm.user_id = auth.uid()
    )
    AND (
      NOT is_personal OR created_by = auth.uid()
    )
  );

-- INSERT: project members (not viewers) can create
CREATE POLICY "task_templates_insert" ON task_templates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = task_templates.project_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'admin', 'member')
    )
    AND created_by = auth.uid()
  );

-- UPDATE: creator or admin/owner can update
CREATE POLICY "task_templates_update" ON task_templates
  FOR UPDATE USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = task_templates.project_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'admin')
    )
  );

-- DELETE: creator or admin/owner can delete
CREATE POLICY "task_templates_delete" ON task_templates
  FOR DELETE USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = task_templates.project_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'admin')
    )
  );

-- REPLICA IDENTITY FULL for Realtime
ALTER TABLE task_templates REPLICA IDENTITY FULL;

-- updated_at trigger
CREATE TRIGGER set_task_templates_updated_at
  BEFORE UPDATE ON task_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Feature flag
ALTER TABLE projects ADD COLUMN IF NOT EXISTS feature_templates BOOLEAN NOT NULL DEFAULT true;
-- Update existing projects
UPDATE projects SET feature_templates = true WHERE feature_templates IS NULL;
