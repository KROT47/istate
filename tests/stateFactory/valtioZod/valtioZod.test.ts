import { describe, expect, test } from 'vitest'
import { z } from 'zod'

import { delay } from '../../testHarness.js'
import { valtioZod } from '../../../src/stateFactory/valtioZod/valtioZod.js'
import { getVersion, ref, snapshot, subscribeKey } from '../../../src/stateFactory/valtioZod/utils/index.js'

describe('valtioZod', () => {
  test('rejects a primitive schema and a non-object', () => {
    expect(() => valtioZod(z.string() as never)).toThrow(/primitive/)
    expect(() => valtioZod(z.object({ a: z.string() })).proxy(null as never)).toThrow(/object/)
  })

  test('rejects an invalid assignment and reports it', () => {
    const errors: Array<string | symbol> = []
    const state = valtioZod(z.object({ count: z.number() }), {
      handleError: (_error, prop) => errors.push(prop),
    }).proxy({ count: 1 })

    expect(() => {
      state.count = 'nope' as never
    }).toThrow(TypeError)
    expect(state.count).toBe(1)
    expect(errors).toEqual(['count'])
  })

  test('validates nested objects and strips unknown keys', () => {
    const state = valtioZod(
      z.object({
        user: z.object({ name: z.string() }),
      }),
    ).proxy({ user: { name: 'Ada' } })

    state.user.name = 'Bea'
    expect(state.user.name).toBe('Bea')
    expect(() => {
      state.user.name = 1 as never
    }).toThrow(TypeError)
    expect(state.user.name).toBe('Bea')

    const loose = valtioZod(z.object({ a: z.string() })).proxy({ a: 'x' }) as { a: string; b?: number }
    loose.b = 1
    expect(loose.b).toBeUndefined()

    const strict = valtioZod(z.object({ a: z.string() }).strict()).proxy({ a: 'x' }) as {
      a: string
      extra?: boolean
    }
    expect(() => {
      strict.extra = true
    }).toThrow(/not defined/)
  })

  test('snapshot, getVersion, subscribeKey and ref follow the inner store', async () => {
    const state = valtioZod(z.object({ name: z.string() })).proxy({ name: 'Ada' })
    expect(snapshot(state)).toMatchObject({ name: 'Ada' })
    expect(getVersion(state)).toBeTypeOf('number')
    expect(ref).toBeTypeOf('function')

    const seen: string[] = []
    subscribeKey(state, 'name', (value) => seen.push(String(value)))
    state.name = 'Bea'
    await delay(0)
    expect(seen).toEqual(['Bea'])
  })
})
