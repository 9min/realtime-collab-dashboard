import type { ActivityAction, ActivityEntity, ActivityLogWithUser } from '@/types/activity'

interface ActivityFilterCriteria {
  searchText: string
  actionTypes: ActivityAction[]
  entityTypes: ActivityEntity[]
  userIds: string[]
}

interface DateGroup {
  label: string
  activities: ActivityLogWithUser[]
}

export function filterActivityLogs(
  activities: ActivityLogWithUser[],
  criteria: ActivityFilterCriteria,
): ActivityLogWithUser[] {
  const { searchText, actionTypes, entityTypes, userIds } = criteria

  return activities.filter((activity) => {
    if (searchText) {
      const lower = searchText.toLowerCase()
      const userName = (activity.profiles.full_name ?? activity.profiles.email).toLowerCase()
      const meta = activity.metadata as Record<string, unknown>
      const title = typeof meta.title === 'string' ? meta.title.toLowerCase() : ''
      if (!userName.includes(lower) && !title.includes(lower)) {
        return false
      }
    }

    if (actionTypes.length > 0 && !actionTypes.includes(activity.action_type as ActivityAction)) {
      return false
    }

    if (entityTypes.length > 0 && !entityTypes.includes(activity.entity_type as ActivityEntity)) {
      return false
    }

    if (userIds.length > 0 && !userIds.includes(activity.user_id)) {
      return false
    }

    return true
  })
}

export function groupActivitiesByDate(
  activities: ActivityLogWithUser[],
  now: Date = new Date(),
): DateGroup[] {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const weekStart = new Date(today)
  weekStart.setDate(weekStart.getDate() - today.getDay())

  const groups: Record<string, ActivityLogWithUser[]> = {
    오늘: [],
    어제: [],
    '이번 주': [],
    이전: [],
  }

  for (const activity of activities) {
    const activityDate = new Date(activity.created_at)
    const activityDay = new Date(activityDate.getFullYear(), activityDate.getMonth(), activityDate.getDate())

    if (activityDay.getTime() === today.getTime()) {
      groups['오늘'].push(activity)
    } else if (activityDay.getTime() === yesterday.getTime()) {
      groups['어제'].push(activity)
    } else if (activityDay >= weekStart) {
      groups['이번 주'].push(activity)
    } else {
      groups['이전'].push(activity)
    }
  }

  const ORDER = ['오늘', '어제', '이번 주', '이전'] as const
  return ORDER
    .filter((label) => groups[label].length > 0)
    .map((label) => ({ label, activities: groups[label] }))
}
