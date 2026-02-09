-- Subtasks: 태스크의 하위 체크리스트 항목
CREATE TABLE subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  completed BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스: 태스크별 서브태스크 조회 (position 순)
CREATE INDEX idx_subtasks_task_position
  ON subtasks (task_id, position);

-- 인덱스: 프로젝트별 서브태스크 조회
CREATE INDEX idx_subtasks_project
  ON subtasks (project_id);

-- RLS 활성화
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;

-- SELECT: 프로젝트 멤버만 조회 가능
CREATE POLICY "Members can view subtasks"
  ON subtasks FOR SELECT
  USING (is_project_member(project_id));

-- INSERT: viewer 제외 (owner/admin/member)
CREATE POLICY "Non-viewers can create subtasks"
  ON subtasks FOR INSERT
  WITH CHECK (has_project_role(project_id, ARRAY['owner','admin','member']::member_role[]));

-- UPDATE: viewer 제외
CREATE POLICY "Non-viewers can update subtasks"
  ON subtasks FOR UPDATE
  USING (has_project_role(project_id, ARRAY['owner','admin','member']::member_role[]))
  WITH CHECK (has_project_role(project_id, ARRAY['owner','admin','member']::member_role[]));

-- DELETE: viewer 제외
CREATE POLICY "Non-viewers can delete subtasks"
  ON subtasks FOR DELETE
  USING (has_project_role(project_id, ARRAY['owner','admin','member']::member_role[]));

-- Realtime 활성화
ALTER TABLE subtasks REPLICA IDENTITY FULL;

-- updated_at 자동 갱신 트리거
CREATE TRIGGER set_subtasks_updated_at
  BEFORE UPDATE ON subtasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

------------------------------------------------------------------------
-- 트리거 함수: subtasks 변경 시 activity_logs에 기록
------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION log_subtask_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action TEXT;
  v_user_id UUID;
  v_project_id UUID;
  v_entity_id UUID;
  v_metadata JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'created';
    v_user_id := NEW.created_by;
    v_project_id := NEW.project_id;
    v_entity_id := NEW.id;
    v_metadata := jsonb_build_object('title', NEW.title, 'task_id', NEW.task_id);

  ELSIF TG_OP = 'UPDATE' THEN
    -- completed 상태 변경 감지
    IF OLD.completed IS DISTINCT FROM NEW.completed THEN
      v_action := CASE WHEN NEW.completed THEN 'completed' ELSE 'uncompleted' END;
    ELSE
      v_action := 'updated';
    END IF;
    v_user_id := COALESCE(auth.uid(), NEW.created_by);
    v_project_id := NEW.project_id;
    v_entity_id := NEW.id;
    v_metadata := jsonb_build_object('title', NEW.title, 'task_id', NEW.task_id);

  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'deleted';
    v_user_id := COALESCE(auth.uid(), OLD.created_by);
    v_project_id := OLD.project_id;
    v_entity_id := OLD.id;
    v_metadata := jsonb_build_object('title', OLD.title, 'task_id', OLD.task_id);
  END IF;

  INSERT INTO activity_logs (project_id, user_id, action_type, entity_type, entity_id, metadata)
  VALUES (v_project_id, v_user_id, v_action, 'subtask', v_entity_id, v_metadata);

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_subtask_activity
  AFTER INSERT OR UPDATE OR DELETE ON subtasks
  FOR EACH ROW EXECUTE FUNCTION log_subtask_activity();
