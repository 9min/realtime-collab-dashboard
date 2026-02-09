import { describe, it, expect } from 'vitest'

import { escapeCsvField } from './export-service'

describe('export-service', () => {
  describe('escapeCsvField', () => {
    it('일반 문자열은 그대로 반환한다', () => {
      expect(escapeCsvField('hello')).toBe('hello')
    })

    it('쉼표가 포함된 문자열을 이스케이프한다', () => {
      expect(escapeCsvField('hello, world')).toBe('"hello, world"')
    })

    it('큰따옴표가 포함된 문자열을 이스케이프한다', () => {
      expect(escapeCsvField('say "hi"')).toBe('"say ""hi"""')
    })

    it('줄바꿈이 포함된 문자열을 이스케이프한다', () => {
      expect(escapeCsvField('line1\nline2')).toBe('"line1\nline2"')
    })

    it('빈 문자열은 그대로 반환한다', () => {
      expect(escapeCsvField('')).toBe('')
    })

    it('특수문자가 없으면 따옴표로 감싸지 않는다', () => {
      expect(escapeCsvField('simple text')).toBe('simple text')
    })
  })
})
