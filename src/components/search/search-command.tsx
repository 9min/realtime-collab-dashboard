'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, FolderKanban, Loader2, MessageSquare, Star } from 'lucide-react'

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuth } from '@/hooks/use-auth'
import { useFavoriteIds } from '@/queries/use-favorites'
import { useSearch } from '@/queries/use-search'
import { useSearchStore } from '@/stores/search-store'

export function SearchCommand() {
  const router = useRouter()
  const { isOpen, setOpen, reset } = useSearchStore()
  const { user } = useAuth()
  const { data: favoriteIds } = useFavoriteIds(user?.id)
  const [inputValue, setInputValue] = useState('')
  const { data: results, isLoading } = useSearch(inputValue)

  // Cmd+K / Ctrl+K 단축키 (전역)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(!isOpen)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, setOpen])

  const handleSelect = (callback: () => void) => {
    callback()
    reset()
    setInputValue('')
  }

  const handleOpenChange = (open: boolean) => {
    setOpen(open)
    if (!open) {
      setInputValue('')
    }
  }

  const hasResults =
    results &&
    (results.projects.length > 0 || results.tasks.length > 0 || results.comments.length > 0)

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogHeader className="sr-only">
        <DialogTitle>검색</DialogTitle>
        <DialogDescription>프로젝트, 태스크, 댓글을 검색합니다</DialogDescription>
      </DialogHeader>
      <DialogContent className="overflow-hidden p-0" showCloseButton={false}>
        {/* shouldFilter={false}: 서버 사이드 검색이므로 cmdk 내장 필터 비활성화 */}
        <Command
          shouldFilter={false}
          className="[&_[cmdk-group-heading]]:text-muted-foreground **:data-[slot=command-input-wrapper]:h-12 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]]:px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5"
        >
          <CommandInput
            placeholder="프로젝트, 태스크, 댓글 검색..."
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            {inputValue.length < 2 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                2글자 이상 입력해주세요
              </div>
            )}
            {inputValue.length >= 2 && isLoading && (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                검색 중...
              </div>
            )}
            {inputValue.length >= 2 && !isLoading && !hasResults && (
              <CommandEmpty>검색 결과가 없습니다</CommandEmpty>
            )}

            {results && results.projects.length > 0 && (
              <CommandGroup heading="프로젝트">
                {results.projects.map((p) => (
                  <CommandItem
                    key={p.id}
                    value={`project-${p.id}`}
                    onSelect={() => handleSelect(() => router.push(`/projects/${p.id}`))}
                  >
                    <FolderKanban className="text-muted-foreground mr-2 h-4 w-4" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      {p.description && (
                        <p className="text-muted-foreground truncate text-xs">{p.description}</p>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {results && results.tasks.length > 0 && (
              <CommandGroup heading="태스크">
                {results.tasks.map((t) => (
                  <CommandItem
                    key={t.id}
                    value={`task-${t.id}`}
                    onSelect={() => handleSelect(() => router.push(`/projects/${t.projectId}/board?taskId=${t.id}`))}
                  >
                    {favoriteIds?.has(t.id) ? (
                      <Star className="mr-2 h-4 w-4 shrink-0 fill-amber-400 text-amber-400" />
                    ) : (
                      <FileText className="text-muted-foreground mr-2 h-4 w-4" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{t.title}</p>
                      <p className="text-muted-foreground truncate text-xs">{t.projectName}</p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {results && results.comments.length > 0 && (
              <CommandGroup heading="댓글">
                {results.comments.map((c) => (
                  <CommandItem
                    key={c.id}
                    value={`comment-${c.id}`}
                    onSelect={() => handleSelect(() => router.push(`/projects/${c.projectId}/board?taskId=${c.taskId}`))}
                  >
                    <MessageSquare className="text-muted-foreground mr-2 h-4 w-4" />
                    <div className="min-w-0">
                      <p className="truncate text-sm">{c.content}</p>
                      <p className="text-muted-foreground truncate text-xs">{c.taskTitle}</p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
