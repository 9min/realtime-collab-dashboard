import { describe, it, expect } from 'vitest'

import type { Tables } from '@/types/database'

import { parseMentions, parseMentionSegments } from './mention-utils'

const makeProfile = (overrides: Partial<Tables<'profiles'>> = {}): Tables<'profiles'> => ({
  id: 'user-1',
  email: 'alice@test.com',
  full_name: 'Alice Kim',
  avatar_url: null,
  is_admin: false,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
})

const members = [
  { user_id: 'user-1', profiles: makeProfile() },
  { user_id: 'user-2', profiles: makeProfile({ id: 'user-2', email: 'bob@test.com', full_name: 'Bob Lee' }) },
]

describe('mention-utils', () => {
  // ── parseMentions ──
  describe('parseMentions', () => {
    it('단일 멘션을 파싱한다', () => {
      const result = parseMentions('Hello @Alice Kim', members)
      expect(result).toEqual(['user-1'])
    })

    it('복수 멘션을 파싱한다', () => {
      const result = parseMentions('@Alice Kim and @Bob Lee', members)
      expect(result).toEqual(['user-1', 'user-2'])
    })

    it('매칭되는 멤버가 없으면 빈 배열을 반환한다', () => {
      const result = parseMentions('@Unknown User hello', members)
      expect(result).toEqual([])
    })

    it('중복 멘션은 한 번만 포함한다', () => {
      const result = parseMentions('@Alice Kim and again @Alice Kim', members)
      expect(result).toEqual(['user-1'])
    })

    it('full_name이 null이면 email로 대체하여 매칭한다', () => {
      // full_name이 null이면 email을 이름으로 사용
      const noNameMembers = [
        { user_id: 'user-3', profiles: makeProfile({ id: 'user-3', full_name: null, email: 'Charlie Test' }) },
      ]
      const result = parseMentions('Hey @Charlie Test please review', noNameMembers)
      expect(result).toEqual(['user-3'])
    })
  })

  // ── parseMentionSegments ──
  describe('parseMentionSegments', () => {
    it('멘션이 없으면 text 세그먼트만 반환한다', () => {
      const result = parseMentionSegments('Hello world', members)
      expect(result).toEqual([{ type: 'text', content: 'Hello world' }])
    })

    it('멘션만 있으면 mention 세그먼트만 반환한다', () => {
      const result = parseMentionSegments('@Alice Kim', members)
      expect(result).toEqual([{ type: 'mention', content: '@Alice Kim', userId: 'user-1' }])
    })

    it('텍스트와 멘션이 혼합된 경우 세그먼트를 분리한다', () => {
      const result = parseMentionSegments('Hi @Alice Kim, please review', members)
      expect(result).toHaveLength(3)
      expect(result[0]).toEqual({ type: 'text', content: 'Hi ' })
      expect(result[1]).toEqual({ type: 'mention', content: '@Alice Kim', userId: 'user-1' })
      expect(result[2]).toEqual({ type: 'text', content: ', please review' })
    })

    it('연속된 멘션을 올바르게 분리한다', () => {
      const result = parseMentionSegments('@Alice Kim@Bob Lee', members)
      expect(result).toHaveLength(2)
      expect(result[0].type).toBe('mention')
      expect(result[1].type).toBe('mention')
    })

    it('매칭되지 않는 @는 텍스트로 처리한다', () => {
      const result = parseMentionSegments('email: @unknown text', members)
      expect(result).toEqual([{ type: 'text', content: 'email: @unknown text' }])
    })
  })
})
