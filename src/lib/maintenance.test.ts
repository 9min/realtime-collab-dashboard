import { describe, it, expect, afterEach, vi } from 'vitest'

import {
  isMaintenanceEnabled,
  getMaintenanceConfig,
  verifyBypassKey,
  MAINTENANCE_BYPASS_COOKIE,
  MAINTENANCE_PATH,
} from './maintenance'

// maintenance.json mock
vi.mock('../../maintenance.json', () => ({
  default: { enabled: false, message: '', until: '' },
}))

import config from '../../maintenance.json'

describe('maintenance', () => {
  const originalEnv = process.env

  afterEach(() => {
    process.env = originalEnv
    // reset config
    config.enabled = false
    config.message = ''
    config.until = ''
    vi.restoreAllMocks()
  })

  describe('상수', () => {
    it('MAINTENANCE_BYPASS_COOKIE가 정의되어 있다', () => {
      expect(MAINTENANCE_BYPASS_COOKIE).toBe('maintenance_bypass')
    })

    it('MAINTENANCE_PATH가 정의되어 있다', () => {
      expect(MAINTENANCE_PATH).toBe('/maintenance')
    })
  })

  describe('isMaintenanceEnabled', () => {
    it('enabled가 true이면 true를 반환한다', () => {
      config.enabled = true
      expect(isMaintenanceEnabled()).toBe(true)
    })

    it('enabled가 false이면 false를 반환한다', () => {
      config.enabled = false
      expect(isMaintenanceEnabled()).toBe(false)
    })
  })

  describe('getMaintenanceConfig', () => {
    it('설정값을 올바르게 반환한다', () => {
      config.enabled = true
      config.message = '서버 점검 중'
      config.until = '오후 6시'
      const result = getMaintenanceConfig()
      expect(result).toEqual({
        enabled: true,
        message: '서버 점검 중',
        until: '오후 6시',
      })
    })

    it('message가 빈 문자열이면 기본 메시지를 반환한다', () => {
      config.message = ''
      const result = getMaintenanceConfig()
      expect(result.message).toContain('시스템 점검')
    })

    it('until이 빈 문자열이면 빈 문자열을 반환한다', () => {
      config.until = ''
      const result = getMaintenanceConfig()
      expect(result.until).toBe('')
    })
  })

  describe('verifyBypassKey', () => {
    it('올바른 키를 제공하면 true를 반환한다', () => {
      process.env = { ...originalEnv, MAINTENANCE_BYPASS_KEY: 'secret-key-123' }
      expect(verifyBypassKey('secret-key-123')).toBe(true)
    })

    it('잘못된 키를 제공하면 false를 반환한다', () => {
      process.env = { ...originalEnv, MAINTENANCE_BYPASS_KEY: 'secret-key-123' }
      expect(verifyBypassKey('wrong-key')).toBe(false)
    })

    it('빈 문자열을 제공하면 false를 반환한다', () => {
      process.env = { ...originalEnv, MAINTENANCE_BYPASS_KEY: 'secret-key-123' }
      expect(verifyBypassKey('')).toBe(false)
    })

    it('MAINTENANCE_BYPASS_KEY가 미설정이면 항상 false를 반환한다', () => {
      process.env = { ...originalEnv, MAINTENANCE_BYPASS_KEY: undefined }
      expect(verifyBypassKey('any-key')).toBe(false)
    })

    it('MAINTENANCE_BYPASS_KEY가 빈 문자열이면 항상 false를 반환한다', () => {
      process.env = { ...originalEnv, MAINTENANCE_BYPASS_KEY: '' }
      expect(verifyBypassKey('')).toBe(false)
    })

    it('길이가 같지만 내용이 다른 키는 false를 반환한다', () => {
      process.env = { ...originalEnv, MAINTENANCE_BYPASS_KEY: 'abcdef' }
      expect(verifyBypassKey('abcdeg')).toBe(false)
    })
  })
})
