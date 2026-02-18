-- ============================================
-- 051_fix_cascade_delete_subtask_assignee_triggers.sql
-- 프로젝트 CASCADE 삭제 시 subtasks/task_assignees 트리거 FK 위반 수정
-- ============================================
-- 문제: projects 삭제 → subtasks/task_assignees CASCADE 삭제 →
--       AFTER DELETE 트리거가 activity_logs에 INSERT 시도 →
--       projects 행이 삭제되어 FK 위반 발생
-- 해결: 016/020과 동일 패턴 — DELETE 시 프로젝트 존재 여부 확인,
--       없으면 (CASCADE 삭제 상황) 로깅 건너뜀 + user_id 유효성 검사

-- subtasks 트리거 함수
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

    -- CASCADE 삭제 시 프로젝트가 이미 삭제되었으면 로깅 건너뜀
    IF NOT EXISTS (SELECT 1 FROM projects WHERE id = v_project_id) THEN
      RETURN OLD;
    END IF;
  END IF;

  -- user_id가 NULL이거나 프로필이 존재하지 않으면 로깅 건너뜀
  IF v_user_id IS NULL OR NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_user_id) THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  INSERT INTO activity_logs (project_id, user_id, action_type, entity_type, entity_id, metadata)
  VALUES (v_project_id, v_user_id, v_action, 'subtask', v_entity_id, v_metadata);

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- task_assignees 트리거 함수
CREATE OR REPLACE FUNCTION log_task_assignee_change()
RETURNS TRIGGER AS $$
DECLARE
  v_project_id UUID;
  v_user_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT t.project_id INTO v_project_id FROM tasks t WHERE t.id = NEW.task_id;

    v_user_id := auth.uid();
    -- user_id가 NULL이거나 프로필이 존재하지 않으면 로깅 건너뜀
    IF v_user_id IS NULL OR NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_user_id) THEN
      RETURN NEW;
    END IF;

    INSERT INTO activity_logs (project_id, user_id, action_type, entity_type, entity_id, metadata)
    VALUES (v_project_id, v_user_id, 'update', 'task', NEW.task_id,
      jsonb_build_object(
        'field', 'assignee',
        'action', 'added',
        'user_id', NEW.user_id,
        'role', NEW.role
      )
    );

  ELSIF TG_OP = 'DELETE' THEN
    SELECT t.project_id INTO v_project_id FROM tasks t WHERE t.id = OLD.task_id;

    -- CASCADE 삭제 시 task가 이미 삭제되었거나 프로젝트가 없으면 로깅 건너뜀
    IF v_project_id IS NULL OR NOT EXISTS (SELECT 1 FROM projects WHERE id = v_project_id) THEN
      RETURN OLD;
    END IF;

    v_user_id := auth.uid();
    IF v_user_id IS NULL OR NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_user_id) THEN
      RETURN OLD;
    END IF;

    INSERT INTO activity_logs (project_id, user_id, action_type, entity_type, entity_id, metadata)
    VALUES (v_project_id, v_user_id, 'update', 'task', OLD.task_id,
      jsonb_build_object(
        'field', 'assignee',
        'action', 'removed',
        'user_id', OLD.user_id,
        'role', OLD.role
      )
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
