import { create } from 'zustand'

interface DashboardState {
  // 편집 모드 (위젯 추가/제거/이동 가능)
  isEditMode: boolean
  toggleEditMode: () => void
  setEditMode: (value: boolean) => void

  // 위젯 추가 다이얼로그
  isAddWidgetOpen: boolean
  setAddWidgetOpen: (value: boolean) => void
}

export const useDashboardStore = create<DashboardState>((set) => ({
  isEditMode: false,
  toggleEditMode: () => set((state) => ({ isEditMode: !state.isEditMode })),
  setEditMode: (value) => set({ isEditMode: value }),

  isAddWidgetOpen: false,
  setAddWidgetOpen: (value) => set({ isAddWidgetOpen: value }),
}))
