import { isMap, isSet } from '../lang/index.js'
import { _IntentionalAny } from '../types/index.js'

/**
 * Returns an array of [key, value] of an object ({}, Array, Map, Set)
 *
 * In comparison to Set.entries
 *
 * @example
 * getEntries({ a: 1, b: 2 }) => [['a', 1], ['b', 2]]
 * getEntries([1, 2, 3]) => [[0, 1], [1, 2], [2, 3]]
 * getEntries(new Map([['a', 1], ['b', 2]])) => [['a', 1], ['b', 2]]
 * getEntries(new Set([1, 2, 3])) => [[0, 1], [1, 2], [2, 3]]
 *
 * @example
 * Array.from((new Set([1, 2, 3])).entries()) => [[1, 1], [2, 2], [3, 3]] // in native Set.entries keys equals values!
 */
export function getEntries<
  T extends
    | Map<_IntentionalAny, _IntentionalAny>
    | Set<_IntentionalAny>
    | Record<_IntentionalAny, _IntentionalAny>
    | _IntentionalAny[]
>(
  x: T
): T extends Set<infer V>
  ? [number, V][]
  : T extends Map<infer K, infer V>
  ? [K, V][]
  : T extends (infer V)[]
  ? [number, V][]
  : T extends Record<infer K, infer V>
  ? [K, V][]
  : never {
  if (isSet(x)) {
    const entries: [number, unknown][] = []
    let i = 0
    x.forEach((value) => entries.push([i++, value]))
    // @ts-ignore
    return entries
  }
  if (isMap(x)) {
    // @ts-ignore
    return Array.from(x.entries())
  }
  // @ts-ignore
  return Object.entries(x)
}
