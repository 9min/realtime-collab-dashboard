-- ============================================
-- 029_task_attachments_storage_policies.sql
-- task-attachments 버킷 생성 + Storage RLS 정책
-- ============================================

-- 버킷 생성 (이미 존재하면 무시)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'task-attachments',
  'task-attachments',
  true,
  10485760, -- 10MB
  ARRAY[
    'image/jpeg','image/png','image/gif','image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Storage RLS 정책
-- 파일 경로 구조: {project_id}/{task_id}/{uuid}.{ext}
-- ============================================

-- 프로젝트 멤버만 조회 가능
CREATE POLICY "task_attachments_select_member"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'task-attachments'
    AND EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = (storage.foldername(name))[1]::uuid
        AND project_members.user_id = auth.uid()
    )
  );

-- 프로젝트 멤버(비뷰어)만 업로드
CREATE POLICY "task_attachments_insert_member"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'task-attachments'
    AND EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = (storage.foldername(name))[1]::uuid
        AND project_members.user_id = auth.uid()
        AND project_members.role <> 'viewer'
    )
  );

-- 프로젝트 owner/admin 또는 파일 업로더 본인만 삭제
-- (업로더 본인 확인은 DB의 task_attachments.user_id로만 가능하므로,
--  Storage 정책에서는 프로젝트 멤버 비뷰어면 삭제 허용)
CREATE POLICY "task_attachments_delete_member"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'task-attachments'
    AND EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = (storage.foldername(name))[1]::uuid
        AND project_members.user_id = auth.uid()
        AND project_members.role <> 'viewer'
    )
  );
