-- 태스크 즐겨찾기
CREATE TABLE task_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, task_id)
);

-- 인덱스
CREATE INDEX idx_task_favorites_user_created ON task_favorites (user_id, created_at DESC);
CREATE INDEX idx_task_favorites_task ON task_favorites (task_id);

-- Realtime용
ALTER TABLE task_favorites REPLICA IDENTITY FULL;

-- RLS 활성화
ALTER TABLE task_favorites ENABLE ROW LEVEL SECURITY;

-- 본인 데이터만 조회
CREATE POLICY "Users can view own favorites"
  ON task_favorites FOR SELECT
  USING (auth.uid() = user_id);

-- 본인만 즐겨찾기 추가
CREATE POLICY "Users can add own favorites"
  ON task_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 본인만 즐겨찾기 삭제
CREATE POLICY "Users can delete own favorites"
  ON task_favorites FOR DELETE
  USING (auth.uid() = user_id);
