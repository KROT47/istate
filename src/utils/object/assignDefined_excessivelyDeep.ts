import { AssignDefined } from '../types/index.js'

/**
 * Returns resulting object from array of objects after Object.assign with filtered out undefined values
 *
 * May produce TS exessively deep error so use with caution or use assignDefined
 *
 * @example
 * assignDefined_excessivelyDeep({ a: 1, b: 1 }, { b: 'str', d: undefined }, { c: string })
 * => { a: number, b: string, c: string }
 */
export function assignDefined_excessivelyDeep<O extends object, S extends object[]>(
  target: O,
  ...sources: S
): AssignDefined<[O, ...S]> {
  for (const source of sources) {
    for (const key of Object.keys(source)) {
      const val = source[key]
      if (val === undefined) continue
      target[key] = val
    }
  }
  // @ts-ignore
  return target
}
