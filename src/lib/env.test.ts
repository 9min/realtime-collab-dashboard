import { describe, it, expect, vi, afterEach } from 'vitest'

import { validateClientEnv, validateServerEnv } from './env'

describe('env', () => {
  const originalEnv = process.env

  afterEach(() => {
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  describe('validateClientEnv', () => {
    it('유효한 환경변수면 성공한다', () => {
      process.env = {
        ...originalEnv,
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      }

      const result = validateClientEnv()
      expect(result.NEXT_PUBLIC_SUPABASE_URL).toBe('https://test.supabase.co')
      expect(result.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe('test-anon-key')
    })

    it('URL이 누락되면 에러를 던진다', () => {
      process.env = {
        ...originalEnv,
        NEXT_PUBLIC_SUPABASE_URL: undefined,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      }

      expect(() => validateClientEnv()).toThrow('환경변수 검증 실패')
    })

    it('KEY가 누락되면 에러를 던진다', () => {
      process.env = {
        ...originalEnv,
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
      }

      expect(() => validateClientEnv()).toThrow('환경변수 검증 실패')
    })
  })

  describe('validateServerEnv', () => {
    it('유효한 환경변수면 성공한다', () => {
      process.env = {
        ...originalEnv,
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
        SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
      }

      const result = validateServerEnv()
      expect(result.NEXT_PUBLIC_SUPABASE_URL).toBe('https://test.supabase.co')
      expect(result.SUPABASE_SERVICE_ROLE_KEY).toBe('test-service-key')
    })

    it('클라이언트 키가 누락되면 에러를 던진다', () => {
      process.env = {
        ...originalEnv,
        NEXT_PUBLIC_SUPABASE_URL: undefined,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined,
        SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
      }

      expect(() => validateServerEnv()).toThrow('서버 환경변수 검증 실패')
    })
  })
})
