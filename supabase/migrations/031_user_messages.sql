CREATE TABLE user_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_messages_user ON user_messages (user_id);
CREATE INDEX idx_user_messages_unread ON user_messages (is_read, created_at DESC);

ALTER TABLE user_messages REPLICA IDENTITY FULL;
ALTER TABLE user_messages ENABLE ROW LEVEL SECURITY;

-- 본인 메시지 조회/삽입
CREATE POLICY "user_messages_select_own"
  ON user_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_messages_insert_own"
  ON user_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 관리자: 전체 조회
CREATE POLICY "user_messages_select_admin"
  ON user_messages FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- 관리자: is_read 업데이트
CREATE POLICY "user_messages_update_admin"
  ON user_messages FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
