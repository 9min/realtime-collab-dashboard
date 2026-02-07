-- ============================================
-- Fix: Realtime 필터 동작을 위한 REPLICA IDENTITY FULL 설정
-- ============================================
-- 문제: postgres_changes에서 filter (project_id=eq.xxx) 사용 시
--       REPLICA IDENTITY FULL이 없으면 UPDATE/DELETE 이벤트가 전달되지 않음
-- 해결: Realtime 구독 대상 테이블에 REPLICA IDENTITY FULL 설정

ALTER TABLE tasks REPLICA IDENTITY FULL;
ALTER TABLE kanban_columns REPLICA IDENTITY FULL;
ALTER TABLE project_members REPLICA IDENTITY FULL;
