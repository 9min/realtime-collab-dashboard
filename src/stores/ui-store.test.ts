import { describe, it, expect, beforeEach } from 'vitest'
import { useUiStore } from './ui-store'

describe('useUiStore', () => {
  beforeEach(() => {
    // 상태 초기화
    useUiStore.setState({
      activeModal: null,
      isMobileMenuOpen: false,
    })
  })

  describe('modal', () => {
    it('초기 상태: 모달 닫힘', () => {
      expect(useUiStore.getState().activeModal).toBeNull()
    })

    it('openModal: 모달 열기', () => {
      useUiStore.getState().openModal('invite-member')
      expect(useUiStore.getState().activeModal).toBe('invite-member')
    })

    it('closeModal: 모달 닫기', () => {
      useUiStore.getState().openModal('invite-member')
      useUiStore.getState().closeModal()
      expect(useUiStore.getState().activeModal).toBeNull()
    })

    it('openModal: 다른 모달로 교체', () => {
      useUiStore.getState().openModal('invite-member')
      useUiStore.getState().openModal('create-task')
      expect(useUiStore.getState().activeModal).toBe('create-task')
    })
  })

  describe('mobileMenu', () => {
    it('초기 상태: 모바일 메뉴 닫힘', () => {
      expect(useUiStore.getState().isMobileMenuOpen).toBe(false)
    })

    it('setMobileMenuOpen: 토글', () => {
      useUiStore.getState().setMobileMenuOpen(true)
      expect(useUiStore.getState().isMobileMenuOpen).toBe(true)
    })
  })
})
