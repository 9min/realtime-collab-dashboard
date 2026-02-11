-- 기능 설정 기본값을 TRUE로 변경 (새 프로젝트 생성 시 모든 기능 활성화)
ALTER TABLE projects ALTER COLUMN feature_labels SET DEFAULT TRUE;
ALTER TABLE projects ALTER COLUMN feature_subtasks SET DEFAULT TRUE;
ALTER TABLE projects ALTER COLUMN feature_dependencies SET DEFAULT TRUE;
ALTER TABLE projects ALTER COLUMN feature_attachments SET DEFAULT TRUE;
ALTER TABLE projects ALTER COLUMN feature_comments SET DEFAULT TRUE;

-- 기존 프로젝트도 모두 활성화
UPDATE projects SET
  feature_labels = TRUE,
  feature_subtasks = TRUE,
  feature_dependencies = TRUE,
  feature_attachments = TRUE,
  feature_comments = TRUE;
