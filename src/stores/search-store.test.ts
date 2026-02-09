import { describe, it, expect, beforeEach } from 'vitest'

import { useSearchStore } from './search-store'

describe('search-store', () => {
  beforeEach(() => {
    useSearchStore.setState({ isOpen: false, query: '' })
  })

  it('초기 상태가 올바르다', () => {
    const state = useSearchStore.getState()
    expect(state.isOpen).toBe(false)
    expect(state.query).toBe('')
  })

  it('setOpen으로 열림 상태를 변경한다', () => {
    useSearchStore.getState().setOpen(true)
    expect(useSearchStore.getState().isOpen).toBe(true)

    useSearchStore.getState().setOpen(false)
    expect(useSearchStore.getState().isOpen).toBe(false)
  })

  it('setQuery로 검색어를 변경한다', () => {
    useSearchStore.getState().setQuery('test')
    expect(useSearchStore.getState().query).toBe('test')
  })

  it('reset으로 초기 상태로 복원한다', () => {
    useSearchStore.getState().setOpen(true)
    useSearchStore.getState().setQuery('test query')

    useSearchStore.getState().reset()

    const state = useSearchStore.getState()
    expect(state.isOpen).toBe(false)
    expect(state.query).toBe('')
  })
})
