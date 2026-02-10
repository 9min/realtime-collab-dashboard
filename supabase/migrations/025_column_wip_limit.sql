-- kanban_columns: WIP(Work In Progress) 제한 추가
-- NULL = 제한 없음, 양수 = 최대 태스크 수
ALTER TABLE kanban_columns ADD COLUMN wip_limit INTEGER DEFAULT NULL;
ALTER TABLE kanban_columns ADD CONSTRAINT wip_limit_positive CHECK (wip_limit IS NULL OR wip_limit > 0);
