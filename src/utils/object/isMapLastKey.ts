import { getMapKeyIndex } from './getMapKeyIndex.js'

/**
 * Returns true if key is last in map
 *
 * @example
 * isMapLastKey(new Map([['a', 1], ['b', 2]]), 'b') => true
 */
export function isMapLastKey<K>(map: Map<K, unknown>, key: K): boolean {
  return getMapKeyIndex(map, key) === map.size - 1
}
