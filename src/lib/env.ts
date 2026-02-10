import { z } from 'zod'

// 클라이언트 사이드 환경변수 (NEXT_PUBLIC_ 접두사)
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('유효한 Supabase URL이 필요합니다'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase Anon Key가 필요합니다'),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
})

// 서버 사이드 환경변수
const serverEnvSchema = clientEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
})

// 클라이언트 환경변수 검증 (빌드 타임)
export function validateClientEnv() {
  const result = clientEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  })

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors
    throw new Error(`환경변수 검증 실패:\n${JSON.stringify(errors, null, 2)}`)
  }

  return result.data
}

// 서버 환경변수 검증
export function validateServerEnv() {
  const result = serverEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  })

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors
    throw new Error(`서버 환경변수 검증 실패:\n${JSON.stringify(errors, null, 2)}`)
  }

  return result.data
}

// 타입 추론용
export type ClientEnv = z.infer<typeof clientEnvSchema>
export type ServerEnv = z.infer<typeof serverEnvSchema>
