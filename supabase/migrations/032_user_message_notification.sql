-- ============================================
-- 032_user_message_notification.sql
-- 신규 사용자 메시지 → 관리자 알림
-- ============================================

-- project_id를 nullable로 변경 (프로젝트와 무관한 알림 지원)
ALTER TABLE notifications ALTER COLUMN project_id DROP NOT NULL;

-- ============================================
-- 트리거: user_messages INSERT 시 모든 관리자에게 알림
-- ============================================
CREATE OR REPLACE FUNCTION notify_admin_user_message()
RETURNS TRIGGER AS $$
DECLARE
  v_admin RECORD;
  v_sender_name TEXT;
BEGIN
  -- 발신자 이름 조회
  SELECT COALESCE(full_name, email) INTO v_sender_name
  FROM profiles WHERE id = NEW.user_id;

  -- 모든 관리자에게 알림 생성
  FOR v_admin IN
    SELECT id FROM profiles WHERE is_admin = true AND id <> NEW.user_id
  LOOP
    INSERT INTO notifications (
      project_id, user_id, actor_id, type, title, message, entity_type, entity_id
    ) VALUES (
      NULL,
      v_admin.id,
      NEW.user_id,
      'user_message',
      '새 사용자 메시지',
      v_sender_name || '님이 메시지를 보냈습니다',
      'user_message',
      NEW.id
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_admin_user_message
  AFTER INSERT ON user_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_user_message();
