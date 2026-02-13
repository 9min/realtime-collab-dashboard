CREATE TYPE custom_field_type AS ENUM ('text', 'number', 'select', 'date', 'checkbox');

CREATE TABLE custom_field_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 50),
  field_type custom_field_type NOT NULL,
  options JSONB DEFAULT NULL,
  is_required BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, name)
);

CREATE TABLE task_custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES custom_field_definitions(id) ON DELETE CASCADE,
  value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(task_id, field_id)
);

-- Max 20 custom fields per project (trigger function)
CREATE OR REPLACE FUNCTION check_custom_field_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT count(*) FROM custom_field_definitions WHERE project_id = NEW.project_id) >= 20 THEN
    RAISE EXCEPTION 'Maximum 20 custom fields per project';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_custom_field_limit
  BEFORE INSERT ON custom_field_definitions
  FOR EACH ROW
  EXECUTE FUNCTION check_custom_field_limit();

-- Indexes
CREATE INDEX idx_custom_field_defs_project ON custom_field_definitions(project_id);
CREATE INDEX idx_custom_field_values_task ON task_custom_field_values(task_id);
CREATE INDEX idx_custom_field_values_field ON task_custom_field_values(field_id);

-- RLS
ALTER TABLE custom_field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_custom_field_values ENABLE ROW LEVEL SECURITY;

-- Definitions: project members can view, admin/owner can manage
CREATE POLICY "custom_field_defs_select" ON custom_field_definitions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = custom_field_definitions.project_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "custom_field_defs_insert" ON custom_field_definitions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = custom_field_definitions.project_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "custom_field_defs_update" ON custom_field_definitions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = custom_field_definitions.project_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "custom_field_defs_delete" ON custom_field_definitions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = custom_field_definitions.project_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'admin')
    )
  );

-- Values: project members can view, member+ can set
CREATE POLICY "custom_field_values_select" ON task_custom_field_values
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN project_members pm ON pm.project_id = t.project_id
      WHERE t.id = task_custom_field_values.task_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "custom_field_values_insert" ON task_custom_field_values
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN project_members pm ON pm.project_id = t.project_id
      WHERE t.id = task_custom_field_values.task_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "custom_field_values_update" ON task_custom_field_values
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN project_members pm ON pm.project_id = t.project_id
      WHERE t.id = task_custom_field_values.task_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "custom_field_values_delete" ON task_custom_field_values
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN project_members pm ON pm.project_id = t.project_id
      WHERE t.id = task_custom_field_values.task_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'admin', 'member')
    )
  );

ALTER TABLE custom_field_definitions REPLICA IDENTITY FULL;
ALTER TABLE task_custom_field_values REPLICA IDENTITY FULL;

CREATE TRIGGER set_custom_field_defs_updated_at
  BEFORE UPDATE ON custom_field_definitions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_custom_field_values_updated_at
  BEFORE UPDATE ON task_custom_field_values
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Feature flag
ALTER TABLE projects ADD COLUMN IF NOT EXISTS feature_custom_fields BOOLEAN NOT NULL DEFAULT false;
