-- ============================================
-- 프로젝트 생성 시 기본 라벨 자동 생성
-- Bug(빨강), Design(보라), Docs(초록), Feature(파랑)
-- ============================================

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

  -- 3. 기본 칸반 컬럼 생성 (한글)
  INSERT INTO kanban_columns (project_id, title, position)
  VALUES
    (v_project_id, '할 일', 0),
    (v_project_id, '진행 중', 1),
    (v_project_id, '완료', 2),
    (v_project_id, '논의 필요', 3);

  -- 4. 기본 라벨 생성
  INSERT INTO labels (project_id, name, color)
  VALUES
    (v_project_id, 'Bug', '#EF4444'),
    (v_project_id, 'Design', '#8B5CF6'),
    (v_project_id, 'Docs', '#22C55E'),
    (v_project_id, 'Feature', '#3B82F6');

  RETURN v_project_id;
END;
$$;

-- ============================================
-- 기존 프로젝트 백필: 라벨이 없는 프로젝트에 기본 라벨 추가
-- ============================================
INSERT INTO labels (project_id, name, color)
SELECT p.id, v.name, v.color
FROM projects p
CROSS JOIN (
  VALUES
    ('Bug', '#EF4444'),
    ('Design', '#8B5CF6'),
    ('Docs', '#22C55E'),
    ('Feature', '#3B82F6')
) AS v(name, color)
WHERE NOT EXISTS (
  SELECT 1 FROM labels l WHERE l.project_id = p.id AND l.name = v.name
);
