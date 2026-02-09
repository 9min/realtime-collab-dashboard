-- 관리자용: 전체 프로젝트 멤버십 조회 RPC
CREATE OR REPLACE FUNCTION get_all_project_memberships()
RETURNS TABLE (
  user_id UUID,
  project_id UUID,
  project_name TEXT,
  role member_role,
  joined_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin permission required';
  END IF;

  RETURN QUERY
    SELECT pm.user_id, pm.project_id, p.name, pm.role, pm.joined_at
    FROM project_members pm
    JOIN projects p ON p.id = pm.project_id
    ORDER BY p.name, pm.role;
END;
$$;
