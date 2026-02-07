import { describe, it, expect, beforeEach } from 'vitest'
import { useDashboardStore } from './dashboard-store'

describe('useDashboardStore', () => {
  beforeEach(() => {
    useDashboardStore.setState({
      isEditMode: false,
      isAddWidgetOpen: false,
    })
  })

  describe('editMode', () => {
    it('초기 상태: 편집 모드 아님', () => {
      expect(useDashboardStore.getState().isEditMode).toBe(false)
    })

    it('toggleEditMode: 토글', () => {
      useDashboardStore.getState().toggleEditMode()
      expect(useDashboardStore.getState().isEditMode).toBe(true)

      useDashboardStore.getState().toggleEditMode()
      expect(useDashboardStore.getState().isEditMode).toBe(false)
    })

    it('setEditMode: 명시적 설정', () => {
      useDashboardStore.getState().setEditMode(true)
      expect(useDashboardStore.getState().isEditMode).toBe(true)
    })
  })

  describe('addWidgetDialog', () => {
    it('초기 상태: 다이얼로그 닫힘', () => {
      expect(useDashboardStore.getState().isAddWidgetOpen).toBe(false)
    })

    it('setAddWidgetOpen: 열기/닫기', () => {
      useDashboardStore.getState().setAddWidgetOpen(true)
      expect(useDashboardStore.getState().isAddWidgetOpen).toBe(true)

      useDashboardStore.getState().setAddWidgetOpen(false)
      expect(useDashboardStore.getState().isAddWidgetOpen).toBe(false)
    })
  })
})
