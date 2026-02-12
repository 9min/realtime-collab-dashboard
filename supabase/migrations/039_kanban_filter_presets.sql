-- 칸반 필터 프리셋 저장 테이블
CREATE TABLE kanban_filter_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  filters JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON kanban_filter_presets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE kanban_filter_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "filter_presets_all" ON kanban_filter_presets
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
