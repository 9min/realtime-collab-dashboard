-- tasks.created_by: NO ACTION → SET NULL
-- 유저 삭제(계정 탈퇴) 시 FK 제약 위반 방지

-- 1) NOT NULL 제약 해제
ALTER TABLE tasks ALTER COLUMN created_by DROP NOT NULL;

-- 2) 기존 FK 제약 삭제 후 SET NULL로 재생성
ALTER TABLE tasks
  DROP CONSTRAINT tasks_created_by_fkey,
  ADD CONSTRAINT tasks_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES profiles(id)
    ON DELETE SET NULL;
