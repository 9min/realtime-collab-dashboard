-- Activity Logs 테이블: 프로젝트 활동 자동 기록
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,    -- 'created' | 'updated' | 'deleted' | 'moved'
  entity_type TEXT NOT NULL,    -- 'task' | 'column' | 'member'
  entity_id UUID NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스: 프로젝트별 최신순 조회
CREATE INDEX idx_activity_logs_project_created
  ON activity_logs (project_id, created_at DESC);

-- RLS 활성화
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- SELECT: 프로젝트 멤버만 조회 가능
CREATE POLICY "Members can view activity logs"
  ON activity_logs FOR SELECT
  USING (is_project_member(project_id));

-- INSERT는 트리거(SECURITY DEFINER)로만 수행하므로 일반 정책 없음

-- Realtime 활성화를 위한 REPLICA IDENTITY
ALTER TABLE activity_logs REPLICA IDENTITY FULL;

------------------------------------------------------------------------
-- 트리거 함수: tasks 변경 시 activity_logs에 기록
------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION log_task_activity()
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
    v_metadata := jsonb_build_object('title', NEW.title);

  ELSIF TG_OP = 'UPDATE' THEN
    -- column_id 변경 시 'moved', 나머지는 'updated'
    IF OLD.column_id IS DISTINCT FROM NEW.column_id THEN
      v_action := 'moved';
      v_metadata := jsonb_build_object(
        'title', NEW.title,
        'from_column_id', OLD.column_id,
        'to_column_id', NEW.column_id
      );
    ELSE
      v_action := 'updated';
      v_metadata := jsonb_build_object('title', NEW.title);
    END IF;
    v_user_id := COALESCE(auth.uid(), NEW.created_by);
    v_project_id := NEW.project_id;
    v_entity_id := NEW.id;

  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'deleted';
    v_user_id := COALESCE(auth.uid(), OLD.created_by);
    v_project_id := OLD.project_id;
    v_entity_id := OLD.id;
    v_metadata := jsonb_build_object('title', OLD.title);
  END IF;

  INSERT INTO activity_logs (project_id, user_id, action_type, entity_type, entity_id, metadata)
  VALUES (v_project_id, v_user_id, v_action, 'task', v_entity_id, v_metadata);

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_task_activity
  AFTER INSERT OR UPDATE OR DELETE ON tasks
  FOR EACH ROW EXECUTE FUNCTION log_task_activity();

------------------------------------------------------------------------
-- 트리거 함수: kanban_columns 변경 시 activity_logs에 기록
------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION log_column_activity()
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
  v_user_id := COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000');

  IF TG_OP = 'INSERT' THEN
    v_action := 'created';
    v_project_id := NEW.project_id;
    v_entity_id := NEW.id;
    v_metadata := jsonb_build_object('title', NEW.title);

  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'deleted';
    v_project_id := OLD.project_id;
    v_entity_id := OLD.id;
    v_metadata := jsonb_build_object('title', OLD.title);

  ELSE
    -- UPDATE: 위치만 변경된 경우 로그 생략
    IF OLD.title IS NOT DISTINCT FROM NEW.title THEN
      RETURN NEW;
    END IF;
    v_action := 'updated';
    v_project_id := NEW.project_id;
    v_entity_id := NEW.id;
    v_metadata := jsonb_build_object('title', NEW.title, 'old_title', OLD.title);
  END IF;

  INSERT INTO activity_logs (project_id, user_id, action_type, entity_type, entity_id, metadata)
  VALUES (v_project_id, v_user_id, v_action, 'column', v_entity_id, v_metadata);

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_column_activity
  AFTER INSERT OR UPDATE OR DELETE ON kanban_columns
  FOR EACH ROW EXECUTE FUNCTION log_column_activity();

------------------------------------------------------------------------
-- 트리거 함수: project_members 변경 시 activity_logs에 기록
------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION log_member_activity()
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
  v_user_id := COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000');

  IF TG_OP = 'INSERT' THEN
    v_action := 'created';
    v_project_id := NEW.project_id;
    v_entity_id := NEW.id;
    v_metadata := jsonb_build_object('member_user_id', NEW.user_id, 'role', NEW.role);

  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'deleted';
    v_project_id := OLD.project_id;
    v_entity_id := OLD.id;
    v_metadata := jsonb_build_object('member_user_id', OLD.user_id, 'role', OLD.role);

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.role IS NOT DISTINCT FROM NEW.role THEN
      RETURN NEW;
    END IF;
    v_action := 'updated';
    v_project_id := NEW.project_id;
    v_entity_id := NEW.id;
    v_metadata := jsonb_build_object('member_user_id', NEW.user_id, 'old_role', OLD.role, 'new_role', NEW.role);
  END IF;

  INSERT INTO activity_logs (project_id, user_id, action_type, entity_type, entity_id, metadata)
  VALUES (v_project_id, v_user_id, v_action, 'member', v_entity_id, v_metadata);

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_member_activity
  AFTER INSERT OR UPDATE OR DELETE ON project_members
  FOR EACH ROW EXECUTE FUNCTION log_member_activity();
