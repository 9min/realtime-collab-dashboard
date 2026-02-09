'use client'

import { use } from 'react'

import { CalendarView } from '@/components/calendar/calendar-view'

interface CalendarPageProps {
  params: Promise<{ projectId: string }>
}

export default function CalendarPage({ params }: CalendarPageProps) {
  const { projectId } = use(params)

  return <CalendarView projectId={projectId} />
}
