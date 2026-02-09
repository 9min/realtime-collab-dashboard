import {
  ArrowRightLeft,
  CheckSquare,
  Columns3,
  MessageSquare,
  Pencil,
  Plus,
  Trash2,
  Users,
} from 'lucide-react'

import { ACTIVITY_ACTION, ACTIVITY_ENTITY } from '@/types/activity'
import type { ActivityAction, ActivityEntity } from '@/types/activity'

interface ActionConfig {
  icon: typeof Plus
  label: string
  bgColor: string
  textColor: string
}

interface EntityConfig {
  icon: typeof CheckSquare
  label: string
}

export const ACTION_CONFIG: Record<ActivityAction, ActionConfig> = {
  [ACTIVITY_ACTION.CREATED]: {
    icon: Plus,
    label: '생성',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-600 dark:text-emerald-400',
  },
  [ACTIVITY_ACTION.UPDATED]: {
    icon: Pencil,
    label: '수정',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-600 dark:text-blue-400',
  },
  [ACTIVITY_ACTION.DELETED]: {
    icon: Trash2,
    label: '삭제',
    bgColor: 'bg-red-500/10',
    textColor: 'text-red-600 dark:text-red-400',
  },
  [ACTIVITY_ACTION.MOVED]: {
    icon: ArrowRightLeft,
    label: '이동',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-600 dark:text-amber-400',
  },
} as const

export const ENTITY_CONFIG: Record<ActivityEntity, EntityConfig> = {
  [ACTIVITY_ENTITY.TASK]: {
    icon: CheckSquare,
    label: '태스크',
  },
  [ACTIVITY_ENTITY.COLUMN]: {
    icon: Columns3,
    label: '컬럼',
  },
  [ACTIVITY_ENTITY.MEMBER]: {
    icon: Users,
    label: '멤버',
  },
  [ACTIVITY_ENTITY.COMMENT]: {
    icon: MessageSquare,
    label: '댓글',
  },
} as const

export const ACTION_DOT_COLORS: Record<ActivityAction, string> = {
  [ACTIVITY_ACTION.CREATED]: 'bg-emerald-500',
  [ACTIVITY_ACTION.UPDATED]: 'bg-blue-500',
  [ACTIVITY_ACTION.DELETED]: 'bg-red-500',
  [ACTIVITY_ACTION.MOVED]: 'bg-amber-500',
} as const
