import { describe, expect, test } from 'vitest'
import { z } from 'zod'

import { delay, flushState, nextStateId } from '../../../testHarness.js'
import { stateFactory } from '../../../../src/stateFactory/stateFactory.js'
import { stateMemoizedGetterFactory, twoStatesMemoizedGetterFactory } from '../../../../src/stateFactory/utils/shared/index.js'

const schema = z.object({
  count: z.number().default(0),
  label: z.string().default(''),
})

describe('memoized getters', () => {
  test('recomputes a single state when the snapshot changes', async () => {
    const state = stateFactory({
      id: nextStateId('memo'),
      loggerCategory: 'test',
      schema,
      getters: [],
    })
    await flushState()
    let calls = 0
    const readCount = stateMemoizedGetterFactory<typeof state>()((snap) => {
      calls += 1
      return snap.count
    })

    expect(readCount(state)).toBe(0)
    expect(readCount(state)).toBe(0)
    expect(calls).toBe(1)

    state.count = 4
    await delay(0)
    expect(readCount(state)).toBe(4)
    expect(calls).toBe(2)
  })

  test('recomputes two states when either snapshot changes', async () => {
    const left = stateFactory({
      id: nextStateId('memo-left'),
      loggerCategory: 'test',
      schema,
      getters: [],
    })
    const right = stateFactory({
      id: nextStateId('memo-right'),
      loggerCategory: 'test',
      schema,
      getters: [],
    })
    await flushState()
    let calls = 0
    const readSum = twoStatesMemoizedGetterFactory<typeof left, typeof right>()((a, b) => {
      calls += 1
      return a.count + b.count
    })

    expect(readSum(left, right)).toBe(0)
    expect(readSum(left, right)).toBe(0)
    expect(calls).toBe(1)

    right.count = 3
    await delay(0)
    expect(readSum(left, right)).toBe(3)
    expect(calls).toBe(2)
  })
})
