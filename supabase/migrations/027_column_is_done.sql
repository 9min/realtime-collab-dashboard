-- kanban_columns: 완료 컬럼 플래그 추가
-- FALSE(기본값) = 일반 컬럼, TRUE = 완료 컬럼
-- 선행 작업이 완료 컬럼에 있으면 후속 작업의 "대기 중" 상태가 자동 해제됨
ALTER TABLE kanban_columns ADD COLUMN is_done_column BOOLEAN NOT NULL DEFAULT FALSE;
