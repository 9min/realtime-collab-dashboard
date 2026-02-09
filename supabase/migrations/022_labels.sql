-- Labels: 프로젝트별 라벨 정의
CREATE TABLE labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 30),
  color TEXT NOT NULL CHECK (color ~ '^#[0-9a-fA-F]{6}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, name)
);

-- 인덱스: 프로젝트별 라벨 조회
CREATE INDEX idx_labels_project ON labels (project_id);

-- Task-Label 연결 테이블 (다대다)
CREATE TABLE task_labels (
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, label_id)
);

-- 인덱스: label_id로 역조회
CREATE INDEX idx_task_labels_label ON task_labels (label_id);

-- RLS 활성화
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_labels ENABLE ROW LEVEL SECURITY;

-- Labels: 프로젝트 멤버 조회 가능
CREATE POLICY "Members can view labels"
  ON labels FOR SELECT
  USING (is_project_member(project_id));

-- Labels: owner/admin만 CRUD
CREATE POLICY "Admins can create labels"
  ON labels FOR INSERT
  WITH CHECK (has_project_role(project_id, ARRAY['owner','admin']::member_role[]));

CREATE POLICY "Admins can update labels"
  ON labels FOR UPDATE
  USING (has_project_role(project_id, ARRAY['owner','admin']::member_role[]))
  WITH CHECK (has_project_role(project_id, ARRAY['owner','admin']::member_role[]));

CREATE POLICY "Admins can delete labels"
  ON labels FOR DELETE
  USING (has_project_role(project_id, ARRAY['owner','admin']::member_role[]));

-- Task Labels: 멤버 조회 가능 (labels 테이블의 project_id를 통해 RLS 확인)
CREATE POLICY "Members can view task labels"
  ON task_labels FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM labels l
      WHERE l.id = task_labels.label_id
      AND is_project_member(l.project_id)
    )
  );

-- Task Labels: non-viewer가 assign/remove
CREATE POLICY "Non-viewers can assign labels"
  ON task_labels FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM labels l
      WHERE l.id = task_labels.label_id
      AND has_project_role(l.project_id, ARRAY['owner','admin','member']::member_role[])
    )
  );

CREATE POLICY "Non-viewers can remove labels"
  ON task_labels FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM labels l
      WHERE l.id = task_labels.label_id
      AND has_project_role(l.project_id, ARRAY['owner','admin','member']::member_role[])
    )
  );

-- Realtime 활성화
ALTER TABLE labels REPLICA IDENTITY FULL;
ALTER TABLE task_labels REPLICA IDENTITY FULL;
