/**
 * Returns index of key in a map
 *
 * @example
 * getMapKeyIndex(new Map([['a', 1], ['b', 2]]), 'b') => 1
 */
export function getMapKeyIndex<K>(map: Map<K, unknown>, key: K): number {
  const keysArray = Array.from(map.keys())
  return keysArray.indexOf(key)
}
