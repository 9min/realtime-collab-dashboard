/**
 * 점검 모드 (Maintenance Mode) 유틸리티
 *
 * 환경변수 기반으로 점검 모드를 제어하며,
 * 관리자 우회키 검증을 위한 상수 시간 비교를 제공한다.
 */

export const MAINTENANCE_BYPASS_COOKIE = 'maintenance_bypass'
export const MAINTENANCE_PATH = '/maintenance'

export function isMaintenanceEnabled(): boolean {
  return process.env.MAINTENANCE_MODE === 'true'
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
