-- ============================================
-- Admin 기반 프로젝트 생성 권한 제한
-- ============================================
-- profiles에 is_admin 컬럼 추가
-- admin만 프로젝트를 생성할 수 있도록 RLS 정책 교체
-- admin 상태 변경 RPC 생성

-- 1. profiles 테이블에 is_admin 컬럼 추가
ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT false;

-- 2. is_admin 헬퍼 함수 (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM profiles WHERE id = auth.uid()),
    false
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 3. projects_insert RLS 정책 교체: admin만 프로젝트 생성 가능
DROP POLICY IF EXISTS "projects_insert" ON projects;
CREATE POLICY "projects_insert" ON projects
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() AND is_admin());

-- 4. create_project_with_defaults RPC에 admin 체크 추가
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

  -- admin 확인
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin permission required';
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

-- 5. admin 상태 변경 RPC (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION set_admin_status(p_user_id UUID, p_is_admin BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 인증 확인
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 호출자가 admin인지 확인
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin permission required';
  END IF;

  -- 자기 자신의 admin 해제 방지
  IF p_user_id = auth.uid() AND p_is_admin = false THEN
    RAISE EXCEPTION 'Cannot remove own admin status';
  END IF;

  -- 대상 유저의 is_admin 업데이트
  UPDATE profiles SET is_admin = p_is_admin, updated_at = now()
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
END;
$$;
