'use client'

import { Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useSearchStore } from '@/stores/search-store'

export function SearchTrigger() {
  const setOpen = useSearchStore((s) => s.setOpen)

  return (
    <Button
      variant="ghost"
      className="h-9 gap-2 text-white/70 hover:bg-white/10 hover:text-white"
      onClick={() => setOpen(true)}
    >
      <Search className="h-4 w-4" />
      <span className="hidden text-sm sm:inline">검색</span>
      <kbd className="bg-white/10 pointer-events-none hidden rounded px-1.5 py-0.5 text-[10px] font-medium sm:inline">
        Ctrl+K
      </kbd>
    </Button>
  )
}
