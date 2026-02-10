'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCalendarStore } from '@/stores/calendar-store'

export function CalendarHeader() {
  const { currentDate, viewMode, setViewMode, goToToday, goToPrev, goToNext } = useCalendarStore()

  const title = currentDate.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
  })

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" className="h-9 w-9" onClick={goToPrev} aria-label="이전">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="min-w-[140px] text-center text-lg font-semibold">{title}</h2>
        <Button variant="outline" size="icon" className="h-9 w-9" onClick={goToNext} aria-label="다음">
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={goToToday}>
          오늘
        </Button>
      </div>

      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'week' | 'month')}>
        <TabsList>
          <TabsTrigger value="week">주</TabsTrigger>
          <TabsTrigger value="month">월</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}
