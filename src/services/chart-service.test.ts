import { describe, it, expect } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database'
import { createMockSupabaseClient } from '@/__tests__/helpers/mock-supabase'
import { MOCK_PROJECT_ID, mockColumns, mockTasks } from '@/__tests__/helpers/fixtures'

import { getTaskStatusData, getWeeklyProgressData, getBurndownData } from './chart-service'

type Client = SupabaseClient<Database>

describe('chart-service', () => {
  // ── getTaskStatusData ──
  describe('getTaskStatusData', () => {
    it('컬럼별 태스크 수와 색상을 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [
          // columns 조회
          { data: mockColumns, error: null },
          // tasks 조회
          { data: mockTasks, error: null },
        ],
      }) as Client

      const result = await getTaskStatusData(client, MOCK_PROJECT_ID)

      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(3)
      // 할 일: 1개, 진행 중: 1개, 완료: 1개
      expect(result.data?.[0]).toEqual(
        expect.objectContaining({ name: '할 일', value: 1, color: expect.any(String) }),
      )
      expect(result.data?.[1]).toEqual(expect.objectContaining({ name: '진행 중', value: 1 }))
      expect(result.data?.[2]).toEqual(expect.objectContaining({ name: '완료', value: 1 }))
    })

    it('태스크가 없으면 value가 모두 0이다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [
          { data: mockColumns, error: null },
          { data: [], error: null },
        ],
      }) as Client

      const result = await getTaskStatusData(client, MOCK_PROJECT_ID)

      expect(result.error).toBeNull()
      result.data?.forEach((item) => {
        expect(item.value).toBe(0)
      })
    })

    it('컬럼 조회 에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [
          { data: null, error: { code: 'PGRST116', message: 'error' } },
          { data: [], error: null },
        ],
      }) as Client

      const result = await getTaskStatusData(client, MOCK_PROJECT_ID)

      expect(result.data).toBeNull()
      expect(result.error).not.toBeNull()
    })

    it('태스크 조회 에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [
          { data: mockColumns, error: null },
          { data: null, error: { code: 'PGRST116', message: 'error' } },
        ],
      }) as Client

      const result = await getTaskStatusData(client, MOCK_PROJECT_ID)

      expect(result.data).toBeNull()
      expect(result.error).not.toBeNull()
    })
  })

  // ── getWeeklyProgressData ──
  describe('getWeeklyProgressData', () => {
    it('7일간 생성/완료 데이터를 반환한다', async () => {
      const doneColumn = mockColumns[2] // 완료 컬럼

      const client = createMockSupabaseClient({
        fromResponses: [
          // tasks 조회
          { data: mockTasks, error: null },
          // 마지막 컬럼(완료) 조회
          { data: [doneColumn], error: null },
        ],
      }) as Client

      const result = await getWeeklyProgressData(client, MOCK_PROJECT_ID)

      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(7)
      result.data?.forEach((day) => {
        expect(day).toHaveProperty('date')
        expect(day).toHaveProperty('completed')
        expect(day).toHaveProperty('created')
        expect(typeof day.completed).toBe('number')
        expect(typeof day.created).toBe('number')
      })
    })

    it('태스크 조회 에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'ERR', message: 'fetch error' } }],
      }) as Client

      const result = await getWeeklyProgressData(client, MOCK_PROJECT_ID)

      expect(result.data).toBeNull()
      expect(result.error).not.toBeNull()
    })

    it('완료 컬럼이 없으면 completed는 0이다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [
          { data: mockTasks, error: null },
          // 완료 컬럼이 없음
          { data: [], error: null },
        ],
      }) as Client

      const result = await getWeeklyProgressData(client, MOCK_PROJECT_ID)

      expect(result.error).toBeNull()
      result.data?.forEach((day) => {
        expect(day.completed).toBe(0)
      })
    })
  })

  // ── getBurndownData ──
  describe('getBurndownData', () => {
    it('7일간 remaining + ideal 번다운 데이터를 반환한다', async () => {
      const doneColumn = mockColumns[2]

      const client = createMockSupabaseClient({
        fromResponses: [
          { data: mockTasks, error: null },
          { data: [doneColumn], error: null },
        ],
      }) as Client

      const result = await getBurndownData(client, MOCK_PROJECT_ID)

      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(7)
      result.data?.forEach((day) => {
        expect(day).toHaveProperty('date')
        expect(day).toHaveProperty('remaining')
        expect(day).toHaveProperty('ideal')
        expect(typeof day.remaining).toBe('number')
        expect(typeof day.ideal).toBe('number')
      })
    })

    it('태스크가 없으면 빈 배열을 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [
          { data: [], error: null },
          { data: [], error: null },
        ],
      }) as Client

      const result = await getBurndownData(client, MOCK_PROJECT_ID)

      expect(result.error).toBeNull()
      expect(result.data).toEqual([])
    })

    it('태스크 조회 에러 시 error를 반환한다', async () => {
      const client = createMockSupabaseClient({
        fromResponses: [{ data: null, error: { code: 'ERR', message: 'error' } }],
      }) as Client

      const result = await getBurndownData(client, MOCK_PROJECT_ID)

      expect(result.data).toBeNull()
      expect(result.error).not.toBeNull()
    })

    it('ideal은 선형 감소한다', async () => {
      const doneColumn = mockColumns[2]

      const client = createMockSupabaseClient({
        fromResponses: [
          { data: mockTasks, error: null },
          { data: [doneColumn], error: null },
        ],
      }) as Client

      const result = await getBurndownData(client, MOCK_PROJECT_ID)

      expect(result.error).toBeNull()
      if (result.data && result.data.length > 1) {
        // 첫 날 ideal은 전체 태스크 수
        expect(result.data[0].ideal).toBe(mockTasks.length)
        // 마지막 날 ideal은 0
        expect(result.data[result.data.length - 1].ideal).toBe(0)
      }
    })
  })
})
