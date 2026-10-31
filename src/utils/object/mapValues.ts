import { PlainObject } from '../types/index.js'

/**
 * Returns new object with mapped values
 *
 * @example
 * mapValues(obj, (_, k) => `_${k}`)
 * => { a: string, b: string }
 *
 * @example
 * mapValues(obj, (_, k) => `_${k}` as const)
 * => { a: '_a' | '_b', b: '_a' | '_b' }
 *
 * @example
 * import { Fn } from 'hotscript'
 * interface UnderscoreFn extends Fn { return: `_${this['arg0']}` }
 * mapValues(obj, (_, k) => `_${k}` as const, {} as ObjectFromKeysMapper<keyof typeof obj, UnderscoreFn>)
 * => { a: '_a', b: '_a' }
 *
 * @example
 * import { Fn } from 'hotscript'
 * interface UnderscoreFn extends Fn { return: `_${this['arg0']}` }
 * mapValues<typeof obj, ObjectFromKeysMapper<keyof typeof obj, UnderscoreFn>>(obj, (_, k) => `_${k}`)
 * => { a: '_a', b: '_a' }
 */
export function mapValues<O extends PlainObject, K extends keyof O, V extends O[K], RV>(
  obj: O,
  mapper: (value: V, key: K, obj: O) => RV
): {
  [X in K]: RV
}
export function mapValues<O extends PlainObject, M extends Record<keyof O, unknown>>(
  obj: O,
  mapper: (value: O[keyof O], key: keyof O, obj: O) => M[keyof O],
  x?: M
): {
  [K in keyof O]: M[K]
}
export function mapValues<O extends PlainObject, K extends keyof O, V extends O[K], RV>(
  obj: O,
  mapper: (value: V, key: K, obj: O) => RV
): Record<K, RV> {
  const result = {} as Record<K, RV>
  for (const key in obj) {
    if (!Object.hasOwn(obj, key)) continue
    // @ts-ignore
    result[key] = mapper(obj[key], key, obj)
  }
  return result
}
