import { describe, expect, test } from 'vitest'
import { z } from 'zod'

import { logMessages } from '../testSetup.js'
import { createTestState, delay, flushState, nextStateId, testSchema } from '../testHarness.js'
import { stateFactory } from '../../src/stateFactory/stateFactory.js'
import { getStateUniqueId } from '../../src/stateFactory/utils/getStateUniqueId.js'
import { createMemoryStorage, setStateStorage } from '../../src/storage.js'
import { subscribeKey } from '../../src/stateFactory/valtioZod/utils/subscribeKey.js'

function baseConfig(id = nextStateId()) {
  return {
    id,
    loggerCategory: 'test',
    schema: testSchema,
    getters: [] as string[],
  }
}

describe('stateFactory', () => {
  test('rejects a schema without defaults', () => {
    expect(() =>
      stateFactory({
        ...baseConfig(),
        schema: z.object({ name: z.string() }),
      }),
    ).toThrow('Not all default values were set in schema')
  })

  test('rejects a getter that is not listed', () => {
    expect(() =>
      stateFactory({
        ...baseConfig(),
        setPrototype: (() => ({
          get total() {
            return 1
          },
        })) as never,
      }),
    ).toThrow(/Missing 'total'/)
  })

  test('rejects a getters entry that is not a getter', () => {
    expect(() =>
      stateFactory({
        ...baseConfig(),
        getters: ['total'],
        setPrototype: (() => ({
          total() {
            return 1
          },
        })) as never,
      }),
    ).toThrow(/Wrong value 'total'/)
  })

  test('rejects a __ prefix', () => {
    expect(() =>
      stateFactory({
        ...baseConfig(),
        setPrototype: (() => ({
          __secret() {
            return 1
          },
        })) as never,
      }),
    ).toThrow(/__/)
  })

  test('rejects a method that conflicts with the base proto', () => {
    expect(() =>
      stateFactory({
        ...baseConfig(),
        setPrototype: (baseProto) => ({
          ...baseProto,
          getSnap() {
            return baseProto.getSnap()
          },
        }),
      }),
    ).toThrow(/conflicts with base proto/)
  })

  test('runs base update and reset before the override, and calls init', async () => {
    const order: string[] = []
    const state = stateFactory({
      ...baseConfig(),
      setPrototype: (baseProto) => ({
        ...baseProto,
        init() {
          order.push('user-init')
        },
        update() {
          order.push('user-update')
        },
        reset() {
          order.push('user-reset')
        },
      }),
    })

    expect(state.isInitialized).toBe(false)
    await flushState()
    expect(state.isInitialized).toBe(true)
    expect(order).toContain('user-init')

    state.on('update', () => order.push('event-update'))
    state.update()
    expect(order.slice(-2)).toEqual(['event-update', 'user-update'])

    state.on('reset', () => order.push('event-reset'))
    state.reset()
    expect(order.slice(-2)).toEqual(['event-reset', 'user-reset'])
  })

  test('supports on, once and off', async () => {
    const state = stateFactory({
      ...baseConfig(),
      eventMap: {} as { ping: (n: number) => void },
      setPrototype: (baseProto) => ({
        ...baseProto,
        ping(n: number) {
          this.emit('ping', n)
        },
      }),
    })
    await flushState()

    const seen: number[] = []
    const off = state.on('ping', (n) => seen.push(n))
    state.ping(1)
    state.ping(2)
    off()
    state.ping(3)
    expect(seen).toEqual([1, 2])

    const onceSeen: number[] = []
    state.once('ping', (n) => onceSeen.push(n))
    state.ping(4)
    state.ping(5)
    expect(onceSeen).toEqual([4])

    const offSeen: number[] = []
    const handler = (n: number) => offSeen.push(n)
    state.on('ping', handler)
    state.off('ping', handler)
    state.ping(6)
    expect(offSeen).toEqual([])
  })

  test('runs after-init callbacks once the state is initialized', async () => {
    const state = createTestState() as unknown as {
      isInitialized: boolean
      runAfterInit: (cb: () => void) => void
    }
    let ran = false
    state.runAfterInit(() => {
      ran = true
    })
    expect(ran).toBe(false)
    await flushState()
    expect(ran).toBe(true)
    expect(state.isInitialized).toBe(true)
  })

  test('logs a zod error and keeps the previous value', async () => {
    const state = createTestState()
    await flushState()
    const internal = state as unknown as { setState: (value: unknown) => unknown; count: number }
    internal.setState({ count: 'nope' })
    expect(state.count).toBe(0)
    expect(logMessages('error').some((message) => message.includes('state update'))).toBe(true)
  })

  test('quiet set skips subscribers', async () => {
    const state = createTestState()
    await flushState()
    let calls = 0
    const internal = state as unknown as {
      subscribe: (cb: () => void) => void
      __setStateQuietly: (value: unknown) => void
    }
    internal.subscribe(() => {
      calls += 1
    })
    internal.__setStateQuietly({ value: 'quiet' })
    await delay(0)
    expect(calls).toBe(0)
    expect(state.value).toBe('quiet')
    state.value = 'loud'
    await delay(0)
    expect(calls).toBe(1)
  })

  test('reads and writes paths', async () => {
    const state = createTestState()
    await flushState()
    const internal = state as unknown as {
      getPathValue: (path: string) => unknown
      setPathValue: (path: string, value: unknown) => void
    }
    expect(internal.getPathValue('value')).toBe('')
    internal.setPathValue('count', 4)
    expect(state.count).toBe(4)
  })

  test('subscribe, subscribeKey, subscribeSelector and subscribePath', async () => {
    const state = createTestState()
    await flushState()
    const internal = state as unknown as {
      subscribe: (cb: () => (() => void) | void) => () => void
      subscribeKey: (key: string, cb: (value: number) => void) => () => void
      subscribeSelector: (
        selector: (value: { value: string }) => string,
        cb: (value: string) => void,
      ) => void
      subscribePath: (path: string, cb: (value: number) => void) => void
    }

    const order: string[] = []
    internal.subscribe(() => {
      order.push('a')
      return () => order.push('a-after')
    })
    internal.subscribe(() => {
      order.push('b')
      return () => order.push('b-after')
    })
    state.value = 'z'
    await delay(0)
    expect(order).toEqual(['a', 'b', 'b-after', 'a-after'])

    const counts: number[] = []
    const unsubscribe = internal.subscribeKey('count', (value) => counts.push(value))
    state.count = 8
    await delay(0)
    state.value = 'other'
    await delay(0)
    unsubscribe()
    state.count = 9
    await delay(0)
    expect(counts).toEqual([8])

    const exported: number[] = []
    subscribeKey(state, 'count', (value) => exported.push(value as number))
    state.count = 10
    await delay(0)
    expect(exported).toEqual([10])

    const selected: string[] = []
    internal.subscribeSelector(
      (current) => current.value,
      (value) => selected.push(value),
    )
    state.value = 'selected'
    await delay(0)
    state.count = 11
    await delay(0)
    expect(selected).toEqual(['selected'])

    const paths: number[] = []
    internal.subscribePath('count', (value) => paths.push(value))
    state.count = 12
    await delay(0)
    expect(paths).toEqual([12])
  })

  test('shallowCompareAndUpdate skips equal values', async () => {
    const state = createTestState()
    await flushState()
    let calls = 0
    const internal = state as unknown as {
      subscribePath: (path: string, cb: () => void) => void
      shallowCompareAndUpdate: (path: string, value: unknown) => void
    }
    internal.subscribePath('meta', () => {
      calls += 1
    })
    internal.shallowCompareAndUpdate('meta', { a: 1 })
    await delay(0)
    expect(calls).toBe(0)
    internal.shallowCompareAndUpdate('meta', { a: 4 })
    await delay(0)
    expect(state.meta.a).toBe(4)
    expect(calls).toBe(1)
  })

  test('reset restores defaults', async () => {
    const state = createTestState()
    await flushState()
    state.value = 'changed'
    state.count = 3
    state.reset()
    expect(state.value).toBe('')
    expect(state.count).toBe(0)
  })

  test('syncs local storage when enabled and ignores it when disabled', async () => {
    const memory = createMemoryStorage()
    setStateStorage(memory)
    const id = nextStateId('local')
    memory.setJson(getStateUniqueId(id), {
      value: 'saved',
      count: 5,
      items: [{ id: 'a', n: 1 }],
    })

    const state = createTestState({ id, localStorageSync: true })
    expect(state.value).toBe('saved')
    expect(state.count).toBe(5)
    expect(state.items).toEqual([{ id: 'a', n: 1 }])

    state.value = 'next'
    await delay(0)
    expect(memory.getJson<{ value: string }>(getStateUniqueId(id))?.value).toBe('next')

    state.reset()
    await delay(0)
    expect(memory.getJson<{ value: string }>(getStateUniqueId(id))?.value).toBe('')

    const skippedId = nextStateId('skip')
    memory.setJson(getStateUniqueId(skippedId), { value: 'saved' })
    const skipped = createTestState({ id: skippedId, localStorageSync: false })
    expect(skipped.value).toBe('')
    skipped.value = 'x'
    await delay(0)
    expect(memory.getJson<{ value: string }>(getStateUniqueId(skippedId))?.value).toBe('saved')
  })

  test('logs a critical message for a duplicate id', () => {
    const id = nextStateId('dup')
    createTestState({ id })
    createTestState({ id })
    expect(logMessages('critical').some((message) => message.includes(`Duplicate id '${id}'`))).toBe(
      true,
    )
  })
})
