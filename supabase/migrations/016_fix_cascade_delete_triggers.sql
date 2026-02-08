-- ============================================
-- 016_fix_cascade_delete_triggers.sql
-- 프로젝트 CASCADE 삭제 시 activity_logs INSERT FK 위반 수정
-- ============================================
-- 문제: projects 삭제 → CASCADE로 tasks/columns/members 삭제 →
--       AFTER DELETE 트리거가 activity_logs에 INSERT 시도 →
--       projects 행이 삭제되어 FK 위반 발생
-- 해결: 트리거 함수에서 DELETE 시 프로젝트 존재 여부를 확인하고,
--       없으면 (CASCADE 삭제 상황) 로깅을 건너뜀

-- tasks 트리거 함수
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

    -- CASCADE 삭제 시 프로젝트가 이미 삭제되었으면 로깅 건너뜀
    IF NOT EXISTS (SELECT 1 FROM projects WHERE id = v_project_id) THEN
      RETURN OLD;
    END IF;
  END IF;

  INSERT INTO activity_logs (project_id, user_id, action_type, entity_type, entity_id, metadata)
  VALUES (v_project_id, v_user_id, v_action, 'task', v_entity_id, v_metadata);

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- kanban_columns 트리거 함수
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

    -- CASCADE 삭제 시 프로젝트가 이미 삭제되었으면 로깅 건너뜀
    IF NOT EXISTS (SELECT 1 FROM projects WHERE id = v_project_id) THEN
      RETURN OLD;
    END IF;

  ELSE
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

-- project_members 트리거 함수
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

    -- CASCADE 삭제 시 프로젝트가 이미 삭제되었으면 로깅 건너뜀
    IF NOT EXISTS (SELECT 1 FROM projects WHERE id = v_project_id) THEN
      RETURN OLD;
    END IF;

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

-- task_comments 트리거 함수
CREATE OR REPLACE FUNCTION log_comment_activity()
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
  v_task_title TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'created';
    v_user_id := NEW.user_id;
    v_project_id := NEW.project_id;
    v_entity_id := NEW.id;

    SELECT title INTO v_task_title FROM tasks WHERE id = NEW.task_id;
    v_metadata := jsonb_build_object('task_id', NEW.task_id, 'task_title', COALESCE(v_task_title, ''));

  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'deleted';
    v_user_id := COALESCE(auth.uid(), OLD.user_id);
    v_project_id := OLD.project_id;
    v_entity_id := OLD.id;

    -- CASCADE 삭제 시 프로젝트가 이미 삭제되었으면 로깅 건너뜀
    IF NOT EXISTS (SELECT 1 FROM projects WHERE id = v_project_id) THEN
      RETURN OLD;
    END IF;

    SELECT title INTO v_task_title FROM tasks WHERE id = OLD.task_id;
    v_metadata := jsonb_build_object('task_id', OLD.task_id, 'task_title', COALESCE(v_task_title, ''));
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO activity_logs (project_id, user_id, action_type, entity_type, entity_id, metadata)
  VALUES (v_project_id, v_user_id, v_action, 'comment', v_entity_id, v_metadata);

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- task_attachments 트리거 함수
CREATE OR REPLACE FUNCTION log_attachment_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO activity_logs (project_id, user_id, action_type, entity_type, entity_id, metadata)
    VALUES (
      NEW.project_id,
      NEW.user_id,
      'created',
      'attachment',
      NEW.id,
      jsonb_build_object('file_name', NEW.file_name, 'task_id', NEW.task_id)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- CASCADE 삭제 시 프로젝트가 이미 삭제되었으면 로깅 건너뜀
    IF NOT EXISTS (SELECT 1 FROM projects WHERE id = OLD.project_id) THEN
      RETURN OLD;
    END IF;

    INSERT INTO activity_logs (project_id, user_id, action_type, entity_type, entity_id, metadata)
    VALUES (
      OLD.project_id,
      OLD.user_id,
      'deleted',
      'attachment',
      OLD.id,
      jsonb_build_object('file_name', OLD.file_name, 'task_id', OLD.task_id)
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;
