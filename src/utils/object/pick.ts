import { PickDefined, PlainObject } from '../types/index.js'

/**
 * Returns new object produced from obj with keys
 *
 * @example
 * pick({ a: 1, b: 2, c: 3 }, ['a', 'b']) => { a: 1, b: 2 }
 */
export function pick<O extends PlainObject, K extends keyof O, T extends string>(
  obj: O,
  keys: Readonly<(K | T)[]>
): PickDefined<O, T> {
  const result = {} as PickDefined<O, T>

  for (const key of keys) {
    if (obj[key as K] !== undefined) {
      const value = obj[key as K]
      // @ts-ignore
      result[key] = value
    }
  }

  return result
}
