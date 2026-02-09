'use client'

import { useSyncExternalStore } from 'react'
import { Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useSearchStore } from '@/stores/search-store'

const EMPTY_SUBSCRIBE = () => () => {}
const getIsMac = () => navigator.userAgent.includes('Mac')
const getIsMacServer = () => false

export function SearchTrigger() {
  const setOpen = useSearchStore((s) => s.setOpen)
  const isMac = useSyncExternalStore(EMPTY_SUBSCRIBE, getIsMac, getIsMacServer)

  return (
    <Button
      variant="ghost"
      className="h-9 gap-2 text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground"
      onClick={() => setOpen(true)}
      aria-label="검색"
    >
      <Search className="h-4 w-4" />
      <span className="hidden text-sm sm:inline">검색</span>
      <kbd className="pointer-events-none hidden rounded bg-primary-foreground/10 px-1.5 py-0.5 text-[10px] font-medium sm:inline">
        {isMac ? '⌘K' : 'Ctrl+K'}
      </kbd>
    </Button>
  )
}
