import { describe, it, expect } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database'
import { createMockSupabaseClient } from '@/__tests__/helpers/mock-supabase'
import {
  MOCK_PROJECT_ID,
  MOCK_USER_ID,
  mockLayoutItems,
  mockDashboardLayout,
} from '@/__tests__/helpers/fixtures'

import { getDashboardLayout, saveDashboardLayout } from './dashboard-service'

type Client = SupabaseClient<Database>

describe('dashboard-service', () => {
  // ── getDashboardLayout ──
  describe('getDashboardLayout', () => {
    it('사용자의 대시보드 레이아웃을 반환한다', async () => {
      const client = createMockSupabaseClient({
        authUser: { id: MOCK_USER_ID },
        fromResponses: [{ data: mockDashboardLayout, error: null }],
      }) as Client

      const result = await getDashboardLayout(client, MOCK_PROJECT_ID)

      expect(result.error).toBeNull()
      expect(result.data).toEqual(mockLayoutItems)
    })

    it('레이아웃이 없으면 null을 반환한다 (기본 레이아웃 사용)', async () => {
      const client = createMockSupabaseClient({
        authUser: { id: MOCK_USER_ID },
        fromResponses: [{ data: null, error: null }],
      }) as Client

      const result = await getDashboardLayout(client, MOCK_PROJECT_ID)

      expect(result.error).toBeNull()
      expect(result.data).toBeNull()
    })

    it('미인증 사용자면 UNAUTHORIZED를 반환한다', async () => {
      const client = createMockSupabaseClient({
        authUser: null,
      }) as Client

      const result = await getDashboardLayout(client, MOCK_PROJECT_ID)

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('UNAUTHORIZED')
    })

    it('DB 에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        authUser: { id: MOCK_USER_ID },
        fromResponses: [{ data: null, error: { code: 'PGRST116', message: 'error' } }],
      }) as Client

      const result = await getDashboardLayout(client, MOCK_PROJECT_ID)

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('PGRST116')
    })
  })

  // ── saveDashboardLayout ──
  describe('saveDashboardLayout', () => {
    it('레이아웃을 저장(upsert)하고 반환한다', async () => {
      const client = createMockSupabaseClient({
        authUser: { id: MOCK_USER_ID },
        fromResponses: [{ data: mockDashboardLayout, error: null }],
      }) as Client

      const result = await saveDashboardLayout(client, MOCK_PROJECT_ID, mockLayoutItems)

      expect(result.error).toBeNull()
      expect(result.data).toEqual(mockDashboardLayout)
    })

    it('미인증 사용자면 UNAUTHORIZED를 반환한다', async () => {
      const client = createMockSupabaseClient({
        authUser: null,
      }) as Client

      const result = await saveDashboardLayout(client, MOCK_PROJECT_ID, mockLayoutItems)

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('UNAUTHORIZED')
    })

    it('저장 에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        authUser: { id: MOCK_USER_ID },
        fromResponses: [{ data: null, error: { code: '23505', message: 'conflict' } }],
      }) as Client

      const result = await saveDashboardLayout(client, MOCK_PROJECT_ID, mockLayoutItems)

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('23505')
    })

    it('data가 null이면 UNKNOWN 에러를 반환한다', async () => {
      const client = createMockSupabaseClient({
        authUser: { id: MOCK_USER_ID },
        fromResponses: [{ data: null, error: null }],
      }) as Client

      const result = await saveDashboardLayout(client, MOCK_PROJECT_ID, mockLayoutItems)

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('UNKNOWN')
    })
  })
})
