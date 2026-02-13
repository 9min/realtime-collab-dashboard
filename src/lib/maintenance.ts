/**
 * 점검 모드 (Maintenance Mode) 유틸리티
 *
 * maintenance.json 파일로 점검 모드를 제어하며,
 * 관리자 우회키 검증을 위한 상수 시간 비교를 제공한다.
 */

import config from '../../maintenance.json'

export const MAINTENANCE_BYPASS_COOKIE = 'maintenance_bypass'
export const MAINTENANCE_PATH = '/maintenance'

export interface MaintenanceConfig {
  enabled: boolean
  message: string
  until: string
}

export function getMaintenanceConfig(): MaintenanceConfig {
  return {
    enabled: config.enabled ?? false,
    message:
      config.message ||
      '더 나은 서비스 제공을 위해 시스템 점검을 진행하고 있습니다.\n잠시 후 다시 접속해 주세요.',
    until: config.until || '',
  }
}

export function isMaintenanceEnabled(): boolean {
  return config.enabled === true
}

/**
 * 우회키를 상수 시간(constant-time)으로 비교하여 타이밍 공격을 방지한다.
 * 서버 환경변수 `MAINTENANCE_BYPASS_KEY`가 설정되지 않으면 항상 false를 반환한다.
 */
export function verifyBypassKey(provided: string): boolean {
  const expected = process.env.MAINTENANCE_BYPASS_KEY
  if (!expected) return false
  if (provided.length !== expected.length) return false

  let mismatch = 0
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ provided.charCodeAt(i)
  }
  return mismatch === 0
}
