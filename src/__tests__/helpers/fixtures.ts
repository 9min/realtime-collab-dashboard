import type { Tables } from '@/types/database'

// ── ID 상수 ──
export const MOCK_USER_ID = 'user-aaa-111'
export const MOCK_USER_ID_2 = 'user-bbb-222'
export const MOCK_PROJECT_ID = 'project-aaa-111'
export const MOCK_COLUMN_ID_TODO = 'col-todo-111'
export const MOCK_COLUMN_ID_PROGRESS = 'col-progress-222'
export const MOCK_COLUMN_ID_DONE = 'col-done-333'
export const MOCK_TASK_ID_1 = 'task-aaa-111'
export const MOCK_TASK_ID_2 = 'task-bbb-222'
export const MOCK_TASK_ID_3 = 'task-ccc-333'
export const MOCK_MEMBER_ID = 'member-aaa-111'
export const MOCK_LAYOUT_ID = 'layout-aaa-111'

// ── Profiles ──
export const mockProfile: Tables<'profiles'> = {
  id: MOCK_USER_ID,
  email: 'test@example.com',
  full_name: 'Test User',
  avatar_url: null,
  is_admin: false,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

export const mockProfile2: Tables<'profiles'> = {
  id: MOCK_USER_ID_2,
  email: 'other@example.com',
  full_name: 'Other User',
  avatar_url: null,
  is_admin: false,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

// ── Projects ──
export const mockProject: Tables<'projects'> = {
  id: MOCK_PROJECT_ID,
  name: 'Test Project',
  description: 'A test project',
  owner_id: MOCK_USER_ID,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

// ── Kanban Columns ──
export const mockColumns: Tables<'kanban_columns'>[] = [
  {
    id: MOCK_COLUMN_ID_TODO,
    project_id: MOCK_PROJECT_ID,
    title: 'To Do',
    position: 0,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: MOCK_COLUMN_ID_PROGRESS,
    project_id: MOCK_PROJECT_ID,
    title: 'In Progress',
    position: 1,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: MOCK_COLUMN_ID_DONE,
    project_id: MOCK_PROJECT_ID,
    title: 'Done',
    position: 2,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
]

// ── Tasks ──
const now = new Date()
const twoDaysAgo = new Date(now)
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

export const mockTasks: Tables<'tasks'>[] = [
  {
    id: MOCK_TASK_ID_1,
    project_id: MOCK_PROJECT_ID,
    column_id: MOCK_COLUMN_ID_TODO,
    title: 'Task 1',
    description: 'First task',
    priority: 'medium',
    assignee_id: MOCK_USER_ID,
    position: 0,
    due_date: null,
    created_by: MOCK_USER_ID,
    created_at: twoDaysAgo.toISOString(),
    updated_at: twoDaysAgo.toISOString(),
  },
  {
    id: MOCK_TASK_ID_2,
    project_id: MOCK_PROJECT_ID,
    column_id: MOCK_COLUMN_ID_PROGRESS,
    title: 'Task 2',
    description: 'Second task',
    priority: 'high',
    assignee_id: null,
    position: 0,
    due_date: '2026-02-28',
    created_by: MOCK_USER_ID,
    created_at: twoDaysAgo.toISOString(),
    updated_at: now.toISOString(),
  },
  {
    id: MOCK_TASK_ID_3,
    project_id: MOCK_PROJECT_ID,
    column_id: MOCK_COLUMN_ID_DONE,
    title: 'Task 3',
    description: null,
    priority: 'low',
    assignee_id: MOCK_USER_ID_2,
    position: 0,
    due_date: null,
    created_by: MOCK_USER_ID,
    created_at: twoDaysAgo.toISOString(),
    updated_at: now.toISOString(),
  },
]

// ── Project Members ──
export const mockMember: Tables<'project_members'> = {
  id: MOCK_MEMBER_ID,
  project_id: MOCK_PROJECT_ID,
  user_id: MOCK_USER_ID,
  role: 'owner',
  joined_at: '2026-01-01T00:00:00Z',
}

export const mockMemberWithProfile = {
  ...mockMember,
  profiles: mockProfile,
}

// ── Labels ──
export const MOCK_LABEL_ID_1 = 'label-aaa-111'
export const MOCK_LABEL_ID_2 = 'label-bbb-222'

export const mockLabels: Tables<'labels'>[] = [
  {
    id: MOCK_LABEL_ID_1,
    project_id: MOCK_PROJECT_ID,
    name: 'Bug',
    color: '#EF4444',
    created_at: '2026-01-15T10:00:00Z',
  },
  {
    id: MOCK_LABEL_ID_2,
    project_id: MOCK_PROJECT_ID,
    name: 'Feature',
    color: '#3B82F6',
    created_at: '2026-01-15T10:00:00Z',
  },
]

export const mockTaskLabels: Tables<'task_labels'>[] = [
  { task_id: MOCK_TASK_ID_1, label_id: MOCK_LABEL_ID_1 },
  { task_id: MOCK_TASK_ID_2, label_id: MOCK_LABEL_ID_2 },
]

// ── Subtasks ──
export const MOCK_SUBTASK_ID_1 = 'subtask-aaa-111'
export const MOCK_SUBTASK_ID_2 = 'subtask-bbb-222'

export const mockSubtasks: Tables<'subtasks'>[] = [
  {
    id: MOCK_SUBTASK_ID_1,
    task_id: MOCK_TASK_ID_1,
    project_id: MOCK_PROJECT_ID,
    title: 'Write unit tests',
    completed: false,
    position: 0,
    created_by: MOCK_USER_ID,
    created_at: '2026-01-15T10:00:00Z',
    updated_at: '2026-01-15T10:00:00Z',
  },
  {
    id: MOCK_SUBTASK_ID_2,
    task_id: MOCK_TASK_ID_1,
    project_id: MOCK_PROJECT_ID,
    title: 'Update documentation',
    completed: true,
    position: 1,
    created_by: MOCK_USER_ID,
    created_at: '2026-01-15T11:00:00Z',
    updated_at: '2026-01-15T12:00:00Z',
  },
]

// ── Activity Logs ──
export const MOCK_ACTIVITY_LOG_ID = 'activity-aaa-111'

export const mockActivityLog = {
  id: MOCK_ACTIVITY_LOG_ID,
  project_id: MOCK_PROJECT_ID,
  user_id: MOCK_USER_ID,
  action_type: 'created',
  entity_type: 'task',
  entity_id: MOCK_TASK_ID_1,
  metadata: { title: 'Task 1' },
  created_at: '2026-01-15T10:00:00Z',
  profiles: mockProfile,
}

// ── Comments ──
export const MOCK_COMMENT_ID = 'comment-aaa-111'

export const mockComment = {
  id: MOCK_COMMENT_ID,
  task_id: MOCK_TASK_ID_1,
  project_id: MOCK_PROJECT_ID,
  user_id: MOCK_USER_ID,
  content: 'Test comment',
  mentions: null,
  created_at: '2026-01-15T10:00:00Z',
  updated_at: '2026-01-15T10:00:00Z',
  profiles: mockProfile,
}

// ── Notifications ──
export const MOCK_NOTIFICATION_ID = 'notif-aaa-111'

export const mockNotification = {
  id: MOCK_NOTIFICATION_ID,
  project_id: MOCK_PROJECT_ID,
  user_id: MOCK_USER_ID,
  actor_id: MOCK_USER_ID_2,
  type: 'commented',
  title: 'New comment',
  message: 'Other User commented on Task 1',
  entity_type: 'task',
  entity_id: MOCK_TASK_ID_1,
  is_read: false,
  created_at: '2026-01-15T10:00:00Z',
  actor: mockProfile2,
}

// ── Attachments ──
export const MOCK_ATTACHMENT_ID = 'attach-aaa-111'

export const mockAttachment = {
  id: MOCK_ATTACHMENT_ID,
  task_id: MOCK_TASK_ID_1,
  project_id: MOCK_PROJECT_ID,
  user_id: MOCK_USER_ID,
  file_name: 'test-file.pdf',
  file_path: `${MOCK_PROJECT_ID}/${MOCK_TASK_ID_1}/abc-123.pdf`,
  file_size: 1024,
  content_type: 'application/pdf',
  created_at: '2026-01-15T10:00:00Z',
  profiles: mockProfile,
}

// ── Dashboard Layouts ──
export const mockLayoutItems = [
  { widget_id: 'w1', type: 'task-status' as const, x: 0, y: 0, w: 4, h: 3 },
  { widget_id: 'w2', type: 'weekly-progress' as const, x: 4, y: 0, w: 4, h: 3 },
]

export const mockDashboardLayout: Tables<'dashboard_layouts'> = {
  id: MOCK_LAYOUT_ID,
  project_id: MOCK_PROJECT_ID,
  user_id: MOCK_USER_ID,
  layout: mockLayoutItems as unknown as Tables<'dashboard_layouts'>['layout'],
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}
