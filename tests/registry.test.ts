import { describe, expect, test } from 'vitest'

import { allStates, forEachState, registerState } from '../src/index.js'
import { createTestState, flushState } from './testHarness.js'

describe('registry', () => {
  test('registerState and forEachState walk registered states', async () => {
    const first = createTestState()
    const second = createTestState()
    const ignored = createTestState()
    await flushState()
    registerState(first)
    registerState(second)

    const seen: unknown[] = []
    forEachState((state) => seen.push(state))
    expect(seen).toEqual([first, second])
    expect(allStates).toHaveLength(2)
    expect(seen).not.toContain(ignored)
  })
})
