import { describe, expect, test, vi } from 'vitest'
import { z } from 'zod'

import { isDev } from '../../../../src/utils/envHelpers.js'
import { logMessages } from '../../../testSetup.js'
import { delay, flushState, nextStateId } from '../../../testHarness.js'
import { stateFactory } from '../../../../src/stateFactory/stateFactory.js'
import { getStateUniqueId } from '../../../../src/stateFactory/utils/getStateUniqueId.js'
import { createMemoryStorage, setStateStorage } from '../../../../src/storage.js'

const itemSchema = z.object({
  id: z.string(),
  n: z.number(),
})

const listSchema = z.object({
  items: z.array(itemSchema).default([]),
})

const settingsSchema = z.object({
  settings: z
    .object({
      id: z.string().default('settings'),
      flag: z.boolean().default(false),
    })
    .default({}),
})

async function waitForCalls(fn: { mock: { calls: unknown[] } }, min = 1) {
  for (let i = 0; i < 20; i += 1) {
    if (fn.mock.calls.length >= min) return
    await delay(15)
  }
  throw new Error(`expected at least ${min} calls, got ${fn.mock.calls.length}`)
}

async function waitUntilQuiet(fn: { mock: { calls: unknown[] } }) {
  let last = -1
  for (let i = 0; i < 12; i += 1) {
    await delay(20)
    if (fn.mock.calls.length > 0 && fn.mock.calls.length === last) return
    last = fn.mock.calls.length
  }
  throw new Error('sync did not settle')
}

function persistKey(id: string) {
  return `${getStateUniqueId(id)}_sync`
}

