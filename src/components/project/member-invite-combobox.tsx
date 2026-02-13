'use client'

import { useState, useEffect, useMemo } from 'react'
import { Loader2, ChevronsUpDown, X } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useSearchProfiles } from '@/queries/use-projects'
import { useProjectMembers } from '@/queries/use-projects'

interface SelectedUser {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
}

interface MemberInviteComboboxProps {
  projectId: string
  value: SelectedUser | null
  onSelect: (user: SelectedUser | null) => void
}

const DEBOUNCE_MS = 300
const MIN_QUERY_LENGTH = 2

export function MemberInviteCombobox({ projectId, value, onSelect }: MemberInviteComboboxProps) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  const { data: members } = useProjectMembers(projectId)

  const excludeUserIds = useMemo(() => members?.map((m) => m.user_id) ?? [], [members])

  const { data: profiles, isLoading } = useSearchProfiles(debouncedQuery, excludeUserIds)

  // Debounce input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(inputValue)
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [inputValue])

  const handleSelect = (profile: SelectedUser) => {
    onSelect(profile)
    setOpen(false)
    setInputValue('')
    setDebouncedQuery('')
  }

  const handleClear = () => {
    onSelect(null)
    setInputValue('')
    setDebouncedQuery('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {value ? (
            <div className="flex min-w-0 items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={value.avatar_url ?? undefined} />
                <AvatarFallback className="text-[10px]">
                  {value.full_name?.slice(0, 2).toUpperCase() ?? '??'}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{value.full_name ?? value.email}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">사용자 검색...</span>
          )}
          {value ? (
            <X
              className="ml-2 h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation()
                handleClear()
              }}
            />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="이름 또는 이메일로 검색..."
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            {isLoading && debouncedQuery.length >= MIN_QUERY_LENGTH ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
              </div>
            ) : inputValue.length < MIN_QUERY_LENGTH ? (
              <CommandEmpty>2글자 이상 입력해주세요</CommandEmpty>
            ) : !profiles?.length ? (
              <CommandEmpty>검색 결과가 없습니다</CommandEmpty>
            ) : (
              <CommandGroup>
                {profiles.map((profile) => (
                  <CommandItem
                    key={profile.id}
                    value={profile.id}
                    onSelect={() =>
                      handleSelect({
                        id: profile.id,
                        email: profile.email,
                        full_name: profile.full_name,
                        avatar_url: profile.avatar_url,
                      })
                    }
                    className="flex items-center gap-2"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={profile.avatar_url ?? undefined} />
                      <AvatarFallback className="text-[10px]">
                        {profile.full_name?.slice(0, 2).toUpperCase() ?? '??'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {profile.full_name ?? '사용자'}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">{profile.email}</p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
