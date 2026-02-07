import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn (className merge)', () => {
  it('단일 클래스', () => {
    expect(cn('text-red-500')).toBe('text-red-500')
  })

  it('복수 클래스 병합', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1')
  })

  it('Tailwind 충돌 해결: 뒤가 우선', () => {
    const result = cn('text-red-500', 'text-blue-500')
    expect(result).toBe('text-blue-500')
  })

  it('조건부 클래스 (falsy 무시)', () => {
    const isActive = false
    expect(cn('base', isActive && 'active')).toBe('base')
  })

  it('조건부 클래스 (truthy 적용)', () => {
    const isActive = true
    expect(cn('base', isActive && 'active')).toBe('base active')
  })

  it('undefined/null 무시', () => {
    expect(cn('base', undefined, null, 'extra')).toBe('base extra')
  })
})
