/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import { useSnapshot } from '../src/react.js'
import { createTestState, flushState } from './testHarness.js'

describe('useSnapshot', () => {
  test('reads the state and updates after a write', async () => {
    const state = createTestState()
    await flushState()
    const { result } = renderHook(() => useSnapshot(state))
    expect(result.current.value).toBe('')

    await act(async () => {
      state.value = 'hi'
      await Promise.resolve()
    })
    expect(result.current.value).toBe('hi')
  })

  test('state.useSnap uses the react binding', async () => {
    const state = createTestState()
    await flushState()
    const { result } = renderHook(() => state.useSnap())
    expect(result.current.count).toBe(0)

    await act(async () => {
      state.count = 2
      await Promise.resolve()
    })
    expect(result.current.count).toBe(2)
  })
})
