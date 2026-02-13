CREATE TABLE automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  trigger_type TEXT NOT NULL,
  trigger_config JSONB NOT NULL DEFAULT '{}',
  action_type TEXT NOT NULL,
  action_config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  execution_count INTEGER NOT NULL DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE automation_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  project_id UUID NOT NULL,
  trigger_entity_id UUID,
  trigger_data JSONB DEFAULT '{}',
  action_result JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'success',
  error_message TEXT,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Max 20 rules per project
CREATE OR REPLACE FUNCTION check_automation_rule_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT count(*) FROM automation_rules WHERE project_id = NEW.project_id) >= 20 THEN
    RAISE EXCEPTION 'Maximum 20 automation rules per project';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_automation_rule_limit BEFORE INSERT ON automation_rules FOR EACH ROW EXECUTE FUNCTION check_automation_rule_limit();

CREATE INDEX idx_automation_rules_project ON automation_rules(project_id);
CREATE INDEX idx_automation_rules_active ON automation_rules(project_id, is_active);
CREATE INDEX idx_automation_executions_rule ON automation_executions(rule_id);
CREATE INDEX idx_automation_executions_project ON automation_executions(project_id);

ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "automation_rules_select" ON automation_rules FOR SELECT USING (
  EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = automation_rules.project_id AND pm.user_id = auth.uid())
);
CREATE POLICY "automation_rules_insert" ON automation_rules FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = automation_rules.project_id AND pm.user_id = auth.uid() AND pm.role IN ('owner', 'admin'))
  AND created_by = auth.uid()
);
CREATE POLICY "automation_rules_update" ON automation_rules FOR UPDATE USING (
  EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = automation_rules.project_id AND pm.user_id = auth.uid() AND pm.role IN ('owner', 'admin'))
);
CREATE POLICY "automation_rules_delete" ON automation_rules FOR DELETE USING (
  EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = automation_rules.project_id AND pm.user_id = auth.uid() AND pm.role IN ('owner', 'admin'))
);

CREATE POLICY "automation_executions_select" ON automation_executions FOR SELECT USING (
  EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = automation_executions.project_id AND pm.user_id = auth.uid())
);

ALTER TABLE automation_rules REPLICA IDENTITY FULL;
ALTER TABLE automation_executions REPLICA IDENTITY FULL;

CREATE TRIGGER set_automation_rules_updated_at BEFORE UPDATE ON automation_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE projects ADD COLUMN IF NOT EXISTS feature_automations BOOLEAN NOT NULL DEFAULT false;
