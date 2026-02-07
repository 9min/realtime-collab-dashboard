import { create } from 'zustand'

interface UiState {
  // 사이드바 열림/닫힘
  isSidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (value: boolean) => void

  // 모달 상태 관리
  activeModal: string | null
  openModal: (modalId: string) => void
  closeModal: () => void

  // 모바일 메뉴
  isMobileMenuOpen: boolean
  setMobileMenuOpen: (value: boolean) => void
}

export const useUiStore = create<UiState>((set) => ({
  // 사이드바
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (value) => set({ isSidebarOpen: value }),

  // 모달
  activeModal: null,
  openModal: (modalId) => set({ activeModal: modalId }),
  closeModal: () => set({ activeModal: null }),

  // 모바일 메뉴
  isMobileMenuOpen: false,
  setMobileMenuOpen: (value) => set({ isMobileMenuOpen: value }),
}))
