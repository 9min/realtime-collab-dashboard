ALTER TABLE tasks ADD COLUMN start_date DATE;
ALTER TABLE tasks ADD CONSTRAINT chk_start_before_due
  CHECK (start_date IS NULL OR due_date IS NULL OR start_date <= due_date);
