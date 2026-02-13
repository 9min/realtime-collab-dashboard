import { describe, it, expect } from 'vitest'
import {
  TASK_PRIORITY,
  MEMBER_ROLE,
  DEFAULT_COLUMNS,
  QUERY_CONFIG,
  WIDGET_TYPE,
  DEFAULT_DASHBOARD_LAYOUT,
} from './constants'

describe('constants', () => {
  describe('TASK_PRIORITY', () => {
    it('4가지 우선순위 정의', () => {
      expect(Object.values(TASK_PRIORITY)).toEqual(['low', 'medium', 'high', 'urgent'])
    })
  })

  describe('MEMBER_ROLE', () => {
    it('4가지 역할 정의', () => {
      expect(Object.values(MEMBER_ROLE)).toEqual(['owner', 'admin', 'member', 'viewer'])
    })
  })

  describe('DEFAULT_COLUMNS', () => {
    it('기본 4개 컬럼 (할 일, 진행 중, 완료, 논의 필요)', () => {
      expect(DEFAULT_COLUMNS).toHaveLength(4)
      expect(DEFAULT_COLUMNS[0].title).toBe('할 일')
      expect(DEFAULT_COLUMNS[1].title).toBe('진행 중')
      expect(DEFAULT_COLUMNS[2].title).toBe('완료')
      expect(DEFAULT_COLUMNS[3].title).toBe('논의 필요')
    })

    it('position이 0부터 순차 증가', () => {
      DEFAULT_COLUMNS.forEach((col, i) => {
        expect(col.position).toBe(i)
      })
    })
  })

  describe('QUERY_CONFIG', () => {
    it('staleTime 5분 (300000ms)', () => {
      expect(QUERY_CONFIG.STALE_TIME).toBe(300000)
    })

    it('gcTime 30분 (1800000ms)', () => {
      expect(QUERY_CONFIG.GC_TIME).toBe(1800000)
    })
  })

  describe('WIDGET_TYPE', () => {
    it('6가지 위젯 타입', () => {
      expect(Object.values(WIDGET_TYPE)).toHaveLength(6)
    })
  })

  describe('DEFAULT_DASHBOARD_LAYOUT', () => {
    it('기본 4개 위젯', () => {
      expect(DEFAULT_DASHBOARD_LAYOUT).toHaveLength(4)
    })

    it('각 위젯에 필수 필드 존재', () => {
      DEFAULT_DASHBOARD_LAYOUT.forEach((widget) => {
        expect(widget).toHaveProperty('widget_id')
        expect(widget).toHaveProperty('type')
        expect(widget).toHaveProperty('x')
        expect(widget).toHaveProperty('y')
        expect(widget).toHaveProperty('w')
        expect(widget).toHaveProperty('h')
      })
    })
  })
})
