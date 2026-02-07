import { create } from 'zustand'

interface UiState {
  // 모달 상태 관리
  activeModal: string | null
  openModal: (modalId: string) => void
  closeModal: () => void

  // 모바일 메뉴
  isMobileMenuOpen: boolean
  setMobileMenuOpen: (value: boolean) => void
}

export const useUiStore = create<UiState>((set) => ({
  // 모달
  activeModal: null,
  openModal: (modalId) => set({ activeModal: modalId }),
  closeModal: () => set({ activeModal: null }),

  // 모바일 메뉴
  isMobileMenuOpen: false,
  setMobileMenuOpen: (value) => set({ isMobileMenuOpen: value }),
}))
