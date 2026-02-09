'use client'

import { Check, ChevronDown, Search, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ACTION_CONFIG, ACTION_DOT_COLORS, ENTITY_CONFIG } from '@/lib/activity-constants'
import { cn } from '@/lib/utils'
import { useActivityFilterStore } from '@/stores/activity-filter-store'
import { ACTIVITY_ACTION, ACTIVITY_ENTITY } from '@/types/activity'
import type { ActivityAction, ActivityEntity } from '@/types/activity'
import type { Tables } from '@/types/database'

interface ActivityFilterBarProps {
  members: (Tables<'project_members'> & { profiles: Tables<'profiles'> })[]
}

const ALL_ACTIONS = Object.values(ACTIVITY_ACTION) as ActivityAction[]
const ALL_ENTITIES = Object.values(ACTIVITY_ENTITY) as ActivityEntity[]

export function ActivityFilterBar({ members }: ActivityFilterBarProps) {
  const {
    searchText,
    setSearchText,
    actionTypes,
    toggleActionType,
    entityTypes,
    toggleEntityType,
    userIds,
    toggleUserId,
    resetFilters,
    hasActiveFilters,
  } = useActivityFilterStore()

  const memberOptions = members.map((m) => ({
    id: m.user_id,
    label: m.profiles.full_name ?? m.profiles.email,
  }))

  const actionLabel =
    actionTypes.length === 0
      ? '전체'
      : actionTypes.length === 1
        ? ACTION_CONFIG[actionTypes[0]].label
        : `${actionTypes.length}개 선택`

  const entityLabel =
    entityTypes.length === 0
      ? '전체'
      : entityTypes.length === 1
        ? ENTITY_CONFIG[entityTypes[0]].label
        : `${entityTypes.length}개 선택`

  const userLabel =
    userIds.length === 0
      ? '전체'
      : userIds.length === 1
        ? (memberOptions.find((m) => m.id === userIds[0])?.label ?? '1명')
        : `${userIds.length}명 선택`

  return (
    <div className="bg-muted/30 flex flex-wrap items-center gap-3 rounded-lg border p-3">
      {/* Search Input */}
      <div className="relative w-56">
        <Search className="text-muted-foreground absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="활동 검색..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Action Type */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 cursor-pointer gap-1.5 text-sm font-normal">
            <span className="text-muted-foreground">액션:</span>
            <span>{actionLabel}</span>
            <ChevronDown className="text-muted-foreground h-3.5 w-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-44 p-1">
          {ALL_ACTIONS.map((action) => {
            const isActive = actionTypes.includes(action)
            const config = ACTION_CONFIG[action]
            return (
              <button
                key={action}
                onClick={() => toggleActionType(action)}
                className={cn(
                  'flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  isActive && 'bg-accent/50',
                )}
              >
                <div
                  className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border',
                    isActive ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30',
                  )}
                >
                  {isActive && <Check className="h-3 w-3" />}
                </div>
                <span className={cn('h-2 w-2 rounded-full', ACTION_DOT_COLORS[action])} />
                {config.label}
              </button>
            )
          })}
        </PopoverContent>
      </Popover>

      {/* Entity Type */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 cursor-pointer gap-1.5 text-sm font-normal">
            <span className="text-muted-foreground">대상:</span>
            <span>{entityLabel}</span>
            <ChevronDown className="text-muted-foreground h-3.5 w-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-44 p-1">
          {ALL_ENTITIES.map((entity) => {
            const isActive = entityTypes.includes(entity)
            const config = ENTITY_CONFIG[entity]
            const EntityIcon = config.icon
            return (
              <button
                key={entity}
                onClick={() => toggleEntityType(entity)}
                className={cn(
                  'flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  isActive && 'bg-accent/50',
                )}
              >
                <div
                  className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border',
                    isActive ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30',
                  )}
                >
                  {isActive && <Check className="h-3 w-3" />}
                </div>
                <EntityIcon className="text-muted-foreground h-3.5 w-3.5" />
                {config.label}
              </button>
            )
          })}
        </PopoverContent>
      </Popover>

      {/* User */}
      {memberOptions.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 cursor-pointer gap-1.5 text-sm font-normal">
              <span className="text-muted-foreground">사용자:</span>
              <span>{userLabel}</span>
              <ChevronDown className="text-muted-foreground h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-48 p-1">
            {memberOptions.map((option) => {
              const isActive = userIds.includes(option.id)
              return (
                <button
                  key={option.id}
                  onClick={() => toggleUserId(option.id)}
                  className={cn(
                    'flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors',
                    'hover:bg-accent hover:text-accent-foreground',
                    isActive && 'bg-accent/50',
                  )}
                >
                  <div
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border',
                      isActive ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30',
                    )}
                  >
                    {isActive && <Check className="h-3 w-3" />}
                  </div>
                  {option.label}
                </button>
              )
            })}
          </PopoverContent>
        </Popover>
      )}

      {/* Reset Filters */}
      {hasActiveFilters() && (
        <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 cursor-pointer gap-1 text-xs">
          <X className="h-3 w-3" />
          초기화
        </Button>
      )}
    </div>
  )
}
