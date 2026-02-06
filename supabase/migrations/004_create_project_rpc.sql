-- ============================================
-- RPC: 프로젝트 생성 함수 (SECURITY DEFINER)
-- ============================================
-- 문제: INSERT ... RETURNING + SELECT RLS 정책 충돌
--       프로젝트 INSERT 후 .select('*')에서 projects_select 정책이
--       is_project_member()를 체크하지만, 아직 멤버가 없어 실패
-- 해결: SECURITY DEFINER 함수로 전체 생성 플로우를 단일 트랜잭션 처리

CREATE OR REPLACE FUNCTION create_project_with_defaults(
  p_name TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_project_id UUID;
BEGIN
  -- 인증 확인
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. 프로젝트 생성
  INSERT INTO projects (name, description, owner_id)
  VALUES (p_name, p_description, v_user_id)
  RETURNING id INTO v_project_id;

  -- 2. owner 멤버 등록
  INSERT INTO project_members (project_id, user_id, role)
  VALUES (v_project_id, v_user_id, 'owner');

  -- 3. 기본 칸반 컬럼 생성
  INSERT INTO kanban_columns (project_id, title, position)
  VALUES
    (v_project_id, 'To Do', 0),
    (v_project_id, 'In Progress', 1),
    (v_project_id, 'Done', 2);

  RETURN v_project_id;
END;
$$;
