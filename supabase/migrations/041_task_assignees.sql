-- Phase 1-A: Multi-assignees & Watchers
-- task_assignees 테이블로 N:N 관계 지원

CREATE TYPE task_assignee_role AS ENUM ('assignee', 'watcher');

CREATE TABLE task_assignees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role task_assignee_role NOT NULL DEFAULT 'assignee',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(task_id, user_id)
);

-- Indexes
CREATE INDEX idx_task_assignees_task ON task_assignees(task_id);
CREATE INDEX idx_task_assignees_user ON task_assignees(user_id);
CREATE INDEX idx_task_assignees_role ON task_assignees(role);

-- RLS
ALTER TABLE task_assignees ENABLE ROW LEVEL SECURITY;

-- SELECT: project members can view
CREATE POLICY "task_assignees_select" ON task_assignees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN project_members pm ON pm.project_id = t.project_id
      WHERE t.id = task_assignees.task_id
      AND pm.user_id = auth.uid()
    )
  );

-- INSERT: project members (not viewers) can assign
CREATE POLICY "task_assignees_insert" ON task_assignees
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN project_members pm ON pm.project_id = t.project_id
      WHERE t.id = task_assignees.task_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'admin', 'member')
    )
  );

-- DELETE: project members (not viewers) can remove assignments
CREATE POLICY "task_assignees_delete" ON task_assignees
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN project_members pm ON pm.project_id = t.project_id
      WHERE t.id = task_assignees.task_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'admin', 'member')
    )
  );

-- REPLICA IDENTITY FULL for Realtime
ALTER TABLE task_assignees REPLICA IDENTITY FULL;

-- Migrate existing assignee_id data to task_assignees
INSERT INTO task_assignees (task_id, user_id, role)
SELECT id, assignee_id, 'assignee'
FROM tasks
WHERE assignee_id IS NOT NULL
ON CONFLICT (task_id, user_id) DO NOTHING;

-- Feature flag
ALTER TABLE projects ADD COLUMN IF NOT EXISTS feature_multi_assignees BOOLEAN NOT NULL DEFAULT true;

-- Activity log trigger for assignee changes
CREATE OR REPLACE FUNCTION log_task_assignee_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO activity_logs (project_id, user_id, action_type, entity_type, entity_id, metadata)
    SELECT t.project_id, auth.uid(), 'update', 'task', NEW.task_id,
      jsonb_build_object(
        'field', 'assignee',
        'action', 'added',
        'user_id', NEW.user_id,
        'role', NEW.role
      )
    FROM tasks t WHERE t.id = NEW.task_id;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO activity_logs (project_id, user_id, action_type, entity_type, entity_id, metadata)
    SELECT t.project_id, auth.uid(), 'update', 'task', OLD.task_id,
      jsonb_build_object(
        'field', 'assignee',
        'action', 'removed',
        'user_id', OLD.user_id,
        'role', OLD.role
      )
    FROM tasks t WHERE t.id = OLD.task_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_task_assignee_change
  AFTER INSERT OR DELETE ON task_assignees
  FOR EACH ROW
  EXECUTE FUNCTION log_task_assignee_change();

-- Notification trigger for assignee/watcher addition
CREATE OR REPLACE FUNCTION notify_task_assignee_added()
RETURNS TRIGGER AS $$
BEGIN
  -- Don't notify if user assigned themselves
  IF NEW.user_id != auth.uid() THEN
    INSERT INTO notifications (project_id, user_id, actor_id, type, title, message, entity_type, entity_id)
    SELECT t.project_id, NEW.user_id, auth.uid(),
      CASE WHEN NEW.role = 'assignee' THEN 'task_assigned' ELSE 'task_assigned' END,
      CASE WHEN NEW.role = 'assignee' THEN '태스크 할당' ELSE '태스크 워처 추가' END,
      CASE WHEN NEW.role = 'assignee'
        THEN '태스크 "' || t.title || '"에 담당자로 할당되었습니다.'
        ELSE '태스크 "' || t.title || '"의 워처로 추가되었습니다.'
      END,
      'task', NEW.task_id
    FROM tasks t WHERE t.id = NEW.task_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_task_assignee_notify
  AFTER INSERT ON task_assignees
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_assignee_added();
