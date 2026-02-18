-- 소유권 이전 RPC 함수
-- projects.owner_id + project_members.role을 원자적으로 변경
CREATE OR REPLACE FUNCTION transfer_project_ownership(
  p_project_id UUID,
  p_new_owner_id UUID
) RETURNS VOID AS $$
DECLARE
  v_current_user_id UUID := auth.uid();
  v_current_owner_id UUID;
BEGIN
  -- 현재 소유자 확인
  SELECT owner_id INTO v_current_owner_id
  FROM projects WHERE id = p_project_id;

  IF v_current_owner_id IS NULL THEN
    RAISE EXCEPTION 'Project not found';
  END IF;

  IF v_current_owner_id != v_current_user_id THEN
    RAISE EXCEPTION 'Only the current owner can transfer ownership';
  END IF;

  IF v_current_user_id = p_new_owner_id THEN
    RAISE EXCEPTION 'Cannot transfer to yourself';
  END IF;

  -- 새 소유자가 프로젝트 멤버인지 확인
  IF NOT EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = p_project_id AND user_id = p_new_owner_id
  ) THEN
    RAISE EXCEPTION 'New owner must be a project member';
  END IF;

  -- 트랜잭션 내에서 원자적 처리
  -- 1) projects.owner_id 변경
  UPDATE projects SET owner_id = p_new_owner_id, updated_at = now()
  WHERE id = p_project_id;

  -- 2) 새 소유자의 role을 owner로 변경
  UPDATE project_members SET role = 'owner'
  WHERE project_id = p_project_id AND user_id = p_new_owner_id;

  -- 3) 기존 소유자의 role을 admin으로 변경
  UPDATE project_members SET role = 'admin'
  WHERE project_id = p_project_id AND user_id = v_current_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
