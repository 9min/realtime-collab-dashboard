import { create } from 'zustand'

type CalendarViewMode = 'month' | 'week'

interface CalendarState {
  currentDate: Date
  viewMode: CalendarViewMode
  setCurrentDate: (date: Date) => void
  setViewMode: (mode: CalendarViewMode) => void
  goToToday: () => void
  goToPrev: () => void
  goToNext: () => void
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  currentDate: new Date(),
  viewMode: 'month',

  setCurrentDate: (date) => set({ currentDate: date }),
  setViewMode: (mode) => set({ viewMode: mode }),

  goToToday: () => set({ currentDate: new Date() }),

  goToPrev: () => {
    const { currentDate, viewMode } = get()
    const next = new Date(currentDate)
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() - 1)
    } else {
      next.setDate(next.getDate() - 7)
    }
    set({ currentDate: next })
  },

  goToNext: () => {
    const { currentDate, viewMode } = get()
    const next = new Date(currentDate)
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() + 1)
    } else {
      next.setDate(next.getDate() + 7)
    }
    set({ currentDate: next })
  },
}))
