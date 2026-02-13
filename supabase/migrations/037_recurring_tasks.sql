-- 반복 빈도 열거형
CREATE TYPE recurrence_frequency AS ENUM ('daily', 'weekly', 'monthly', 'custom');

-- 태스크 반복 설정
CREATE TABLE task_recurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL UNIQUE REFERENCES tasks(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  frequency recurrence_frequency NOT NULL,
  interval_value INTEGER DEFAULT 1,
  day_of_week INTEGER,        -- 0~6 (weekly용)
  day_of_month INTEGER,       -- 1~31 (monthly용)
  next_due_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_task_recurrences_task ON task_recurrences (task_id);
CREATE INDEX idx_task_recurrences_project ON task_recurrences (project_id);
CREATE INDEX idx_task_recurrences_next_due ON task_recurrences (next_due_date, is_active);

-- Realtime용
ALTER TABLE task_recurrences REPLICA IDENTITY FULL;

-- RLS 활성화
ALTER TABLE task_recurrences ENABLE ROW LEVEL SECURITY;

-- 프로젝트 멤버만 조회 가능
CREATE POLICY "Project members can view recurrences"
  ON task_recurrences FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = task_recurrences.project_id
        AND pm.user_id = auth.uid()
    )
  );

-- 프로젝트 멤버만 생성 가능
CREATE POLICY "Project members can create recurrences"
  ON task_recurrences FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = task_recurrences.project_id
        AND pm.user_id = auth.uid()
    )
  );

-- 프로젝트 멤버만 수정 가능
CREATE POLICY "Project members can update recurrences"
  ON task_recurrences FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = task_recurrences.project_id
        AND pm.user_id = auth.uid()
    )
  );

-- 프로젝트 멤버만 삭제 가능
CREATE POLICY "Project members can delete recurrences"
  ON task_recurrences FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = task_recurrences.project_id
        AND pm.user_id = auth.uid()
    )
  );

-- 반복 태스크 완료 처리 트리거 함수
CREATE OR REPLACE FUNCTION handle_recurring_task_completion()
RETURNS TRIGGER AS $$
DECLARE
  rec RECORD;
  first_column_id UUID;
  new_task_id UUID;
  new_due DATE;
BEGIN
  -- column_id가 변경되지 않으면 무시
  IF OLD.column_id = NEW.column_id THEN
    RETURN NEW;
  END IF;

  -- 새 컬럼이 done 컬럼인지 확인
  IF NOT EXISTS (
    SELECT 1 FROM kanban_columns
    WHERE id = NEW.column_id AND is_done_column = true
  ) THEN
    RETURN NEW;
  END IF;

  -- 활성 반복 설정 조회
  SELECT * INTO rec FROM task_recurrences
  WHERE task_id = NEW.id AND is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- 첫 번째 컬럼 (position=0) 가져오기
  SELECT id INTO first_column_id FROM kanban_columns
  WHERE project_id = NEW.project_id
  ORDER BY position ASC
  LIMIT 1;

  IF first_column_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- 다음 마감일 계산
  CASE rec.frequency
    WHEN 'daily' THEN
      new_due := rec.next_due_date + (rec.interval_value || ' days')::INTERVAL;
    WHEN 'weekly' THEN
      new_due := rec.next_due_date + (rec.interval_value * 7 || ' days')::INTERVAL;
    WHEN 'monthly' THEN
      new_due := rec.next_due_date + (rec.interval_value || ' months')::INTERVAL;
    WHEN 'custom' THEN
      new_due := rec.next_due_date + (rec.interval_value || ' days')::INTERVAL;
    ELSE
      new_due := rec.next_due_date + INTERVAL '1 day';
  END CASE;

  -- 새 태스크 생성 (동일 속성)
  INSERT INTO tasks (project_id, column_id, title, description, priority, assignee_id, position, due_date, created_by)
  VALUES (
    NEW.project_id,
    first_column_id,
    NEW.title,
    NEW.description,
    NEW.priority,
    NEW.assignee_id,
    0,
    new_due,
    NEW.created_by
  )
  RETURNING id INTO new_task_id;

  -- 반복 설정을 새 태스크로 이전 + next_due_date 갱신
  UPDATE task_recurrences
  SET task_id = new_task_id,
      next_due_date = new_due,
      updated_at = now()
  WHERE id = rec.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 등록
CREATE TRIGGER trg_handle_recurring_task_completion
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION handle_recurring_task_completion();
