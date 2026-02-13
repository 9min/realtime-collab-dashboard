import { describe, it, expect } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database'
import { createMockSupabaseClient } from '@/__tests__/helpers/mock-supabase'
import { MOCK_USER_ID, MOCK_NOTIFICATION_ID, mockNotification } from '@/__tests__/helpers/fixtures'

import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from './notification-service'

type Client = SupabaseClient<Database>

describe('notification-service', () => {
  // ── getNotifications ──
  describe('getNotifications', () => {
    it('사용자의 알림 목록을 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: [mockNotification], error: null }],
      }) as Client

      const result = await getNotifications(client, MOCK_USER_ID)

      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(1)
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'ERR', message: 'fail' } }],
      }) as Client

      const result = await getNotifications(client, MOCK_USER_ID)

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('ERR')
    })
  })

  // ── getUnreadCount ──
  describe('getUnreadCount', () => {
    it('읽지 않은 알림 수를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: null }],
      }) as Client

      const result = await getUnreadCount(client, MOCK_USER_ID)

      // count가 null이면 0 반환
      expect(result.error).toBeNull()
      expect(result.data).toBe(0)
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'ERR', message: 'fail' } }],
      }) as Client

      const result = await getUnreadCount(client, MOCK_USER_ID)

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('ERR')
    })
  })

  // ── markAsRead ──
  describe('markAsRead', () => {
    it('알림을 읽음 처리한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: null }],
      }) as Client

      const result = await markAsRead(client, MOCK_NOTIFICATION_ID)

      expect(result.error).toBeNull()
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'ERR', message: 'fail' } }],
      }) as Client

      const result = await markAsRead(client, MOCK_NOTIFICATION_ID)

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('ERR')
    })
  })

  // ── markAllAsRead ──
  describe('markAllAsRead', () => {
    it('모든 알림을 읽음 처리한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: null }],
      }) as Client

      const result = await markAllAsRead(client, MOCK_USER_ID)

      expect(result.error).toBeNull()
    })

    it('에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'ERR', message: 'fail' } }],
      }) as Client

      const result = await markAllAsRead(client, MOCK_USER_ID)

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('ERR')
    })
  })
})
