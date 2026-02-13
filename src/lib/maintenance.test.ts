import { describe, it, expect, afterEach, vi } from 'vitest'

import {
  isMaintenanceEnabled,
  verifyBypassKey,
  MAINTENANCE_BYPASS_COOKIE,
  MAINTENANCE_PATH,
} from './maintenance'

describe('maintenance', () => {
  const originalEnv = process.env

  afterEach(() => {
    process.env = originalEnv
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
    it('MAINTENANCE_MODE가 "true"이면 true를 반환한다', () => {
      process.env = { ...originalEnv, MAINTENANCE_MODE: 'true' }
      expect(isMaintenanceEnabled()).toBe(true)
    })

    it('MAINTENANCE_MODE가 "false"이면 false를 반환한다', () => {
      process.env = { ...originalEnv, MAINTENANCE_MODE: 'false' }
      expect(isMaintenanceEnabled()).toBe(false)
    })

    it('MAINTENANCE_MODE가 미설정이면 false를 반환한다', () => {
      process.env = { ...originalEnv, MAINTENANCE_MODE: undefined }
      expect(isMaintenanceEnabled()).toBe(false)
    })

    it('MAINTENANCE_MODE가 빈 문자열이면 false를 반환한다', () => {
      process.env = { ...originalEnv, MAINTENANCE_MODE: '' }
      expect(isMaintenanceEnabled()).toBe(false)
    })

    it('MAINTENANCE_MODE가 "TRUE"(대문자)이면 false를 반환한다', () => {
      process.env = { ...originalEnv, MAINTENANCE_MODE: 'TRUE' }
      expect(isMaintenanceEnabled()).toBe(false)
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
