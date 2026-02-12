-- 마감일 알림 로그 (중복 발송 방지)
CREATE TABLE due_date_notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,  -- 'due_tomorrow' | 'overdue'
  notified_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(task_id, user_id, notification_type, notified_date)
);

-- 인덱스
CREATE INDEX idx_due_date_log_task_date ON due_date_notifications_log (task_id, notified_date);

-- RLS 활성화
ALTER TABLE due_date_notifications_log ENABLE ROW LEVEL SECURITY;

-- 사용자 본인 알림 로그만 SELECT 가능
CREATE POLICY "Users can view own due date logs"
  ON due_date_notifications_log FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT는 service_role만 (cron API에서 사용)
-- anon/authenticated 사용자는 직접 INSERT 불가
