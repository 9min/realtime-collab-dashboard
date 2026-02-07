-- Task Comments 테이블
CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스: 태스크별 최신순 조회
CREATE INDEX idx_task_comments_task_created
  ON task_comments (task_id, created_at ASC);

-- RLS 활성화
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- SELECT: 프로젝트 멤버만 조회
CREATE POLICY "Members can view comments"
  ON task_comments FOR SELECT
  USING (is_project_member(project_id));

-- INSERT: 뷰어가 아닌 멤버만 작성
CREATE POLICY "Non-viewer members can create comments"
  ON task_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND has_project_role(project_id, ARRAY['owner', 'admin', 'member']::member_role[])
  );

-- UPDATE: 작성자만 수정
CREATE POLICY "Authors can update own comments"
  ON task_comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: 작성자 또는 관리자/소유자가 삭제
CREATE POLICY "Authors or admins can delete comments"
  ON task_comments FOR DELETE
  USING (
    auth.uid() = user_id
    OR has_project_role(project_id, ARRAY['owner', 'admin']::member_role[])
  );

-- Realtime 활성화
ALTER TABLE task_comments REPLICA IDENTITY FULL;

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_task_comment_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_task_comment_updated_at
  BEFORE UPDATE ON task_comments
  FOR EACH ROW EXECUTE FUNCTION update_task_comment_updated_at();

------------------------------------------------------------------------
-- 댓글 생성/삭제 시 activity_logs에 기록
------------------------------------------------------------------------
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

CREATE TRIGGER trg_comment_activity
  AFTER INSERT OR DELETE ON task_comments
  FOR EACH ROW EXECUTE FUNCTION log_comment_activity();
