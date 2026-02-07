-- ============================================
-- 011_notifications.sql
-- In-app 알림 테이블 + 트리거
-- ============================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_notifications_user_read_created
  ON notifications (user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_project
  ON notifications (project_id);

-- REPLICA IDENTITY FULL (Realtime용)
ALTER TABLE notifications REPLICA IDENTITY FULL;

-- ============================================
-- RLS 정책
-- ============================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 본인 알림만 조회
CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- 본인 알림만 수정 (is_read 토글)
CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- INSERT는 트리거/서비스 역할만 (authenticated 사용자)
CREATE POLICY "notifications_insert_authenticated"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- 트리거 1: 태스크 담당자 변경 시 알림
-- ============================================
CREATE OR REPLACE FUNCTION notify_task_assigned()
RETURNS TRIGGER AS $$
BEGIN
  -- assignee_id가 변경되었고, 새 담당자가 존재하며, 변경자 본인이 아닌 경우
  IF (OLD.assignee_id IS DISTINCT FROM NEW.assignee_id)
     AND NEW.assignee_id IS NOT NULL
     AND NEW.assignee_id <> auth.uid()
  THEN
    INSERT INTO notifications (project_id, user_id, actor_id, type, title, message, entity_type, entity_id)
    VALUES (
      NEW.project_id,
      NEW.assignee_id,
      auth.uid(),
      'task_assigned',
      '태스크 배정',
      '태스크 "' || LEFT(NEW.title, 50) || '"에 배정되었습니다',
      'task',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_task_assigned
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_assigned();

-- ============================================
-- 트리거 2: 댓글 작성 시 태스크 담당자에게 알림
-- ============================================
CREATE OR REPLACE FUNCTION notify_comment_created()
RETURNS TRIGGER AS $$
DECLARE
  v_task RECORD;
BEGIN
  -- 태스크 정보 조회
  SELECT id, title, assignee_id, project_id INTO v_task
  FROM tasks WHERE id = NEW.task_id;

  -- 태스크 담당자가 존재하고, 댓글 작성자와 다른 경우
  IF v_task.assignee_id IS NOT NULL
     AND v_task.assignee_id <> NEW.user_id
  THEN
    INSERT INTO notifications (project_id, user_id, actor_id, type, title, message, entity_type, entity_id)
    VALUES (
      NEW.project_id,
      v_task.assignee_id,
      NEW.user_id,
      'commented',
      '새 댓글',
      '태스크 "' || LEFT(v_task.title, 50) || '"에 새 댓글이 달렸습니다',
      'comment',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_comment_created
  AFTER INSERT ON task_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_comment_created();
