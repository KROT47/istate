import { getEntries } from './getEntries.js'
import { isObject } from '../lang/index.js'
import { JsObject } from '../types/index.js'

/**
 * Goes through an object in reverse ({}, Array, Map, Set)
 *
 * PlainObject ({}) may not preserve order!
 *
 * @example
 * forEachReverse(new Map([['a', 1], ['b', 2]]), (value, key) => console.log(value, key))
 * // 2, 'b'
 * // 1, 'a'
 */
export function forEachReverse<T extends JsObject>(
  iterable: T,
  cb: T extends Set<infer V>
    ? (value: V, key: number) => void
    : T extends Map<infer K, infer V>
    ? (value: V, key: K) => void
    : T extends (infer V)[]
    ? (value: V, key: number) => void
    : T extends Record<infer K, infer V>
    ? (value: V, key: K) => void
    : never
) {
  if (!isObject(iterable)) return
  getEntries(iterable)
    .reverse()
    .forEach(([key, value]) => cb(value, key))
}
