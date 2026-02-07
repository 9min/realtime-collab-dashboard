-- ============================================
-- 013_task_attachments.sql
-- 태스크 파일 첨부 테이블 + Storage 정책
-- ============================================

CREATE TABLE task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  content_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_task_attachments_task ON task_attachments (task_id);
CREATE INDEX idx_task_attachments_project ON task_attachments (project_id);

-- REPLICA IDENTITY FULL (Realtime용)
ALTER TABLE task_attachments REPLICA IDENTITY FULL;

-- ============================================
-- RLS 정책
-- ============================================
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

-- 멤버만 조회
CREATE POLICY "attachments_select_member"
  ON task_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = task_attachments.project_id
        AND project_members.user_id = auth.uid()
    )
  );

-- 비뷰어 INSERT (본인만)
CREATE POLICY "attachments_insert_non_viewer"
  ON task_attachments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = task_attachments.project_id
        AND project_members.user_id = auth.uid()
        AND project_members.role <> 'viewer'
    )
  );

-- 작성자 또는 관리자 DELETE
CREATE POLICY "attachments_delete_owner_or_admin"
  ON task_attachments FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = task_attachments.project_id
        AND project_members.user_id = auth.uid()
        AND project_members.role IN ('owner', 'admin')
    )
  );

-- ============================================
-- 활동 로그 트리거
-- ============================================
CREATE OR REPLACE FUNCTION log_attachment_activity()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_log_attachment_activity
  AFTER INSERT OR DELETE ON task_attachments
  FOR EACH ROW
  EXECUTE FUNCTION log_attachment_activity();

-- ============================================
-- Supabase Storage 버킷 (SQL로 생성 가능)
-- 실제 운영에서는 Supabase Dashboard에서 생성 권장
-- ============================================
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'task-attachments',
--   'task-attachments',
--   true,
--   10485760, -- 10MB
--   ARRAY['image/jpeg','image/png','image/gif','image/webp','application/pdf',
--         'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
--         'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
--         'text/plain']
-- );
