import { describe, expect, test, vi } from 'vitest'

import { forEachState, registerState, stateFactory, valtioZod } from '../src/index.js'
import { defaultInitScheduler, setInitScheduler } from '../src/initScheduler.js'
import { createConsoleStateLogger } from '../src/logger.js'
import { getStateUniqueId } from '../src/stateFactory/utils/getStateUniqueId.js'
import { createLocalStorage, createMemoryStorage, setStateStorage } from '../src/storage.js'
import { createTestState, delay, flushState } from './testHarness.js'

describe('logger, storage, init', () => {
  test('console logger prefixes the category', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const logger = createConsoleStateLogger(['app', 'state', 'cart'])
    logger.error('boom', 1)
    logger.critical('bad', 2)
    expect(spy).toHaveBeenNthCalledWith(1, 'app:state:cart', 'boom', 1)
    expect(spy).toHaveBeenNthCalledWith(2, 'app:state:cart', 'bad', 2)
    spy.mockRestore()
  })

  test('memory and local storage round-trip json', () => {
    const memory = createMemoryStorage()
    expect(memory.getJson('missing')).toBeNull()
    memory.setJson('a', { n: 1 })
    expect(memory.getJson('a')).toEqual({ n: 1 })
    memory.clear()
    expect(memory.getJson('a')).toBeNull()

    const backing = new Map<string, string>()
    const local = createLocalStorage({
      getItem: (key) => backing.get(key) ?? null,
      setItem: (key, value) => {
        backing.set(key, value)
      },
      removeItem: (key) => {
        backing.delete(key)
      },
      clear: () => {
        backing.clear()
      },
    })
    local.setJson('k', { ok: true })
    expect(local.getJson('k')).toEqual({ ok: true })
    backing.set('bad', '{')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(local.getJson('bad')).toBeNull()
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  test('scheduler can defer init, and the default scheduler still initializes', async () => {
    let queued: (() => void) | undefined
    setInitScheduler((task) => {
      queued = () => {
        void task()
      }
    })
    const deferred = createTestState()
    expect(deferred.isInitialized).toBe(false)
    queued?.()
    await flushState()
    expect(deferred.isInitialized).toBe(true)

    setInitScheduler(defaultInitScheduler)
    const state = createTestState()
    expect(state.isInitialized).toBe(false)
    await flushState()
    expect(state.isInitialized).toBe(true)
  })

  test('setStateStorage replaces the storage used by states', async () => {
    const memory = createMemoryStorage()
    setStateStorage(memory)
    const state = createTestState({ id: 'storage-swap', localStorageSync: true })
    await flushState()
    state.value = 'stored'
    await delay(0)
    expect(memory.getJson<{ value: string }>(getStateUniqueId('storage-swap'))).toMatchObject({
      value: 'stored',
    })
  })
})

describe('public exports', () => {
  test('root entry exposes the factory, registry and valtio helpers', () => {
    expect(stateFactory).toBeTypeOf('function')
    expect(valtioZod).toBeTypeOf('function')
    expect(registerState).toBeTypeOf('function')
    expect(forEachState).toBeTypeOf('function')
  })
})
