-- ============================================
-- 012_mentions.sql
-- 댓글 @멘션 기능 + 멘션 알림 트리거
-- ============================================

-- task_comments에 mentions 컬럼 추가
ALTER TABLE task_comments ADD COLUMN mentions UUID[] DEFAULT '{}';

-- ============================================
-- 트리거: 댓글 INSERT/UPDATE 시 mentions 배열 기반 알림 생성
-- ============================================
CREATE OR REPLACE FUNCTION notify_mention()
RETURNS TRIGGER AS $$
DECLARE
  v_task RECORD;
  v_mentioned_id UUID;
BEGIN
  -- mentions 배열이 비어있으면 스킵
  IF NEW.mentions IS NULL OR array_length(NEW.mentions, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  -- 태스크 정보 조회
  SELECT id, title INTO v_task FROM tasks WHERE id = NEW.task_id;

  -- 각 멘션된 유저에게 알림 생성
  FOREACH v_mentioned_id IN ARRAY NEW.mentions
  LOOP
    -- 본인 멘션 제외
    IF v_mentioned_id <> NEW.user_id THEN
      INSERT INTO notifications (project_id, user_id, actor_id, type, title, message, entity_type, entity_id)
      VALUES (
        NEW.project_id,
        v_mentioned_id,
        NEW.user_id,
        'mentioned',
        '멘션됨',
        '태스크 "' || LEFT(v_task.title, 50) || '"의 댓글에서 멘션되었습니다',
        'comment',
        NEW.id
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_mention
  AFTER INSERT OR UPDATE OF mentions ON task_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_mention();
