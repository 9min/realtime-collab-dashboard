-- ============================================================
-- 047: 누락된 RLS 정책, FK, 제약조건 수정
-- ============================================================

-- 1. automation_executions: project_id FK 추가
ALTER TABLE automation_executions
  ADD CONSTRAINT automation_executions_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- 2. automation_executions: INSERT 정책 추가 (프로젝트 멤버만)
CREATE POLICY "automation_executions_insert" ON automation_executions FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = automation_executions.project_id
      AND pm.user_id = auth.uid()
  )
);

-- 3. automation_executions: DELETE 정책 추가 (admin/owner만)
CREATE POLICY "automation_executions_delete" ON automation_executions FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = automation_executions.project_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'admin')
  )
);

-- 4. task_assignees: UPDATE 정책 추가 (역할 변경 허용)
CREATE POLICY "task_assignees_update" ON task_assignees FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN project_members pm ON pm.project_id = t.project_id
    WHERE t.id = task_assignees.task_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'admin', 'member')
  )
);

-- 5. tasks.estimated_minutes: 양수 제약조건 추가
ALTER TABLE tasks ADD CONSTRAINT tasks_estimated_minutes_positive
  CHECK (estimated_minutes IS NULL OR estimated_minutes > 0);

-- 6. time_entries: started_at/ended_at 순서 제약조건 추가
ALTER TABLE time_entries ADD CONSTRAINT time_entries_time_range_valid
  CHECK (
    (started_at IS NULL AND ended_at IS NULL)
    OR (started_at IS NOT NULL AND (ended_at IS NULL OR ended_at > started_at))
  );
