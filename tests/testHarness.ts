import { z } from 'zod'

import { stateFactory } from '../src/stateFactory/stateFactory.js'

let seq = 0

export function nextStateId(prefix = 'state') {
  seq += 1
  return `${prefix}-${seq}`
}

export function delay(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function flushState() {
  return delay(40)
}

export const testSchema = z.object({
  value: z.string().default(''),
  count: z.number().default(0),
  items: z
    .array(
      z.object({
        id: z.string(),
        n: z.number(),
      }),
    )
    .default([]),
  meta: z.object({ a: z.number() }).default({ a: 1 }),
  note: z.string().optional(),
})

export function createTestState(options?: { id?: string; localStorageSync?: boolean }) {
  return stateFactory({
    id: options?.id ?? nextStateId(),
    loggerCategory: 'test',
    schema: testSchema,
    getters: [],
    localStorageSync: options?.localStorageSync,
  })
}
