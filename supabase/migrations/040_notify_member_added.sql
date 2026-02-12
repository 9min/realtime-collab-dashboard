-- ============================================
-- 040_notify_member_added.sql
-- 프로젝트 멤버 추가 시 해당 사용자에게 알림
-- ============================================

CREATE OR REPLACE FUNCTION notify_member_added()
RETURNS TRIGGER AS $$
DECLARE
  v_project_name TEXT;
BEGIN
  -- 본인이 스스로 참여한 경우(소유자 등) 알림 생략
  IF NEW.user_id = auth.uid() THEN
    RETURN NEW;
  END IF;

  -- 프로젝트 이름 조회
  SELECT name INTO v_project_name
  FROM projects WHERE id = NEW.project_id;

  INSERT INTO notifications (project_id, user_id, actor_id, type, title, message, entity_type, entity_id)
  VALUES (
    NEW.project_id,
    NEW.user_id,
    auth.uid(),
    'member_added',
    '프로젝트 초대',
    '프로젝트 "' || LEFT(v_project_name, 50) || '"에 멤버로 추가되었습니다',
    'project',
    NEW.project_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_member_added
  AFTER INSERT ON project_members
  FOR EACH ROW
  EXECUTE FUNCTION notify_member_added();