describe('sync extension', () => {
  test('isDev is on so duplicate sync registration is reported', () => {
    expect(isDev).toBe(true)
  })

  test('force-syncs an array and an object, including updated and deleted rows', async () => {
    const memory = createMemoryStorage()
    setStateStorage(memory)
    const id = nextStateId('sync-list')
    const sync = vi.fn(async (data: unknown) => data)
    const state = stateFactory({
      id,
      loggerCategory: 'test',
      schema: listSchema,
      getters: [],
      setPrototype: (baseProto) => ({ ...baseProto }),
    })
    await flushState()

    state.addSync({
      path: 'items',
      uniqueKeyGetter: (item) => item.id,
      errorHandler: () => undefined,
      sync,
    })
    state.items.push({ id: 'a', n: 1 })
    await waitForCalls(sync)
    await waitUntilQuiet(sync)

    const before = sync.mock.calls.length
    state.items[0]!.n = 2
    await waitForCalls(sync, before + 1)
    const updatedCall = sync.mock.calls.at(-1)?.[0] as Array<{ id: string; n: number; updatedAt?: string }>
    expect(updatedCall.some((item) => item.id === 'a' && item.n === 2 && item.updatedAt)).toBe(true)

    const beforeDelete = sync.mock.calls.length
    state.items.pop()
    await waitForCalls(sync, beforeDelete + 1)
    const deletedCall = sync.mock.calls.at(-1)?.[0] as Array<{ id: string; deletedAt?: string }>
    expect(deletedCall.some((item) => item.id === 'a' && item.deletedAt)).toBe(true)

    const settingsSync = vi.fn(async (data: { flag: boolean } | undefined) => ({
      id: 'settings',
      flag: data?.flag ?? false,
    }))
    const settings = stateFactory({
      id: nextStateId('sync-object'),
      loggerCategory: 'test',
      schema: settingsSchema,
      getters: [],
    })
    await flushState()
    settings.addSync({
      path: 'settings',
      uniqueKeyGetter: () => 'settings',
      errorHandler: () => undefined,
      sync: settingsSync,
    })
    await waitForCalls(settingsSync)
    const firstObject = settingsSync.mock.calls[0]?.[0]
    expect(Array.isArray(firstObject)).toBe(false)
    settings.settings.flag = true
    await waitUntilQuiet(settingsSync)
    expect(settingsSync.mock.calls.at(-1)?.[0]).toMatchObject({ flag: true, updatedAt: expect.any(String) })
    expect(memory.getJson(persistKey(id))).toBeTruthy()
  })

  test('reports sync failures and does not apply a failed response', async () => {
    const sync = vi.fn(async () => {
      throw new Error('offline')
    })
    const errors: unknown[] = []
    const state = stateFactory({
      id: nextStateId('sync-error'),
      loggerCategory: 'test',
      schema: listSchema,
      getters: [],
    })
    await flushState()
    state.items.push({ id: 'a', n: 1 })
    state.addSync({
      path: 'items',
      uniqueKeyGetter: (item) => item.id,
      errorHandler: (error) => errors.push(error),
      sync,
    })
    await waitForCalls(sync)
    await delay(20)
    expect(errors[0]).toEqual(expect.objectContaining({ message: 'offline' }))
    expect(state.items).toEqual([{ id: 'a', n: 1 }])
  })

  test('runs sync again when a change arrives while a sync is in flight', async () => {
    const state = stateFactory({
      id: nextStateId('sync-reentry'),
      loggerCategory: 'test',
      schema: listSchema,
      getters: [],
    })
    await flushState()
    let started = 0
    const sync = vi.fn(async () => {
      started += 1
      if (started === 1) {
        state.items.push({ id: 'b', n: 2 })
        await delay(10)
      }
      return state.items.map((item) => ({ ...item }))
    })
    state.addSync({
      path: 'items',
      uniqueKeyGetter: (item) => item.id,
      errorHandler: () => undefined,
      sync,
    })
    state.items.push({ id: 'a', n: 1 })
    await waitForCalls(sync, 2)
    expect(state.items.map((item) => item.id).sort()).toEqual(['a', 'b'])
  })

  test('reset clears persisted sync data', async () => {
    const memory = createMemoryStorage()
    setStateStorage(memory)
    const id = nextStateId('sync-reset')
    const sync = vi.fn(async (data: unknown) => data)
    const state = stateFactory({
      id,
      loggerCategory: 'test',
      schema: listSchema,
      getters: [],
    })
    await flushState()
    state.addSync({
      path: 'items',
      uniqueKeyGetter: (item) => item.id,
      errorHandler: () => undefined,
      sync,
    })
    state.items.push({ id: 'a', n: 1 })
    await waitUntilQuiet(sync)
    expect(memory.getJson<Record<string, unknown>>(persistKey(id))?.items).toBeTruthy()

    const callsAfterSettle = sync.mock.calls.length
    state.reset()
    await delay(30)
    expect(sync.mock.calls.length).toBe(callsAfterSettle)
    expect(memory.getJson<Record<string, unknown>>(persistKey(id))?.items).toBeUndefined()
    expect(state.items).toEqual([])
  })

  test('logs a critical message when the same path is registered twice', async () => {
    const state = stateFactory({
      id: nextStateId('sync-dup'),
      loggerCategory: 'test',
      schema: listSchema,
      getters: [],
    })
    await flushState()
    const sync = {
      path: 'items' as const,
      uniqueKeyGetter: (item: { id: string }) => item.id,
      errorHandler: () => undefined,
      sync: async (data: unknown) => data,
    }
    state.addSync(sync)
    state.addSync(sync)
    await delay(20)
    expect(logMessages('critical').some((message) => message.includes("Sync for path 'items'"))).toBe(
      true,
    )
  })

  test('logs a critical message when the path has no value', async () => {
    const state = stateFactory({
      id: nextStateId('sync-empty'),
      loggerCategory: 'test',
      schema: z.object({
        box: z.object({ id: z.string() }).nullable().default(null),
      }),
      getters: [],
    })
    await flushState()
    state.addSync({
      path: 'box',
      uniqueKeyGetter: () => 'box',
      errorHandler: () => undefined,
      sync: async () => null,
    } as never)
    await delay(20)
    expect(logMessages('critical').some((message) => message.includes("path 'box'"))).toBe(true)
  })

  test('unsubscribe stops further sync', async () => {
    const sync = vi.fn(async (data: unknown) => data)
    const state = stateFactory({
      id: nextStateId('sync-off'),
      loggerCategory: 'test',
      schema: listSchema,
      getters: [],
    })
    await flushState()
    const unsubscribe = state.addSync({
      path: 'items',
      uniqueKeyGetter: (item) => item.id,
      errorHandler: () => undefined,
      sync,
    })
    state.items.push({ id: 'a', n: 1 })
    await waitUntilQuiet(sync)
    const settled = sync.mock.calls.length
    unsubscribe()
    state.items[0]!.n = 9
    await delay(30)
    expect(sync.mock.calls.length).toBe(settled)
  })
})
