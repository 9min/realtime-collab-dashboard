export interface ShortcutDefinition {
  key: string
  label: string
  description: string
  scope: 'global' | 'project'
  action: () => void
}

export const SHORTCUT_KEYS = {
  SEARCH: 'k',
  HELP: '?',
  DASHBOARD: '1',
  KANBAN: '2',
  GANTT: '3',
  CALENDAR: '4',
  ACTIVITY: '5',
} as const

export const SHORTCUT_DISPLAY: Array<{
  key: string
  modifier?: string
  label: string
  scope: 'global' | 'project'
}> = [
  { key: 'K', modifier: 'Cmd', label: '검색 열기', scope: 'global' },
  { key: '?', modifier: 'Shift', label: '단축키 도움말', scope: 'global' },
  { key: '1', label: '대시보드 이동', scope: 'project' },
  { key: '2', label: '칸반 보드 이동', scope: 'project' },
  { key: '3', label: '간트 차트 이동', scope: 'project' },
  { key: '4', label: '캘린더 이동', scope: 'project' },
  { key: '5', label: '활동 로그 이동', scope: 'project' },
]

export function isInputFocused(): boolean {
  const el = document.activeElement
  if (!el) return false
  const tag = el.tagName.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
  if ((el as HTMLElement).isContentEditable) return true
  return false
}
